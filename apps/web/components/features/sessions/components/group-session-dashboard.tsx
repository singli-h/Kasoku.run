/**
 * Group Session Dashboard
 * The main interface for a coach to run a live group sprint session.
 */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Edit, Save, Play, Pause, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { logGroupPerformanceAction } from "@/actions/training/group-session-actions"
import { AthleteTimeCell } from "./athlete-time-cell"

// Mock Data - Replace with actual data fetching
const mockAthletes = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Williams" },
  { id: 3, name: "Charlie Brown" },
  { id: 4, name: "Diana Miller" },
]

const mockPreset = {
  id: 1,
  name: "40m Sprint Practice",
  rounds: [
    { roundNumber: 1, distance: 40 },
    { roundNumber: 2, distance: 40 },
    { roundNumber: 3, distance: 40 },
    { roundNumber: 4, distance: 40 },
    { roundNumber: 5, distance: 40 },
  ],
}

interface Round {
  roundNumber: number
  distance: number
}

interface PerformanceData {
  [athleteId: number]: {
    [roundNumber: number]: number | null // time in ms
  }
}

export function GroupSessionDashboard() {
  const { toast } = useToast()
  const [rounds, setRounds] = useState<Round[]>(mockPreset.rounds)
  const [performance, setPerformance] = useState<PerformanceData>({})
  const [sessionStatus, setSessionStatus] = useState<"idle" | "running" | "paused">("idle")
  const [timer, setTimer] = useState(0)
  const [distanceValues, setDistanceValues] = useState<Record<number, string>>({})

  useEffect(() => {
    const initialValues: Record<number, string> = {}
    rounds.forEach(r => {
      initialValues[r.roundNumber] = String(r.distance)
    })
    setDistanceValues(initialValues)
  }, [rounds])


  // Auto-save functionality
  useEffect(() => {
    if (sessionStatus !== "running") return

    const interval = setInterval(() => {
      const payload = []
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

      if (payload.length > 0) {
        console.log("Auto-saving performance data...", payload)
        logGroupPerformanceAction("live_session_1", payload)
        toast({ title: "Progress auto-saved!" })
      }
    }, 30000) // every 30 seconds

    return () => clearInterval(interval)
  }, [performance, rounds, sessionStatus, toast])
  
  // Master timer
    useEffect(() => {
    if (sessionStatus !== 'running') return
    const timerInterval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerInterval)
  }, [sessionStatus])


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
        distance: mockPreset.rounds[0]?.distance || 40,
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


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>{mockPreset.name}</CardTitle>
            <div className="flex items-center gap-4">
                <div className="font-mono text-2xl">{formatTime(timer)}</div>
                {sessionStatus === 'idle' && <Button onClick={() => setSessionStatus('running')}><Play className="mr-2 h-4 w-4"/>Start</Button>}
                {sessionStatus === 'running' && <Button onClick={() => setSessionStatus('paused')} variant="outline"><Pause className="mr-2 h-4 w-4"/>Pause</Button>}
                {sessionStatus === 'paused' && <Button onClick={() => setSessionStatus('running')}><Play className="mr-2 h-4 w-4"/>Resume</Button>}
                <Button onClick={() => { setSessionStatus('idle'); setTimer(0); }} variant="destructive"><Square className="mr-2 h-4 w-4"/>End Session</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
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
            {mockAthletes.map(athlete => (
              <tr key={athlete.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{athlete.name}</td>
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