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

export function SessionProvider({ overrideGroup = null, children }) {
  // We'll use fetch to call our Next.js API
  const fetcher = url => fetch(url, { credentials: 'include' }).then(res => res.json())

  // 1) Get all sessions for this coach; server route handles authentication and coach lookup
  const { data: sessJson, error: sessErr } = useSWR('/api/coach/sessions', fetcher)
  // Use API responses (already flattened) directly
  const groups = sessJson?.sessions || []

  // 2) Determine active group, allowing overrideGroup to take precedence
  const [activeGroup, setActiveGroup] = useState(overrideGroup || null)
  useEffect(() => {
    if (overrideGroup) {
      setActiveGroup(overrideGroup)
      return
    }
    if (!groups.length) return
    const today = new Date().toISOString().split('T')[0]
    let sel = groups.find(g => g.date === today)
    if (!sel) sel = groups.find(g => g.date > today)
    if (!sel) sel = [...groups].reverse().find(g => g.date < today)
    setActiveGroup(sel || null)
  }, [groups, overrideGroup])

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

  // 4) Derive all sprint-type preset groups (flat, hill, resisted, etc.)
  const sprintTypeIds = [6 /* flat sprint */, 7 /* hill sprint */, 8 /* resisted sprint */]
  const presetGroups = activeGroup
    ? activeGroup.exercise_presets
        .filter(p => sprintTypeIds.includes(p.exercises.exercise_type_id))
        .map(p => ({
          id: p.id,
          exerciseId: p.exercise_id,
          order: p.preset_order,
          name: p.metadata?.exerciseName || p.exercises.name,
          details: p.exercise_preset_details
            .sort((a,b) => a.set_index - b.set_index)
            .map(d => ({ set_index: d.set_index, distance: d.distance }))
        }))
    : []

  // 5) trainingSessions loaded in activeGroup via server route
  const trainingSessions = activeGroup
    ? activeGroup.exercise_training_sessions
    : []

  // 6) Derive flattened trainingDetails for all presets
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

  // Save/update a single athlete's time for a given preset
  const saveTime = (athleteId, presetId, setIndex, duration) =>
    upsertDetail({ athleteId, presetId, setIndex, fields: { duration } })

  // Change distance for all athletes on a given preset-run
  const changeDistance = (presetId, setIndex, distance) =>
    Promise.all(
      athletes.map(a =>
        upsertDetail({ athleteId: a.id, presetId, setIndex, fields: { distance } })
      )
    )

  // Add a new run (distance) for all athletes under a preset
  const addRun = (presetId, setIndex, distance) =>
    Promise.all(
      athletes.map(a =>
        upsertDetail({ athleteId: a.id, presetId, setIndex, fields: { distance } })
      )
    )

  // Remove a run for all athletes via DELETE on our training-details API
  const removeRun = (presetId, setIndex) =>
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
              presetId,
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
  const saveDistance = (athleteId, presetId, setIndex, distance) =>
    upsertDetail({ athleteId, presetId, setIndex, fields: { distance } })

  const isLoading = sessErr || athErr
  const value = {
    groups,
    athletesAll,
    activeGroup,
    athletes,
    presetGroups,
    trainingSessions,
    trainingDetails,
    saveTime,
    saveDistance,
    changeDistance,
    addRun,
    removeRun,
    isLoading: Boolean(sessErr || athErr),
    error: sessErr || athErr
  }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// Hook to reuse existing upsert logic without supabase client here
function useSessionUpserts() {
  // import from previous session-context or refactor to share these functions
  // placeholder: actually import these methods from a shared module
  // e.g. import { saveTime, changeDistance, addRun, removeRun } from '@/lib/sessionUpserts'
  return { saveTime: (...args) => {}, changeDistance: (...args) => {}, addRun: (...args) => {}, removeRun: (...args) => {} }
} 