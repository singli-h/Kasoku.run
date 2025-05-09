"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Plus, MoreVertical, Check, X, Lock } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useSession } from "./session-context"

export default function GroupSection() {
  const {
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
  } = useSession()

  const [expanded, setExpanded] = useState(true)

  // Build initial runs list (flatten presetGroups) with distance and name
  const initialRuns = useMemo(() => {
    if (!presetGroups) return []
    const list = []
    presetGroups.slice().sort((a,b)=>a.order-b.order).forEach(pg => {
      pg.details.slice().sort((a,b)=>a.set_index-b.set_index).forEach(detail => {
        list.push({
          presetId: pg.id,
          setIndex: detail.set_index,
          distance: detail.distance,
          name: pg.name
        })
      })
    })
    return list.map((r,i) => ({ ...r, idx: i+1 }))
  }, [presetGroups])

  // Local runs state (controls UI columns)
  const [localRuns, setLocalRuns] = useState(initialRuns)

  // Reset runs when the active plan changes
  useEffect(() => {
    setLocalRuns(initialRuns)
  }, [activeGroup?.id])

  // Determine lock state based on session status
  const sessionStatus = trainingSessions[0]?.status
  const isLocked = sessionStatus === 'pending'

  const [tempHeader, setTempHeader] = useState({})
  const [editingHeader, setEditingHeader] = useState({})
  const [tempTime, setTempTime] = useState({})

  const [customTimes, setCustomTimes] = useState({})
  const [customDistances, setCustomDistances] = useState({})

  const [dialog, setDialog] = useState({ open: false, athlete: null, presetId: null, runIdx: null, value: '' })

  // Map athlete:preset:set_index → training detail
  const sessionMap = useMemo(
    () => Object.fromEntries(trainingSessions.map(s => [s.athlete_id, s.id])),
    [trainingSessions]
  )

  const detailMap = useMemo(() => {
    const m = new Map()
    trainingDetails.forEach(d => {
      const key = `${d.athlete_id}:${d.exercise_preset_id}:${d.set_index}`
      m.set(key, d)
    })
    return m
  }, [trainingDetails])

  const [editingTime, setEditingTime] = useState({})

  if (!activeGroup) return null

  // Add a new run (default to first presetGroup)
  const handleAddRun = () => {
    if (!presetGroups || presetGroups.length === 0) return
    // default to flat sprint preset (exerciseId = 61) or first group
    const flatPreset = presetGroups.find(pg => pg.exerciseId === 61) || presetGroups[0]
    const pg = flatPreset
    const defaultDistance = pg.details[0]?.distance || 0
    const nextSetIndex = pg.details.length + 1
    const nextIdx = localRuns.length ? Math.max(...localRuns.map(r => r.idx)) + 1 : 1
    // update UI
    setLocalRuns([...localRuns, { presetId: pg.id, setIndex: nextSetIndex, idx: nextIdx, distance: defaultDistance, name: pg.name }])
    // update DB training-details
    addRun(pg.id, nextSetIndex, defaultDistance)
  }

  // Remove an existing run (remove UI column & DB rows)
  const handleRemoveRun = (presetId, idx) => {
    // find matching run to get its setIndex
    const run = localRuns.find(r => r.presetId === presetId && r.idx === idx)
    if (!run) return
    const { setIndex } = run
    removeRun(presetId, setIndex)
    // remove run from local state
    setLocalRuns(localRuns.filter(r => r.idx !== idx))
    const suffix = `:${setIndex}`
    // clear temp and custom times/distances matching this run
    setTempTime(prev =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix)))
    )
    setCustomTimes(prev =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix)))
    )
    setCustomDistances(prev =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix)))
    )
  }

  // Header edit: use composite key for presetId and setIndex
  const handleEditHeader = (presetId, setIndex) => {
    const key = `${presetId}:${setIndex}`
    setEditingHeader(h => ({ ...h, [key]: true }))
    // initialize input with existing distance
    const run = localRuns.find(r => r.presetId === presetId && r.setIndex === setIndex)
    setTempHeader(prev => ({ ...prev, [key]: run?.distance?.toString() || '' }))
  }
  const handleSaveHeader = (presetId, setIndex) => {
    const key = `${presetId}:${setIndex}`
    const run = localRuns.find(r => r.presetId === presetId && r.setIndex === setIndex)
    const val = parseFloat(tempHeader[key] ?? run.distance)
    if (val > 0) {
      changeDistance(presetId, setIndex, val)
      setCustomDistances(prev => ({ ...prev, [`header:${key}`]: val }))
      setLocalRuns(localRuns.map(r =>
        r.presetId === presetId && r.setIndex === setIndex ? { ...r, distance: val } : r
      ))
    }
    setEditingHeader(h => ({ ...h, [key]: false }))
    setTempHeader(prev => ({ ...prev, [key]: '' }))
  }
  const handleCancelHeader = (presetId, setIndex) => {
    const key = `${presetId}:${setIndex}`
    setEditingHeader(h => ({ ...h, [key]: false }))
    setTempHeader(prev => ({ ...prev, [key]: '' }))
  }

  // Save athlete time for a given run
  const handleSaveTime = (athleteId, presetId, idx) => {
    const key = `${athleteId}:${presetId}:${idx}`
    const val = parseFloat(tempTime[key])
    if (val > 0) {
      saveTime(athleteId, presetId, idx, val)
      setCustomTimes(prev => ({ ...prev, [key]: val }))
    }
    setTempTime(prev => ({ ...prev, [key]: '' }))
    setEditingTime(prev => ({ ...prev, [key]: false }))
  }

  return (
    <section className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded">
              {expanded ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {typeof activeGroup.group_name === 'object'
                ? activeGroup.group_name.group_name
                : activeGroup.group_name || activeGroup.name}
            </h3>
            <span className="text-sm text-gray-600">
              {athletes.length} athlete{athletes.length !== 1 && 's'} • {localRuns.length} run{localRuns.length !== 1 && 's'}
              {localRuns.length > 0 && (
                <>
                  {' '}(
                  total: {localRuns.reduce((sum, r) => sum + (Number(r.distance) || 0), 0)}m)
                  {typeof activeGroup.group_name === 'object'
                    ? ` • ${activeGroup.group_name.group_name}`
                    : activeGroup.group_name ? ` • ${activeGroup.group_name}` : activeGroup.name ? ` • ${activeGroup.name}` : ''}
                  )
                </>
              )}
            </span>
          </div>
        </div>
      {expanded && (
          <div className="relative">
            {isLocked && (
              <div className="absolute inset-0 bg-white bg-opacity-75 z-20 flex items-center justify-center">
                <Lock className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="overflow-x-auto relative">
              <table className="min-w-full table-fixed border-collapse">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="sticky left-0 z-20 bg-white w-1/4 px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Athlete
                    </th>
                    {localRuns.map(r => {
                      const key = `${r.presetId}:${r.setIndex}`
                      return (
                        <th key={key} className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                          {editingHeader[key] ? (
                            <span className="inline-flex items-center space-x-1">
                              <Input
                                type="number"
                                className="w-16 text-center"
                                value={tempHeader[key] ?? r.distance}
                                onChange={e => setTempHeader({ ...tempHeader, [key]: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleSaveHeader(r.presetId, r.setIndex)}
                              />
                              <button onClick={() => handleSaveHeader(r.presetId, r.setIndex)} className="text-green-600 hover:text-green-800"><Check /></button>
                              <button onClick={() => handleCancelHeader(r.presetId, r.setIndex)} className="text-red-600 hover:text-red-800"><X /></button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1">
                              {`${r.distance}m ${r.name}`}
                              {!isLocked && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditHeader(r.presetId, r.setIndex)}>
                                      Edit Distance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRemoveRun(r.presetId, r.idx)}>
                                      Remove Run
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </span>
                          )}
                        </th>
                      )
                    })}
                    <th className="w-10 px-4 py-2 text-center text-sm font-medium text-gray-600">
                      <button
                        onClick={handleAddRun}
                        disabled={isLocked}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {athletes.map(a => {
                    const sid = sessionMap[a.id]
                    const name = a.user ? `${a.user.first_name} ${a.user.last_name}` : a.name
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-800">
                          {name}
                        </td>
                        {localRuns.map(r => {
                          const key = `${a.id}:${r.presetId}:${r.setIndex}`
                          const det = sid ? detailMap.get(key) : null
                          const tmp = tempTime[key] || ''
                          // Determine custom distance to display (DB override or session-level)
                          const dbDist = det?.distance
                          const showDist = customDistances[key] != null
                            ? customDistances[key]
                            : (dbDist != null && dbDist !== r.distance ? dbDist : null)
                          return (
                            <td
                              key={`${r.presetId}-${r.setIndex}`}
                              className="px-4 py-2 text-center text-sm text-gray-800"
                            >
                              <span className="inline-flex items-center space-x-1">
                                {/* If not editing and a time exists, show clickable display */}
                                {!editingTime[key] && (customTimes[key] != null || det?.duration != null) ? (
                                  <span
                                    className="font-mono text-gray-900 cursor-pointer"
                                    onClick={() => {
                                      setEditingTime(prev => ({ ...prev, [key]: true }))
                                      setTempTime(prev => ({ ...prev, [key]: ((customTimes[key] ?? det?.duration) ?? '').toString() }))
                                    }}
                                  >
                                    {(customTimes[key] ?? det?.duration).toFixed(2)}
                                  </span>
                                ) : (
                                  <Input
                                    type="number"
                                    className="w-20 text-center"
                                    placeholder="Add time"
                                    value={tmp}
                                    onChange={e => setTempTime({ ...tempTime, [key]: e.target.value })}
                                    onBlur={() => handleSaveTime(a.id, r.presetId, r.setIndex)}
                                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                    disabled={isLocked}
                                  />
                                )}
                                {/* Dropdown to override distance */}
                                {!isLocked && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => setDialog({ open: true, athlete: a.id, presetId: r.presetId, runIdx: r.setIndex, value: '' })}>
                                        Custom Distance
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </span>
                              {/* display DB or session-level custom distance if it differs */}
                              {showDist != null && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {showDist}m
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
      )}
      </div>
      <Dialog open={dialog.open} onOpenChange={open => setDialog({ ...dialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Distance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Distance (meters)
            </label>
            <Input
              type="number"
              className="w-full"
              placeholder="Distance"
              value={dialog.value}
              onChange={e =>
                setDialog(prev => ({ ...prev, value: e.target.value }))
              }
            />
            <p className="text-sm text-gray-500">
              Set a custom distance for this athlete and run. Leave
              empty to use the default distance.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                const d = parseFloat(dialog.value)
                if (!isNaN(d) && d > 0) {
                  saveDistance(dialog.athlete, dialog.presetId, dialog.runIdx, d)
                  setCustomDistances({ ...customDistances, [`${dialog.athlete}:${dialog.presetId}:${dialog.runIdx}`]: d })
                }
                // reset dialog state
                setDialog({ open: false, athlete: null, presetId: null, runIdx: null, value: '' })
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
} 