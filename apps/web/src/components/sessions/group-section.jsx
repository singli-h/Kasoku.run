import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Plus, MoreVertical, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useSession } from "./session-context"

export default function GroupSection() {
  const {
    activeGroup,
    athletes,
    presets,
    trainingSessions,
    trainingDetails,
    saveTime,
    saveDistance,
    changeDistance,
    addRun: contextAddRun,
    removeRun: contextRemoveRun,
  } = useSession()

  const [expanded, setExpanded] = useState(true)

  const initialRuns = useMemo(() => {
    if (!activeGroup) return []
    // Select only the Sprint exercise preset (type 6)
    const sprintPreset = activeGroup.exercise_presets.find(
      p => p.exercises?.exercise_type_id === 6
    )
    // Extract and sort its details by set_index
    const details = sprintPreset?.exercise_preset_details || []
    const sorted = [...details].sort((a, b) => a.set_index - b.set_index)
    // Build exactly four runs (1..4) using DB distances or 0 if missing
    return [1, 2, 3, 4].map(idx => {
      const detail = sorted.find(d => d.set_index === idx)
      return { idx, distance: detail?.distance ?? 0, edit: false }
    })
  }, [activeGroup])

  const [runs, setRuns] = useState(initialRuns)

  // Reset runs state whenever presets change
  useEffect(() => {
    setRuns(initialRuns)
  }, [initialRuns])

  const [tempHeader, setTempHeader] = useState({})
  const [tempTime, setTempTime] = useState({})

  const [customTimes, setCustomTimes] = useState({})
  const [customDistances, setCustomDistances] = useState({})

  const [dialog, setDialog] = useState({ open: false, athlete: null, runIdx: null, value: '' })

  const sessionMap = useMemo(() => Object.fromEntries(trainingSessions.map(s => [s.athlete_id, s.id])), [trainingSessions])
  const detailMap = useMemo(() => Object.fromEntries(
    trainingDetails.map(d => [`${d.athlete_id}:${d.set_index}`, d])
  ), [trainingDetails])

  const [editingTime, setEditingTime] = useState({})

  if (!activeGroup) return null

  const handleAddRun = () => {
    const max = runs.length ? Math.max(...runs.map(r => r.idx)) : 0
    const next = max + 1
    setRuns([...runs, { idx: next, distance: 0, edit: true }])
    contextAddRun(next, 0)
  }

  const handleRemoveRun = idx => {
    contextRemoveRun(idx)
    setRuns(runs.filter(r => r.idx !== idx))
    const suffix = `:${idx}`
    setTempTime(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix))))
    setCustomTimes(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix))))
    setCustomDistances(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(suffix) && !k.startsWith(`header:`))))
  }

  const handleSaveHeader = idx => {
    const val = parseFloat(tempHeader[idx] ?? runs.find(r => r.idx === idx).distance)
    if (val > 0) {
      changeDistance(idx, val)
      setRuns(runs.map(r => (r.idx === idx ? { ...r, distance: val, edit: false } : r)))
      setCustomDistances(prev => ({ ...prev, [`header:${idx}`]: val }))
    } else {
      setRuns(runs.map(r => (r.idx === idx ? { ...r, edit: false } : r)))
    }
  }
  const handleCancelHeader = idx => {
    setRuns(runs.map(r => (r.idx === idx ? { ...r, edit: false } : r)))
  }

  const handleSaveTime = (athlete, idx) => {
    const key = `${athlete}:${idx}`
    const val = parseFloat(tempTime[key])
    if (val > 0) {
      saveTime(athlete, idx, val)
      setCustomTimes(prev => ({ ...prev, [key]: val }))
    }
    // Clear the temporary input buffer
    setTempTime(prev => ({ ...prev, [key]: '' }))
    // Exit editing mode for this cell so the display is shown again
    setEditingTime(prev => ({ ...prev, [key]: false }))
  }

  return (
    <section className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 flex items-center space-x-3">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded">
            {expanded ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </button>
          <h3 className="text-lg font-semibold text-gray-800">{activeGroup.name}</h3>
          <span className="text-sm text-gray-600">
            {athletes.length} athlete{athletes.length !== 1 && 's'} • {runs.length} run{runs.length !== 1 && 's'} ({runs[0]?.distance}m+)
          </span>
        </div>
      {expanded && (
          <div className="overflow-x-auto relative">
            <table className="min-w-full table-fixed border-collapse">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 z-20 bg-white w-1/4 px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Athlete
                  </th>
                  {runs.map(r => (
                    <th key={r.idx} className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                      {r.edit ? (
                        <span className="inline-flex items-center space-x-1">
                          <Input
                            type="number"
                            className="w-16 text-center"
                            value={tempHeader[r.idx] ?? r.distance}
                            onChange={e => setTempHeader({ ...tempHeader, [r.idx]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleSaveHeader(r.idx)}
                          />
                          <button onClick={() => handleSaveHeader(r.idx)} className="text-green-600 hover:text-green-800"><Check /></button>
                          <button onClick={() => handleCancelHeader(r.idx)} className="text-red-600 hover:text-red-800"><X /></button>
                          </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1">
                          Run {r.idx} ({r.distance}m)
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setRuns(runs.map(rr => rr.idx === r.idx ? { ...rr, edit: true } : rr))}>
                                Edit Distance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemoveRun(r.idx)}>
                                Remove Run
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="w-10 px-4 py-2 text-center text-sm font-medium text-gray-600">
                    <button
                      onClick={handleAddRun}
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
                      {runs.map(r => {
                        const key = `${a.id}:${r.idx}`
                        const det = sid ? detailMap[key] : null
                        const tmp = tempTime[key] || ''
                        // Determine custom distance to display (DB override or session-level)
                        const dbDist = det?.distance
                        const showDist = customDistances[key] != null
                          ? customDistances[key]
                          : (dbDist != null && dbDist !== r.distance ? dbDist : null)
                        return (
                          <td
                            key={r.idx}
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
                                  onBlur={() => handleSaveTime(a.id, r.idx)}
                                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                />
                              )}
                              {/* Dropdown to override distance */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setDialog({ open: true, athlete: a.id, runIdx: r.idx, value: '' })}>
                                    Custom Distance
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                  saveDistance(dialog.athlete, dialog.runIdx, d)
                  setCustomDistances({ ...customDistances, [`${dialog.athlete}:${dialog.runIdx}`]: d })
                }
                setDialog(prev => ({ ...prev, open: false }))
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