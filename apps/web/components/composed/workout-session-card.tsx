/**
 * Session Card Component
 * Reusable card component for displaying training sessions
 * Used in both workout page and history page
 */

"use client"

import { motion } from "framer-motion"
import { Play, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WorkoutLogWithDetails } from "@/types/training"
import { SessionStatusBadge } from './workout-session-status-badge'
import { SessionDateDisplay } from './workout-session-date-display'
import { SessionDurationDisplay } from './workout-session-duration-display'
import { SessionExerciseCount } from './workout-session-exercise-count'

interface SessionCardProps {
  session: WorkoutLogWithDetails
  onAction?: (session: WorkoutLogWithDetails) => void
  actionLabel?: string
  actionIcon?: React.ReactNode
  showDetails?: boolean
  className?: string
}

export function SessionCard({ 
  session, 
  onAction, 
  actionLabel = "Start", 
  actionIcon = <Play className="h-4 w-4" />,
  showDetails = true,
  className 
}: SessionCardProps) {
  const status = 'assigned' // Default status since the property doesn't exist on the type
  const presetGroup = session.session_plan

  if (!presetGroup) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold mb-2">
                {presetGroup.name}
              </CardTitle>
              
              <div className="flex items-center gap-2 mb-3">
                <SessionStatusBadge 
                  status={status} 
                  size="sm" 
                />
              </div>
            </div>
            
            {onAction && (
              <Button
                onClick={() => onAction(session)}
                size="sm"
                variant="default"
                className="ml-4"
              >
                {actionIcon}
                <span className="ml-2">{actionLabel}</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {showDetails && (
            <div className="space-y-3">
              {/* Session Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <SessionDateDisplay 
                  session={session} 
                  format="short"
                  size="sm"
                />
                <SessionDurationDisplay 
                  session={session}
                  size="sm"
                />
                <SessionExerciseCount 
                  session={session}
                  size="sm"
                />
              </div>

              {/* Description */}
              {presetGroup.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {presetGroup.description}
                </p>
              )}


            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SessionCard
