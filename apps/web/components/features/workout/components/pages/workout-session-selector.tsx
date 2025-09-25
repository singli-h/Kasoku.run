/**
 * Workout Session Selector
 * Component for selecting and starting workout sessions from available exercise preset groups
 */

"use client"

import { useState, useEffect } from "react"
import { useSessionsToday, useSessionMutations } from '../../hooks/use-workout-queries'
import { motion } from "framer-motion"
import { 
  Play, 
  Calendar, 
  Clock, 
  Target,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Import training actions
import { 
  getTodayAndOngoingSessionsAction,
  startTrainingSessionAction 
} from "@/actions/training"
import { WorkoutSessionCard } from '@/components/composed'

// Import types
import type { 
  ExercisePresetGroupWithDetails,
  ExerciseTrainingSessionWithDetails 
} from "@/types/training"

interface WorkoutSessionSelectorProps {
  onSessionSelected: (
    presetGroup: ExercisePresetGroupWithDetails, 
    session?: ExerciseTrainingSessionWithDetails
  ) => void
  className?: string
}

export function WorkoutSessionSelector({ 
  onSessionSelected, 
  className 
}: WorkoutSessionSelectorProps) {
  const { toast } = useToast()
  const [startingSessionId, setStartingSessionId] = useState<number | null>(null)

  // Fetch today's and ongoing sessions with optimized query
  const { data: sessions, isLoading, error, refetchSessions } = useSessionsToday()
  
  // Session mutations
  const { startSession, updateSessionStatus } = useSessionMutations()

  // Handle starting or continuing a session
  const handleStartSession = async (session: ExerciseTrainingSessionWithDetails) => {
    try {
      const presetGroup = session.exercise_preset_group!
      setStartingSessionId(presetGroup.id)
      
      if (session.session_status === 'ongoing') {
        // Continue existing session
        onSessionSelected(presetGroup, session)
        toast({
          title: "Session Continued",
          description: `Continuing ${presetGroup.name} workout session`
        })
      } else {
        // Start a new training session using mutation
        await startSession.mutateAsync(session.id)
        
        // Call the parent callback with the selected workout
        onSessionSelected(presetGroup, session)
        
        toast({
          title: "Session Started",
          description: `Started ${presetGroup.name} workout session`
        })
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast({
        title: "Error",
        description: "Failed to start workout session",
        variant: "destructive"
      })
    } finally {
      setStartingSessionId(null)
    }
  }


  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load workouts</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Today's Workouts
        </h2>
        <p className="text-muted-foreground">
          Continue ongoing sessions or start new workouts
        </p>
      </div>

      {/* Workout Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions?.map((session, index) => (
          <WorkoutSessionCard
            key={session.id}
            session={session}
            onAction={handleStartSession}
            actionLabel={
              startingSessionId === session.exercise_preset_group?.id ? 'Starting...' :
              session.session_status === 'ongoing' ? 'Continue Workout' :
              session.session_status === 'assigned' ? 'Start Workout' :
              session.session_status === 'completed' ? 'Completed' :
              'View Details'
            }
            actionIcon={
              startingSessionId === session.exercise_preset_group?.id ? 
                <RefreshCw className="h-4 w-4 animate-spin" /> : undefined
            }
            showDetails={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {sessions?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workouts Available</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any workout sessions assigned for today.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" asChild>
                <a href="/workout/history">
                  <Calendar className="h-4 w-4 mr-2" />
                  View History
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 