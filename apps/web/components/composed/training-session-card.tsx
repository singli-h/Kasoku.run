/*
<ai_context>
Training session card component for displaying workout sessions and exercise details.
Based on patterns from the original Kasoku web_old workout and session components.
Handles session status, exercise lists, and performance tracking.
</ai_context>
*/

"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Dumbbell,
  TrendingUp,
  User,
  Calendar,
  MoreVertical
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Exercise {
  id: string
  name: string
  sets: number
  reps?: string
  weight?: string
  duration?: string
  restTime?: string
  completed?: boolean
  notes?: string
}

interface TrainingSession {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
  status: 'not-started' | 'in-progress' | 'completed' | 'skipped'
  scheduledDate?: string
  startTime?: string
  endTime?: string
  duration?: number // in minutes
  exercises: Exercise[]
  completedExercises?: number
  totalEstimatedTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  coach?: string
  athlete?: string
  notes?: string
  tags?: string[]
}

interface TrainingSessionCardProps {
  session: TrainingSession
  onStart?: (sessionId: string) => void
  onPause?: (sessionId: string) => void
  onComplete?: (sessionId: string) => void
  onView?: (sessionId: string) => void
  onEdit?: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
  showActions?: boolean
  compact?: boolean
  className?: string
}

export function TrainingSessionCard({
  session,
  onStart,
  onPause,
  onComplete,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  className = ""
}: TrainingSessionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in-progress': return 'bg-blue-500'
      case 'not-started': return 'bg-gray-500'
      case 'skipped': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in-progress': return 'In Progress'
      case 'not-started': return 'Not Started'
      case 'skipped': return 'Skipped'
      default: return 'Unknown'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />
      case 'cardio': return <TrendingUp className="w-4 h-4" />
      case 'flexibility': return <User className="w-4 h-4" />
      default: return <Dumbbell className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'hard': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const completionPercentage = session.exercises.length > 0 
    ? ((session.completedExercises || 0) / session.exercises.length) * 100 
    : 0

  const primaryAction = () => {
    switch (session.status) {
      case 'not-started':
        return (
          <Button onClick={() => onStart?.(session.id)} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        )
      case 'in-progress':
        return (
          <Button onClick={() => onPause?.(session.id)} variant="outline" className="flex-1">
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        )
      case 'completed':
        return (
          <Button onClick={() => onView?.(session.id)} variant="outline" className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            View Results
          </Button>
        )
      default:
        return (
          <Button onClick={() => onView?.(session.id)} variant="outline" className="flex-1">
            View Session
          </Button>
        )
    }
  }

  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getTypeIcon(session.type)}
                <div>
                  <p className="font-medium">{session.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{session.exercises.length} exercises</span>
                    {session.totalEstimatedTime && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(session.totalEstimatedTime)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getStatusColor(session.status)}>
                {getStatusText(session.status)}
              </Badge>
              
              {showActions && session.status === 'not-started' && (
                <Button size="sm" onClick={() => onStart?.(session.id)}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              {getTypeIcon(session.type)}
              <span>{session.name}</span>
            </CardTitle>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {session.scheduledDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {session.totalEstimatedTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(session.totalEstimatedTime)}</span>
                </div>
              )}
              
              {session.difficulty && (
                <span className={`font-medium ${getDifficultyColor(session.difficulty)}`}>
                  {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={session.status === 'completed' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
              <span>{getStatusText(session.status)}</span>
            </Badge>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(session.id)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(session.id)}>
                    Edit Session
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(session.id)}
                    className="text-destructive"
                  >
                    Delete Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {session.status === 'in-progress' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
        )}
        
        {/* Exercise Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Exercises ({session.exercises.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {session.exercises.slice(0, 5).map((exercise, index) => (
              <div key={exercise.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{exercise.name}</span>
                  {exercise.completed && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="text-muted-foreground">
                  {exercise.sets} sets
                  {exercise.reps && ` × ${exercise.reps}`}
                  {exercise.weight && ` @ ${exercise.weight}`}
                </div>
              </div>
            ))}
            
            {session.exercises.length > 5 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{session.exercises.length - 5} more exercises
              </p>
            )}
          </div>
        </div>
        
        {/* Session Times */}
        {(session.startTime || session.endTime) && (
          <div className="flex justify-between text-sm text-muted-foreground">
            {session.startTime && (
              <span>Started: {formatTime(session.startTime)}</span>
            )}
            {session.endTime && (
              <span>Ended: {formatTime(session.endTime)}</span>
            )}
          </div>
        )}
        
        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {session.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Notes */}
        {session.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">{session.notes}</p>
          </div>
        )}
        
        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            {primaryAction()}
            {session.status === 'in-progress' && (
              <Button onClick={() => onComplete?.(session.id)} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 