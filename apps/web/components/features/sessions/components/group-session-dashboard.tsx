/**
 * Group Session Dashboard
 * The main interface for a coach to run a live group sprint session.
 */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Edit, Save, Play, Pause, Square, Users, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  getCoachAthleteGroupsForSessionAction,
  getSprintSessionPresetsAction,
  getGroupAthletesForSessionAction,
  createLiveSessionAction,
  logGroupPerformanceAction,
  finalizeGroupSessionAction,
  type GroupSessionPreset,
  type GroupSessionAthlete,
  type LiveSession,
  type PerformanceLogEntry
} from "@/actions/training/group-session-actions"
import { AthleteTimeCell } from "./athlete-time-cell"
import type { AthleteGroup } from "@/types/database"

interface Round {
  roundNumber: number
  distance: number
}

interface PerformanceData {
  [athleteId: number]: {
    [roundNumber: number]: number | null // time in ms
  }
}

type SessionPhase = 'setup' | 'active' | 'completed'

export function GroupSessionDashboard() {
  const { toast } = useToast()
  
  // Setup state
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('setup')
  const [athleteGroups, setAthleteGroups] = useState<AthleteGroup[]>([])
  const [sessionPresets, setSessionPresets] = useState<GroupSessionPreset[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [athletes, setAthletes] = useState<GroupSessionAthlete[]>([])
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  
  // Session state
  const [rounds, setRounds] = useState<Round[]>([])
  const [performance, setPerformance] = useState<PerformanceData>({})
  const [sessionStatus, setSessionStatus] = useState<"idle" | "running" | "paused">("idle")
  const [timer, setTimer] = useState(0)
  const [distanceValues, setDistanceValues] = useState<Record<number, string>>({})
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Initialize distance values when rounds change
  useEffect(() => {
    const initialValues: Record<number, string> = {}
    rounds.forEach(r => {
      initialValues[r.roundNumber] = String(r.distance)
    })
    setDistanceValues(initialValues)
  }, [rounds])

  // Load athletes when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      loadGroupAthletes(selectedGroupId)
    }
  }, [selectedGroupId])

  // Auto-save functionality
  useEffect(() => {
    if (sessionStatus !== "running" || !currentSession) return

    const interval = setInterval(() => {
      const payload = buildPerformancePayload()
      if (payload.length > 0) {
        console.log("Auto-saving performance data...", payload)
        savePerformanceData(payload)
      }
    }, 30000) // every 30 seconds

    return () => clearInterval(interval)
  }, [performance, rounds, sessionStatus, currentSession])
  
  // Master timer
  useEffect(() => {
    if (sessionStatus !== 'running') return
    const timerInterval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerInterval)
  }, [sessionStatus])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load athlete groups and session presets in parallel
      const [groupsResult, presetsResult] = await Promise.all([
        getCoachAthleteGroupsForSessionAction(),
        getSprintSessionPresetsAction()
      ])

      if (groupsResult.isSuccess) {
        setAthleteGroups(groupsResult.data)
      } else {
        console.error('Failed to load athlete groups:', groupsResult.message)
        setError('Failed to load athlete groups')
      }

      if (presetsResult.isSuccess) {
        setSessionPresets(presetsResult.data)
      } else {
        console.error('Failed to load session presets:', presetsResult.message)
        setError('Failed to load session presets')
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load initial data')
      toast({
        title: "Error",
        description: "Failed to load initial data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadGroupAthletes = async (groupId: number) => {
    try {
      const result = await getGroupAthletesForSessionAction(groupId)
      if (result.isSuccess) {
        setAthletes(result.data)
      } else {
        console.error('Failed to load athletes:', result.message)
        toast({
          title: "Error",
          description: "Failed to load athletes for selected group.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading athletes:', error)
      toast({
        title: "Error",
        description: "Failed to load athletes.",
        variant: "destructive",
      })
    }
  }

  const startSession = async () => {
    if (!selectedGroupId || !selectedPresetId) {
      toast({
        title: "Error",
        description: "Please select both an athlete group and a session preset.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingSession(true)
      
      // Create live session
      const result = await createLiveSessionAction(selectedPresetId, selectedGroupId)
      
      if (result.isSuccess) {
        setCurrentSession(result.data)
        setSessionPhase('active')
        setSessionStatus('running')
        
        // Initialize rounds from the selected preset
        const selectedPreset = sessionPresets.find(p => p.id === selectedPresetId)
        if (selectedPreset) {
          const initialRounds: Round[] = selectedPreset.exercise_presets[0]?.exercise_preset_details.map((detail, index) => ({
            roundNumber: index + 1,
            distance: detail.distance || 40, // Default to 40m if not specified
          })) || [
            { roundNumber: 1, distance: 40 },
            { roundNumber: 2, distance: 40 },
            { roundNumber: 3, distance: 40 },
            { roundNumber: 4, distance: 40 },
            { roundNumber: 5, distance: 40 },
          ]
          setRounds(initialRounds)
        }
        
        toast({
          title: "Session Started",
          description: "Live session has been created successfully!",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingSession(false)
    }
  }

  const buildPerformancePayload = (): PerformanceLogEntry[] => {
    const payload: PerformanceLogEntry[] = []
    
    for (const athleteId in performance) {
      for (const roundNumber in performance[athleteId]) {
        const time = performance[athleteId][roundNumber]
        if (time !== null) {
          const round = rounds.find(r => r.roundNumber === Number(roundNumber))
          payload.push({
            athleteId: Number(athleteId),
            roundNumber: Number(roundNumber),
            time: time,
            distance: round ? round.distance : 0,
          })
        }
      }
    }
    
    return payload
  }

  const savePerformanceData = async (payload: PerformanceLogEntry[]) => {
    if (!currentSession) return
    
    try {
      setIsSaving(true)
      const result = await logGroupPerformanceAction(currentSession.id, payload)
      
      if (result.isSuccess) {
        toast({ 
          title: "Progress auto-saved!",
          description: `Saved ${result.data} performance entries.`,
          duration: 2000
        })
      } else {
        console.error('Auto-save failed:', result.message)
        toast({
          title: "Auto-save Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error during auto-save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTimeChange = (athleteId: number, roundNumber: number, time: number | null) => {
    setPerformance(prev => ({
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        [roundNumber]: time,
      },
    }))
  }

  const handleDistanceChange = (roundNumber: number, value: string) => {
    // Allow only numeric input
    if (/^\d*$/.test(value)) {
      setDistanceValues(prev => ({ ...prev, [roundNumber]: value }))
    }
  }

  const handleDistanceBlur = (roundNumber: number) => {
    const finalDistance = parseInt(distanceValues[roundNumber], 10) || 0
    // Sync the input back to a clean number string
    setDistanceValues(prev => ({ ...prev, [roundNumber]: String(finalDistance) }))
    
    setRounds(prevRounds =>
      prevRounds.map(r =>
        r.roundNumber === roundNumber ? { ...r, distance: finalDistance } : r
      )
    )
    toast({
      title: "Distance Updated",
      description: `Round ${roundNumber} distance set to ${finalDistance}m.`,
    })
  }

  const addRound = () => {
    setRounds(prev => {
      const newRoundNumber = prev.length > 0 ? Math.max(...prev.map(r => r.roundNumber)) + 1 : 1
      const newRound = {
        roundNumber: newRoundNumber,
        distance: 40, // Default distance
      }
      toast({ title: `Round ${newRoundNumber} added` })
      return [...prev, newRound]
    })
  }

  const removeRound = (roundNumberToDelete: number) => {
    setPerformance(prev => {
      const nextState = { ...prev }
      Object.keys(nextState).forEach(athleteId => {
        delete nextState[Number(athleteId)][roundNumberToDelete]
      })
      return nextState
    })
    setRounds(prev => prev.filter(r => r.roundNumber !== roundNumberToDelete))
    toast({
      title: "Round Removed",
      description: `Round ${roundNumberToDelete} has been successfully removed.`,
    })
  }

  const handleEndSession = async () => {
    if (!currentSession) return
    
    try {
      setIsSaving(true)
      const finalPayload = buildPerformancePayload()
      
      const result = await finalizeGroupSessionAction(currentSession.id, finalPayload)
      
      if (result.isSuccess) {
        setSessionPhase('completed')
        setSessionStatus('idle')
        setTimer(0)
        toast({
          title: "Session Completed",
          description: "Session has been finalized and saved successfully!",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetToSetup = () => {
    setSessionPhase('setup')
    setCurrentSession(null)
    setRounds([])
    setPerformance({})
    setSessionStatus('idle')
    setTimer(0)
    setDistanceValues({})
    setSelectedGroupId(null)
    setSelectedPresetId(null)
    setAthletes([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadInitialData}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Setup phase
  if (sessionPhase === 'setup') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Sprint Session Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Athlete Group</label>
              <Select value={selectedGroupId?.toString()} onValueChange={(value) => setSelectedGroupId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an athlete group" />
                </SelectTrigger>
                <SelectContent>
                  {athleteGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{group.group_name}</span>
                        <Badge variant="secondary">{(group as any).athletes?.length || 0} athletes</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Session Preset</label>
              <Select value={selectedPresetId?.toString()} onValueChange={(value) => setSelectedPresetId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session preset" />
                </SelectTrigger>
                <SelectContent>
                  {sessionPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id.toString()}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroupId && athletes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Athletes in Group</label>
                <div className="flex flex-wrap gap-2">
                  {athletes.map((athlete) => (
                    <Badge key={athlete.id} variant="outline">
                      {athlete.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={startSession} 
              disabled={!selectedGroupId || !selectedPresetId || isCreatingSession}
              className="w-full"
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active session phase
  if (sessionPhase === 'active') {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {sessionPresets.find(p => p.id === selectedPresetId)?.name || 'Sprint Session'}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary">
                  {athletes.length} athletes
                </Badge>
                <Badge variant="outline">
                  {rounds.length} rounds
                </Badge>
                {isSaving && (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="font-mono text-2xl">{formatTime(timer)}</div>
              </div>
              <div className="flex items-center gap-2">
                {sessionStatus === 'idle' && (
                  <Button onClick={() => setSessionStatus('running')}>
                    <Play className="mr-2 h-4 w-4"/>
                    Start
                  </Button>
                )}
                {sessionStatus === 'running' && (
                  <Button onClick={() => setSessionStatus('paused')} variant="outline">
                    <Pause className="mr-2 h-4 w-4"/>
                    Pause
                  </Button>
                )}
                {sessionStatus === 'paused' && (
                  <Button onClick={() => setSessionStatus('running')}>
                    <Play className="mr-2 h-4 w-4"/>
                    Resume
                  </Button>
                )}
                <Button onClick={handleEndSession} variant="destructive" disabled={isSaving}>
                  <Square className="mr-2 h-4 w-4"/>
                  End Session
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Athlete
                </th>
                {rounds.map((round, i) => (
                  <th key={round.roundNumber} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>Round {round.roundNumber}</span>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={distanceValues[round.roundNumber] || ""}
                          onChange={e => handleDistanceChange(round.roundNumber, e.target.value)}
                          onBlur={() => handleDistanceBlur(round.roundNumber)}
                          className="w-20 h-8"
                        />
                        <span className="ml-2 text-gray-500">m</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete Round {round.roundNumber} and all of its recorded data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => removeRound(round.roundNumber)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </th>
                ))}
                <th>
                  <Button variant="outline" onClick={addRound}>
                    <Plus className="mr-2 h-4 w-4" /> Add Round
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {athletes.map(athlete => (
                <tr key={athlete.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {athlete.name}
                  </td>
                  {rounds.map(round => (
                    <td key={round.roundNumber} className="px-6 py-4 whitespace-nowrap">
                      <AthleteTimeCell
                        value={performance[athlete.id]?.[round.roundNumber] || null}
                        onChange={(time) => handleTimeChange(athlete.id, round.roundNumber, time)}
                      />
                    </td>
                  ))}
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  // Completed session phase
  if (sessionPhase === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Completed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Session has been successfully completed and all data has been saved.
            </AlertDescription>
          </Alert>
          <Button onClick={resetToSetup} className="w-full">
            Start New Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
} 