"use client"

import React, { useMemo, useState } from 'react'
import { useSession } from './session-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from '@/components/ui/use-toast'
import { mutate } from 'swr'

export default function SessionHeader({ onConfigRuns }) {
  const { groups, activeGroup, athletes, presetGroups, trainingSessions, trainingDetails } = useSession()
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  // Only operate on all groups sharing the current activeGroup date
  const sameDateGroups = useMemo(() => groups.filter(g => g.date === activeGroup?.date), [groups, activeGroup?.date])

  // Determine flow state
  const hasPending = trainingSessions.some(s => s.status === 'pending')
  const hasOngoing = trainingSessions.some(s => s.status === 'ongoing')
  // allow update when session not pending or ongoing
  const canUpdate = !hasPending && !hasOngoing
  const isLocked = hasPending

  // Derive run headers including exercise name
  const runHeaders = useMemo(() => {
    const headers = []
    if (!presetGroups) return headers
    // sort groups by order, flatten each detail, and include exercise name
    presetGroups
      .slice()
      .sort((a,b) => a.order - b.order)
      .forEach(pg => {
        pg.details
          .slice()
          .sort((a,b) => a.set_index - b.set_index)
          .forEach(detail => {
            headers.push({ setIndex: detail.set_index, distance: detail.distance, name: pg.name })
          })
      })
    return headers.map((h,i) => ({ idx: i+1, ...h }))
  }, [presetGroups])

  const sessionMap = useMemo(() => {
    const m = {}
    trainingSessions.forEach(s => { m[s.athlete_id] = s.id })
    return m
  }, [trainingSessions])

  const detailMap = useMemo(() => {
    const m = {}
    trainingDetails.forEach(d => {
      m[`${d.exercise_training_session_id}:${d.set_index}`] = d
    })
    return m
  }, [trainingDetails])

  const exportCsv = () => {
    // Build CSV with exercise name headers
    const header = ['Athlete', ...runHeaders.map(r => `${r.distance}m ${r.name}`)]
    const rows = athletes.map(a => {
      const row = [a.name]
      runHeaders.forEach(r => {
        const sid = sessionMap[a.id]
        const key = `${sid}:${r.setIndex}`
        const detail = sid ? detailMap[key] : null
        row.push(detail?.duration != null ? detail.duration.toFixed(2) : '')
      })
      return row
    })
    const all = [header, ...rows]
    const csvContent = all.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sessions-${activeGroup.date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Determine session-state controls
  const startSession = async () => {
    setActionLoading(true)
    try {
      // Start sessions for all groups on the same date
      await Promise.all(sameDateGroups.map(g =>
        fetch(`/api/coach/sessions/${g.id}/start`, { method: 'PATCH', credentials: 'include' })
      ))
      await mutate('/api/coach/sessions')
      toast({ title: 'Session started', description: 'Group session is now ongoing.', variant: 'success' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Error starting session', description: err.message || 'Failed to start session.', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }
  const completeSession = async () => {
    setActionLoading(true)
    try {
      // Complete sessions for all groups on the same date
      await Promise.all(sameDateGroups.map(g =>
        fetch(`/api/coach/sessions/${g.id}/complete`, { method: 'PATCH', credentials: 'include' })
      ))
      await mutate('/api/coach/sessions')
      toast({ title: 'Session completed', description: 'Group session has been completed.', variant: 'success' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Error completing session', description: err.message || 'Failed to complete session.', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }
  const updateSession = async () => {
    setActionLoading(true)
    try {
      // Refresh all sessions
      await mutate('/api/coach/sessions')
      toast({ title: 'Session updated', variant: 'success' })
    } catch {} finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
      <div>
        <p className="text-xl">{activeGroup.date}</p>
      </div>
      <div className="flex space-x-2">
        {hasPending && (
          <Button size="sm" onClick={startSession} disabled={actionLoading}>
            {actionLoading ? 'Starting...' : 'Start Session'}
          </Button>
        )}
        {hasOngoing && (
          <Button size="sm" variant="outline" onClick={completeSession} disabled={actionLoading}>
            {actionLoading ? 'Finishing...' : 'Complete Session'}
          </Button>
        )}
        {canUpdate && (
          <Button size="sm" variant="outline" onClick={updateSession} disabled={actionLoading}>
            {actionLoading ? 'Updating...' : 'Update Session'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
      </div>
    </div>
  )
} 