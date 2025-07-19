/*
<ai_context>
MultiGroupSprintTable - Table-like interface for managing multiple athlete groups
and their sprint performance in real-time. Features mobile-responsive design,
touch-optimized inputs, and group-based organization.
</ai_context>
*/

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Trophy, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AthleteTimeCell } from "./athlete-time-cell"
import type { 
  AthleteGroupWithAthletes, 
  SprintRound 
} from "@/actions/training/sprint-session-actions"

interface MultiGroupSprintTableProps {
  athleteGroups: AthleteGroupWithAthletes[]
  rounds: SprintRound[]
  performanceData: Record<string, number | null> // key: "athleteId-roundNumber"
  onUpdatePerformance: (athleteId: number, roundNumber: number, timeMs: number | null) => void
  disabled?: boolean
}

interface GroupSprintTableProps {
  group: AthleteGroupWithAthletes
  rounds: SprintRound[]
  performanceData: Record<string, number | null>
  onUpdatePerformance: (athleteId: number, roundNumber: number, timeMs: number | null) => void
  disabled?: boolean
}

// Individual group table component
function GroupSprintTable({ 
  group, 
  rounds, 
  performanceData, 
  onUpdatePerformance, 
  disabled = false 
}: GroupSprintTableProps) {
  // Calculate group statistics
  const groupStats = React.useMemo(() => {
    const totalPossibleEntries = group.athletes.length * rounds.length
    let completedEntries = 0
    let totalTime = 0
    let bestTime = Infinity
    
    group.athletes.forEach(athlete => {
      rounds.forEach(round => {
        const key = `${athlete.id}-${round.roundNumber}`
        const time = performanceData[key]
        if (time !== null && time !== undefined) {
          completedEntries++
          totalTime += time
          if (time < bestTime) {
            bestTime = time
          }
        }
      })
    })
    
    return {
      completionPercentage: totalPossibleEntries > 0 ? (completedEntries / totalPossibleEntries) * 100 : 0,
      averageTime: completedEntries > 0 ? totalTime / completedEntries : null,
      bestTime: bestTime !== Infinity ? bestTime : null,
      completedEntries,
      totalPossibleEntries
    }
  }, [group.athletes, rounds, performanceData])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{group.group_name}</CardTitle>
            <Badge variant="secondary">
              {group.athletes.length} athletes
            </Badge>
          </div>
          
          {/* Group performance stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Progress:</span>
              <Badge variant="outline">
                {groupStats.completedEntries}/{groupStats.totalPossibleEntries}
              </Badge>
            </div>
            
            {groupStats.bestTime && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-mono font-medium">
                  {(groupStats.bestTime / 1000).toFixed(2)}s
                </span>
              </div>
            )}
            
            {groupStats.averageTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-mono">
                  {(groupStats.averageTime / 1000).toFixed(2)}s avg
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${groupStats.completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Mobile-first responsive table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            
            {/* Desktop/Tablet table view */}
            <div className="hidden md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">
                      Athlete
                    </th>
                    {rounds.map(round => (
                      <th key={round.roundNumber} className="text-center py-3 px-2 font-medium text-gray-700">
                        <div className="space-y-1">
                          <div>Round {round.roundNumber}</div>
                          <Badge variant="outline" className="text-xs">
                            {round.distance}m
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.athletes.map((athlete, athleteIndex) => (
                    <motion.tr
                      key={athlete.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: athleteIndex * 0.05 }}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                            {athlete.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {athlete.name}
                            </div>
                            {athlete.email && (
                              <div className="text-xs text-gray-500">
                                {athlete.email.split('@')[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {rounds.map(round => {
                        const key = `${athlete.id}-${round.roundNumber}`
                        const value = performanceData[key]
                        return (
                          <td key={round.roundNumber} className="py-3 px-2 text-center">
                            <AthleteTimeCell
                              value={value}
                              onChange={(timeMs) => onUpdatePerformance(athlete.id, round.roundNumber, timeMs)}
                              disabled={disabled}
                              className="mx-auto"
                            />
                          </td>
                        )
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
              {group.athletes.map((athlete, athleteIndex) => (
                <motion.div
                  key={athlete.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: athleteIndex * 0.1 }}
                >
                  {/* Athlete header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg font-medium text-blue-700">
                      {athlete.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {athlete.name}
                      </div>
                      {athlete.email && (
                        <div className="text-sm text-gray-500">
                          {athlete.email.split('@')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sprint rounds grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {rounds.map(round => {
                      const key = `${athlete.id}-${round.roundNumber}`
                      const value = performanceData[key]
                      return (
                        <div key={round.roundNumber} className="space-y-2">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              Round {round.roundNumber}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {round.distance}m
                            </Badge>
                          </div>
                          <AthleteTimeCell
                            value={value}
                            onChange={(timeMs) => onUpdatePerformance(athlete.id, round.roundNumber, timeMs)}
                            disabled={disabled}
                            className="w-full"
                          />
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MultiGroupSprintTable({
  athleteGroups,
  rounds,
  performanceData,
  onUpdatePerformance,
  disabled = false
}: MultiGroupSprintTableProps) {
  
  // Show message if no groups are selected
  if (athleteGroups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Athlete Groups Selected
          </h3>
          <p className="text-gray-500">
            Please select athlete groups in the session setup to begin.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show message if no rounds are defined
  if (rounds.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sprint Rounds Defined
          </h3>
          <p className="text-gray-500">
            Add sprint rounds to begin recording performance data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Sprint Performance Tracking
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Record sprint times for {athleteGroups.reduce((total, group) => total + group.athletes.length, 0)} athletes across {rounds.length} rounds
          </p>
        </div>
        
        {disabled && (
          <Badge variant="secondary">
            Session Paused
          </Badge>
        )}
      </motion.div>

      {/* Render each group table */}
      <div className="space-y-6">
        {athleteGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GroupSprintTable
              group={group}
              rounds={rounds}
              performanceData={performanceData}
              onUpdatePerformance={onUpdatePerformance}
              disabled={disabled}
            />
            
            {/* Separator between groups */}
            {index < athleteGroups.length - 1 && (
              <Separator className="my-6" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
} 