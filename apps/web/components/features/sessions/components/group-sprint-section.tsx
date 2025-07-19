/*
<ai_context>
GroupSprintSection - Component for managing individual athlete groups within sprint sessions.
Displays athletes in a group, their sprint times, and provides group-level controls.
Features mobile-responsive design, real-time updates, and touch-optimized inputs.
</ai_context>
*/

"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Clock, 
  Target,
  MoreVertical,
  UserCheck,
  UserX,
  Timer,
  Zap,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { AthleteSprintRow } from "./athlete-sprint-row"
import type { 
  AthleteGroupWithAthletes, 
  SprintRound, 
  AthletePerformance 
} from "@/types/training"

interface GroupSprintSectionProps {
  group: AthleteGroupWithAthletes
  rounds: SprintRound[]
  performances: AthletePerformance[]
  onUpdatePerformance: (athleteId: string, roundId: string, time: number | null) => void
  onTogglePresent: (athleteId: string) => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
  className?: string
}

export function GroupSprintSection({
  group,
  rounds,
  performances,
  onUpdatePerformance,
  onTogglePresent,
  isExpanded = true,
  onToggleExpanded,
  className
}: GroupSprintSectionProps) {
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set())

  // Calculate group statistics
  const groupStats = useMemo(() => {
    const presentAthletes = group.athletes.filter(athlete => 
      !performances.some(p => p.athleteId === athlete.id && !p.isPresent)
    )
    
    const totalTimes = performances.filter(p => p.time !== null && p.isPresent)
    const avgTime = totalTimes.length > 0 
      ? totalTimes.reduce((sum, p) => sum + (p.time || 0), 0) / totalTimes.length
      : 0

    const bestTimes = rounds.map(round => {
      const roundPerformances = performances.filter(p => 
        p.roundId === round.id && p.time !== null && p.isPresent
      )
      return roundPerformances.length > 0 
        ? Math.min(...roundPerformances.map(p => p.time || Infinity))
        : null
    }).filter(time => time !== null)

    return {
      totalAthletes: group.athletes.length,
      presentAthletes: presentAthletes.length,
      avgTime: avgTime > 0 ? avgTime : null,
      bestTime: bestTimes.length > 0 ? Math.min(...bestTimes) : null,
      completionRate: rounds.length > 0 
        ? (totalTimes.length / (presentAthletes.length * rounds.length)) * 100
        : 0
    }
  }, [group.athletes, rounds, performances])

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "--"
    return `${seconds.toFixed(2)}s`
  }

  const handleSelectAllToggle = () => {
    if (selectedAthletes.size === group.athletes.length) {
      setSelectedAthletes(new Set())
    } else {
      setSelectedAthletes(new Set(group.athletes.map(a => a.id)))
    }
  }

  const handleAthleteSelect = (athleteId: string, selected: boolean) => {
    const newSelection = new Set(selectedAthletes)
    if (selected) {
      newSelection.add(athleteId)
    } else {
      newSelection.delete(athleteId)
    }
    setSelectedAthletes(newSelection)
  }

  const handleBulkAction = (action: 'present' | 'absent') => {
    selectedAthletes.forEach(athleteId => {
      if (action === 'present') {
        onTogglePresent(athleteId)
      } else {
        onTogglePresent(athleteId)
      }
    })
    setSelectedAthletes(new Set())
  }

  return (
    <Card className={`group-sprint-section ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1 h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold">
                {group.name}
              </CardTitle>
            </div>
            
            {group.description && (
              <Badge variant="outline" className="text-xs">
                {group.description}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Group Statistics */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                <span>{groupStats.presentAthletes}/{groupStats.totalAthletes}</span>
              </div>
              
              {groupStats.avgTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(groupStats.avgTime)}</span>
                </div>
              )}
              
              {groupStats.bestTime && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span>{formatTime(groupStats.bestTime)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{Math.round(groupStats.completionRate)}%</span>
              </div>
            </div>

            {/* Group Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSelectAllToggle}>
                  <Users className="h-4 w-4 mr-2" />
                  {selectedAthletes.size === group.athletes.length ? 'Deselect All' : 'Select All'}
                </DropdownMenuItem>
                
                {selectedAthletes.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('present')}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Mark Present
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('absent')}>
                      <UserX className="h-4 w-4 mr-2" />
                      Mark Absent
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Statistics */}
        <div className="flex sm:hidden items-center justify-between mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              <span>{groupStats.presentAthletes}/{groupStats.totalAthletes}</span>
            </div>
            
            {groupStats.bestTime && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span>{formatTime(groupStats.bestTime)}</span>
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            {Math.round(groupStats.completionRate)}% Complete
          </Badge>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {selectedAthletes.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedAthletes.size} athlete(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('present')}
                        className="h-7 text-xs"
                      >
                        Mark Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('absent')}
                        className="h-7 text-xs"
                      >
                        Mark Absent
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                {group.athletes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No athletes in this group</p>
                  </div>
                ) : (
                  group.athletes.map((athlete, index) => (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AthleteSprintRow
                        athlete={athlete}
                        rounds={rounds}
                        performances={performances.filter(p => p.athleteId === athlete.id)}
                        onUpdatePerformance={onUpdatePerformance}
                        onTogglePresent={onTogglePresent}
                        isSelected={selectedAthletes.has(athlete.id)}
                        onSelectionChange={(selected) => handleAthleteSelect(athlete.id, selected)}
                      />
                    </motion.div>
                  ))
                )}
              </div>

              {group.athletes.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  {/* Group Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span>Present</span>
                      </div>
                      <div className="font-semibold">
                        {groupStats.presentAthletes}/{groupStats.totalAthletes}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Avg Time</span>
                      </div>
                      <div className="font-semibold">
                        {formatTime(groupStats.avgTime)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                        <Trophy className="h-4 w-4" />
                        <span>Best Time</span>
                      </div>
                      <div className="font-semibold">
                        {formatTime(groupStats.bestTime)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Target className="h-4 w-4" />
                        <span>Complete</span>
                      </div>
                      <div className="font-semibold">
                        {Math.round(groupStats.completionRate)}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 