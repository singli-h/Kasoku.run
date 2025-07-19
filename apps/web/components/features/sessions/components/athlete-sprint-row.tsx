/*
<ai_context>
AthleteSprintRow - Enhanced component for individual athlete sprint performance tracking.
Features touch-optimized time inputs, presence management, real-time updates,
and mobile-responsive design. Uses correct SprintPerformanceEntry types.
</ai_context>
*/

"use client"

import React, { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Target,
  Timer,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Minus
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { 
  SprintRound, 
  SprintPerformanceEntry,
  SprintSessionAthlete 
} from "@/actions/training/sprint-session-actions"

interface AthleteSprintRowProps {
  athlete: SprintSessionAthlete
  rounds: SprintRound[]
  performances: SprintPerformanceEntry[]
  onUpdatePerformance: (athleteId: number, roundNumber: number, time: number | null) => void
  onTogglePresent: (athleteId: number) => void
  isSelected?: boolean
  onSelectionChange?: (selected: boolean) => void
  className?: string
}

export function AthleteSprintRow({
  athlete,
  rounds,
  performances,
  onUpdatePerformance,
  onTogglePresent,
  isSelected = false,
  onSelectionChange,
  className
}: AthleteSprintRowProps) {
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({})
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  // Check if athlete is marked as present (using athlete status or default to present)
  const isPresent = athlete.status !== 'absent'

  // Calculate athlete statistics
  const athleteStats = useMemo(() => {
    const athletePerformances = performances.filter(p => p.athleteId === athlete.id)
    const completedTimes = athletePerformances.filter(p => p.timeMs !== null)
    
    const avgTime = completedTimes.length > 0 
      ? completedTimes.reduce((sum, p) => sum + (p.timeMs || 0), 0) / completedTimes.length / 1000 // Convert ms to seconds
      : null
    
    const bestTime = completedTimes.length > 0 
      ? Math.min(...completedTimes.map(p => p.timeMs || Infinity)) / 1000 // Convert ms to seconds
      : null

    const completionRate = rounds.length > 0 
      ? (completedTimes.length / rounds.length) * 100
      : 0

    // Calculate trend (comparing first half vs second half of times)
    const trend = completedTimes.length >= 2 ? (() => {
      const mid = Math.floor(completedTimes.length / 2)
      const firstHalf = completedTimes.slice(0, mid)
      const secondHalf = completedTimes.slice(mid)
      
      if (firstHalf.length === 0 || secondHalf.length === 0) return 'stable'
      
      const firstAvg = firstHalf.reduce((sum, p) => sum + (p.timeMs || 0), 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, p) => sum + (p.timeMs || 0), 0) / secondHalf.length
      
      const improvement = (firstAvg - secondAvg) / firstAvg * 100
      
      if (improvement > 2) return 'improving'
      if (improvement < -2) return 'declining'
      return 'stable'
    })() : 'stable'

    return { avgTime, bestTime, completionRate, trend }
  }, [performances, rounds.length, athlete.id])

  const formatTime = (seconds: number | null) => {
    if (!seconds) return ""
    return seconds.toFixed(2)
  }

  const parseTime = (timeStr: string): number | null => {
    if (!timeStr?.trim()) return null
    const num = parseFloat(timeStr)
    return isNaN(num) || num <= 0 ? null : num
  }

  const getPerformanceForRound = (roundNumber: number) => {
    return performances.find(p => p.athleteId === athlete.id && p.roundNumber === roundNumber)
  }

  const handleTimeChange = useCallback((roundNumber: number, value: string) => {
    setLocalTimes(prev => ({ ...prev, [roundNumber]: value }))
  }, [])

  const handleTimeBlur = useCallback((roundNumber: number) => {
    const localValue = localTimes[roundNumber]
    if (localValue !== undefined) {
      const parsedTime = parseTime(localValue)
      onUpdatePerformance(athlete.id, roundNumber, parsedTime)
      
      // Clear local state after saving
      setLocalTimes(prev => {
        const newState = { ...prev }
        delete newState[roundNumber]
        return newState
      })
    }
    setFocusedInput(null)
  }, [localTimes, onUpdatePerformance, athlete.id])

  const handleTimeKeyDown = useCallback((roundNumber: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeBlur(roundNumber)
    } else if (e.key === 'Escape') {
      setLocalTimes(prev => {
        const newState = { ...prev }
        delete newState[roundNumber]
        return newState
      })
      setFocusedInput(null)
    }
  }, [handleTimeBlur])

  const getDisplayTime = (roundNumber: number) => {
    // Show local state if editing, otherwise show saved performance
    if (localTimes[roundNumber] !== undefined) {
      return localTimes[roundNumber]
    }
    
    const performance = getPerformanceForRound(roundNumber)
    return performance?.timeMs ? formatTime(performance.timeMs / 1000) : ""
  }

  const getBestTimeForDistance = (distance: number) => {
    const distancePerformances = performances.filter(p => 
      p.distance === distance && p.timeMs !== null
    )
    
    return distancePerformances.length > 0 
      ? Math.min(...distancePerformances.map(p => p.timeMs || Infinity)) / 1000
      : null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTrendIcon = () => {
    switch (athleteStats.trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        "athlete-sprint-row bg-card border rounded-lg p-3 transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
        !isPresent && "opacity-60 bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Selection Checkbox */}
        {onSelectionChange && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            className="shrink-0"
          />
        )}

        {/* Athlete Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className={cn(
            "h-10 w-10 shrink-0",
            !isPresent && "grayscale"
          )}>
            <AvatarImage src={undefined} alt={athlete.name} />
            <AvatarFallback className="text-sm font-medium">
              {getInitials(athlete.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-medium text-sm truncate",
                !isPresent && "text-muted-foreground"
              )}>
                {athlete.name}
              </p>
              
              {/* Presence Status */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePresent(athlete.id)}
                className={cn(
                  "h-6 w-6 p-0 shrink-0",
                  isPresent ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"
                )}
              >
                {isPresent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Athlete Stats */}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {athleteStats.bestTime && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-600" />
                  <span>{formatTime(athleteStats.bestTime)}s</span>
                </div>
              )}
              
              {athleteStats.avgTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(athleteStats.avgTime)}s</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span>{Math.round(athleteStats.completionRate)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Time Inputs */}
        <div className="flex items-center gap-2 shrink-0">
          {rounds.map((round, index) => {
            const performance = getPerformanceForRound(round.roundNumber)
            const displayTime = getDisplayTime(round.roundNumber)
            const isBestForDistance = performance?.timeMs && performance.timeMs / 1000 === getBestTimeForDistance(round.distance)
            const isFocused = focusedInput === round.roundNumber.toString()
            const hasError = localTimes[round.roundNumber] && !parseTime(localTimes[round.roundNumber])

            return (
              <div key={`${round.roundNumber}-${round.distance}`} className="relative">
                {/* Distance Label (Mobile Only) */}
                <div className="block sm:hidden text-xs text-muted-foreground text-center mb-1">
                  {round.distance}m
                </div>

                <div className={cn(
                  "relative w-16 sm:w-18",
                  isBestForDistance && "ring-1 ring-yellow-500 rounded"
                )}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={displayTime}
                    onChange={(e) => handleTimeChange(round.roundNumber, e.target.value)}
                    onFocus={() => setFocusedInput(round.roundNumber.toString())}
                    onBlur={() => handleTimeBlur(round.roundNumber)}
                    onKeyDown={(e) => handleTimeKeyDown(round.roundNumber, e)}
                    placeholder="0.00"
                    disabled={!isPresent}
                    className={cn(
                      "h-8 text-center text-sm font-mono px-1",
                      isBestForDistance && "bg-yellow-50 dark:bg-yellow-950/20 font-bold",
                      hasError && "border-red-500 bg-red-50 dark:bg-red-950/20",
                      isFocused && "ring-2 ring-blue-500",
                      !isPresent && "bg-muted cursor-not-allowed"
                    )}
                  />

                  {/* Best Time Indicator */}
                  {isBestForDistance && (
                    <div className="absolute -top-1 -right-1">
                      <Trophy className="h-3 w-3 text-yellow-600" />
                    </div>
                  )}

                  {/* Error Indicator */}
                  {hasError && (
                    <div className="absolute -top-1 -right-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                </div>

                {/* Round Number (Desktop Only) */}
                <div className="hidden sm:block text-xs text-muted-foreground text-center mt-1">
                  R{index + 1}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Additional Stats */}
      <div className="block sm:hidden mt-3 pt-3 border-t">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Best</div>
            <div className="font-semibold">
              {athleteStats.bestTime ? `${formatTime(athleteStats.bestTime)}s` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Average</div>
            <div className="font-semibold">
              {athleteStats.avgTime ? `${formatTime(athleteStats.avgTime)}s` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground flex items-center justify-center gap-1">
              <span>Trend</span>
              {getTrendIcon()}
            </div>
            <div className="font-semibold">
              {Math.round(athleteStats.completionRate)}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 