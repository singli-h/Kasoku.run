"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'

// Context to hold session data for group training sessions
const SessionContext = createContext(null)
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

// Helper to parse Postgres 'interval' (HH:MM:SS) into seconds
function parsePgIntervalToSeconds(interval) {
  if (interval == null) return null
  if (typeof interval === 'string') {
    const parts = interval.split(':')
    if (parts.length !== 3) return null
    const [hours, mins, secs] = parts
    const h = parseInt(hours, 10) || 0
    const m = parseInt(mins, 10) || 0
    const s = parseFloat(secs) || 0
    return h * 3600 + m * 60 + s
  }
  // already a number
  return interval
}

export function SessionProvider({ children }) {
  // We'll use fetch to call our server routes to modify training details
  // helper to call our Next.js API
  const fetcher = url => fetch(url, { credentials: 'include' }).then(res => res.json())

  // 1) Get all sessions for this coach; server route handles authentication and coach lookup
  const { data: sessJson, error: sessErr } = useSWR('/api/coach/sessions', fetcher)
  // Use API responses (already flattened) directly
  const groups = sessJson?.sessions || []

  // 2) Determine active group: today, next, last
  const [activeGroup, setActiveGroup] = useState(null)
  useEffect(() => {
    if (!groups.length) return
    const today = new Date().toISOString().split('T')[0]
    let sel = groups.find(g => g.date === today)
    if (!sel) sel = groups.find(g => g.date > today)
    if (!sel) sel = [...groups].reverse().find(g => g.date < today)
    setActiveGroup(sel || null)
  }, [groups])

  // 3) Ensure training sessions exist once per group (retry on failure)
  const createdSessions = useRef({})
  useEffect(() => {
    if (!activeGroup) return
    const gid = activeGroup.id
    // If sessions already exist for this group, skip creation
    if (trainingSessions.length > 0) return
    if (createdSessions.current[gid]) return
    createdSessions.current[gid] = true
    fetch(`/api/coach/sessions/${gid}/sessions`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          // mark as not created so we can retry
          createdSessions.current[gid] = false
          throw new Error(`Create sessions failed with ${res.status}`)
        }
        mutate('/api/coach/sessions')
      })
      .catch(err => {
        console.error('Error creating sessions:', err)
      })
  }, [activeGroup])

  // 3) Load all athletes via API and filter by active group
  const { data: athJson, error: athErr } = useSWR(
    () => '/api/athletes',
    fetcher
  )
  const athletesAll = athJson?.data || []
  const athletes = activeGroup
    ? athletesAll.filter(a => a.athlete_group_id === activeGroup.athlete_group_id)
    : []

  // 4) Derive presets from activeGroup (filter only Sprint/Plyo)
  const presets = activeGroup
    ? activeGroup.exercise_presets
      .filter(p => [2, 6].includes(p.exercises?.exercise_type_id))
      .flatMap(p =>
        p.exercise_preset_details.map(d => ({
          preset_id: p.id,
          set_index: d.set_index,
          distance: d.distance
        }))
      )
    : []

  // Identify the sprint preset and map run index → exercise_preset_id
  const sprintPresetId = activeGroup?.exercise_presets.find(
    p => p.exercises?.exercise_type_id === 6
  )?.id
  const getPresetId = si =>
    presets.find(p => p.set_index === si)?.preset_id ?? sprintPresetId

  // 5) trainingSessions loaded in activeGroup via server route
  const trainingSessions = activeGroup
    ? activeGroup.exercise_training_sessions
    : []

  // 6) Derive trainingDetails from activeGroup
  const trainingDetails = trainingSessions.flatMap(s =>
    s.exercise_training_details.map(d => ({
      ...d,
      // convert duration (interval string) into numeric seconds for UI
      duration: parsePgIntervalToSeconds(d.duration),
      exercise_training_session_id:   d.exercise_training_session_id || s.id,
      exercise_preset_id:             d.exercise_preset_id,
      set_index:                      d.set_index,
      athlete_id:                     s.athlete_id
    }))
  )

  // 7) Upsert helpers
  const upsertDetail = async ({ athleteId, presetId, setIndex, fields }) => {
    // POST to our new training-details API route
    const res = await fetch(
      `/api/coach/sessions/${activeGroup.id}/training-details`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, presetId, setIndex, fields })
      }
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Upsert detail failed: ${text}`)
    }
    // Refresh sessions data (including the updated training_details)
    await mutate('/api/coach/sessions')
  }

  // Save/update a single athlete's time
  const saveTime = (athleteId, setIndex, duration) =>
    upsertDetail({
      athleteId,
      presetId: getPresetId(setIndex),
      setIndex,
      fields: { duration }
    })

  // Change distance for all athletes on a given run
  const changeDistance = (setIndex, distance) =>
    Promise.all(
      athletes.map(a =>
        upsertDetail({
          athleteId: a.id,
          presetId:  getPresetId(setIndex),
          setIndex,
          fields:    { distance }
        })
      )
    )

  // Add a new run (distance) for all athletes
  const addRun = (setIndex, distance) =>
    Promise.all(
      athletes.map(a =>
        upsertDetail({
          athleteId: a.id,
          presetId:  getPresetId(setIndex),
          setIndex,
          fields:    { distance }
        })
      )
    )

  // Remove a run for all athletes via DELETE on our training-details API
  const removeRun = (setIndex) =>
    Promise.all(
      athletes.map(a =>
        fetch(
          `/api/coach/sessions/${activeGroup.id}/training-details`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              athleteId: a.id,
              presetId:  getPresetId(setIndex),
              setIndex
            })
          }
        ).then(res => {
          if (!res.ok) throw new Error('Delete failed')
        })
      )
    ).then(() =>
      mutate('/api/coach/sessions')
    )

  // Save distance for a single athlete on a specific run
  const saveDistance = (athleteId, setIndex, distance) =>
    upsertDetail({
      athleteId,
      presetId: getPresetId(setIndex),
      setIndex,
      fields: { distance }
    })

  const isLoading = sessErr || athErr
  const value = { activeGroup, athletes, presets, trainingSessions, trainingDetails, saveTime, saveDistance, changeDistance, addRun, removeRun, isLoading, error: sessErr || athErr }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// Hook to reuse existing upsert logic without supabase client here
function useSessionUpserts() {
  // import from previous session-context or refactor to share these functions
  // placeholder: actually import these methods from a shared module
  // e.g. import { saveTime, changeDistance, addRun, removeRun } from '@/lib/sessionUpserts'
  return { saveTime: (...args) => {}, changeDistance: (...args) => {}, addRun: (...args) => {}, removeRun: (...args) => {} }
} 