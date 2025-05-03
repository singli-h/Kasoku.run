import React, { useMemo, useState } from 'react'
import { useSession } from './session-context'
import { Button } from '@/components/ui/button'
import { mutate } from 'swr'

export default function SessionHeader({ onConfigRuns }) {
  const { activeGroup, athletes, presets, trainingSessions, trainingDetails } = useSession()
  const [actionLoading, setActionLoading] = useState(false)

  // Derive run headers (index + distance) from presets, ensuring at least four runs
  const runHeaders = useMemo(() => {
    const map = new Map()
    // Map each set_index to its DB distance (last one wins)
    presets.forEach(p => map.set(p.set_index, p.distance))
    // Ensure at least the first four runs exist
    for (let i = 1; i <= 4; i++) {
      if (!map.has(i)) map.set(i, 0)
    }
    // Build array of { idx, distance } sorted by idx
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, distance]) => ({ idx, distance }))
  }, [presets])

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
    // Build CSV: header then rows, including distances
    const header = ['Athlete', ...runHeaders.map(r => `Run ${r.idx} (${r.distance}m)`)]
    const rows = athletes.map(a => {
      const row = [a.name]
      runHeaders.forEach(r => {
        const sid = sessionMap[a.id]
        const key = `${sid}:${r.idx}`
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
    a.download = `session-${activeGroup.name}-${activeGroup.date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Determine session-state controls
  const hasPending = trainingSessions.some(s => s.status === 'pending')
  const hasOngoing = trainingSessions.some(s => s.status === 'ongoing')
  
  const startSession = async () => {
    setActionLoading(true)
    await fetch(`/api/coach/sessions/${activeGroup.id}/start`, { method: 'PATCH', credentials: 'include' })
    await mutate('/api/coach/sessions')
    setActionLoading(false)
  }
  const completeSession = async () => {
    setActionLoading(true)
    await fetch(`/api/coach/sessions/${activeGroup.id}/complete`, { method: 'PATCH', credentials: 'include' })
    await mutate('/api/coach/sessions')
    setActionLoading(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          {typeof activeGroup.group_name === 'object'
            ? activeGroup.group_name.group_name
            : activeGroup.group_name || activeGroup.name}
        </h2>
        <p className="text-sm text-gray-500">{activeGroup.date}</p>
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
        <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
      </div>
    </div>
  )
} 