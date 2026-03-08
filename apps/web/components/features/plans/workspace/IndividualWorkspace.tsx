"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  ChevronRight,
  Plus,
  Dumbbell,
  Edit,
  ArrowLeft,
  Sparkles,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { MesocycleWithDetails, MicrocycleWithDetails, SessionPlanWithDetails } from "@/types/training"
import { AddWorkoutDialog } from "./components/AddWorkoutDialog"
import { EditTrainingBlockDialog, type TrainingBlockFormData } from "./components/EditTrainingBlockDialog"
import { updateMesocycleAction } from "@/actions/plans/plan-actions"
import { findCurrentWeek, isWeekCurrent, formatDateShort, getDayAbbrev } from "../individual/context/utils"

// ============================================================================
// Type Definitions
// ============================================================================

interface IndividualWorkspaceProps {
  trainingBlock: MesocycleWithDetails
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * IndividualWorkspace - Simplified 2-column workspace for individual users
 * Shows Weeks (left) and Workouts (right) for the selected week
 */
export function IndividualWorkspace({ trainingBlock }: IndividualWorkspaceProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(
    findCurrentWeek(trainingBlock.microcycles)?.id ?? trainingBlock.microcycles?.[0]?.id ?? null
  )
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false)
  const [editBlockOpen, setEditBlockOpen] = useState(false)

  const selectedWeek = trainingBlock.microcycles?.find(m => m.id === selectedWeekId)
  const selectedWeekNumber = selectedWeek
    ? (trainingBlock.microcycles?.indexOf(selectedWeek) ?? 0) + 1
    : 1
  const workouts = selectedWeek?.session_plans || []

  // P1 Fix: Handle nullable dates safely with defaults
  const startDate = trainingBlock.start_date ? new Date(trainingBlock.start_date) : new Date()
  const endDate = trainingBlock.end_date ? new Date(trainingBlock.end_date) : new Date()
  const today = new Date()
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))

  // Handler for saving block edits
  const handleSaveBlock = async (data: TrainingBlockFormData) => {
    const result = await updateMesocycleAction(data.id, {
      name: data.name,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
    })

    if (result.isSuccess) {
      toast({
        title: "Block Updated",
        description: "Your training block has been updated.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to update training block",
        variant: "destructive",
      })
    }
  }

  // Handler for regenerate with AI
  const handleRegenerateWithAI = () => {
    // Navigate to the plan creation wizard with existing block context
    // The wizard will detect this is a regeneration and load existing settings
    router.push(`/plans/new?regenerate=${trainingBlock.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/plans')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trainingBlock.name || "Training Block"}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
              <Badge variant="outline">{progress}% complete</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditBlockOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRegenerateWithAI}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Workouts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weeks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weeks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1 p-4 pt-0">
                {trainingBlock.microcycles?.map((week, index) => (
                  <WeekCard
                    key={week.id}
                    week={week}
                    weekNumber={index + 1}
                    isSelected={week.id === selectedWeekId}
                    isCurrent={isWeekCurrent(week)}
                    onClick={() => setSelectedWeekId(week.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column: Workouts */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedWeek ? `Week ${(trainingBlock.microcycles?.indexOf(selectedWeek) ?? 0) + 1} Workouts` : "Workouts"}
            </CardTitle>
            {selectedWeek && (
              <Button size="sm" onClick={() => setAddWorkoutOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Workout
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedWeek ? (
              <div className="space-y-3">
                {workouts.length > 0 ? (
                  workouts.map(workout => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      blockId={trainingBlock.id}
                    />
                  ))
                ) : (
                  <EmptyWorkoutsState
                    weekName={selectedWeek.name || "this week"}
                    onAddWorkout={() => setAddWorkoutOpen(true)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a week to view workouts
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Workout Dialog */}
      {selectedWeek && (
        <AddWorkoutDialog
          open={addWorkoutOpen}
          onOpenChange={setAddWorkoutOpen}
          microcycleId={selectedWeek.id}
          blockId={trainingBlock.id}
          weekNumber={selectedWeekNumber}
        />
      )}

      {/* Edit Training Block Dialog */}
      <EditTrainingBlockDialog
        block={{
          id: trainingBlock.id,
          name: trainingBlock.name || "",
          description: trainingBlock.description,
          start_date: trainingBlock.start_date,
          end_date: trainingBlock.end_date,
        }}
        open={editBlockOpen}
        onOpenChange={setEditBlockOpen}
        onSave={handleSaveBlock}
      />
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function WeekCard({
  week,
  weekNumber,
  isSelected,
  isCurrent,
  onClick
}: {
  week: MicrocycleWithDetails
  weekNumber: number
  isSelected: boolean
  isCurrent: boolean
  onClick: () => void
}) {
  const workoutCount = week.session_plans?.length || 0
  const startDate = week.start_date ? new Date(week.start_date) : null
  const endDate = week.end_date ? new Date(week.end_date) : null

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-colors
        ${isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:bg-muted/50'
        }
        ${isCurrent && !isSelected ? 'border-primary/50' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Week {weekNumber}</span>
          {isCurrent && <Badge variant="default" className="text-[10px] px-1.5 py-0">Now</Badge>}
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {startDate && endDate && (
          <span>{formatShortDate(startDate)} - {formatShortDate(endDate)}</span>
        )}
        <span className="flex items-center gap-1">
          <Dumbbell className="h-3 w-3" />
          {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  )
}

function WorkoutCard({
  workout,
  blockId
}: {
  workout: SessionPlanWithDetails
  blockId: number
}) {
  const exerciseCount = workout.session_plan_exercises?.length || 0
  const dayLabel = workout.day !== null ? getDayAbbrev(workout.day) : null

  return (
    <Link href={`/plans/${blockId}/session/${workout.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{workout.name || 'Workout'}</span>
                {dayLabel && <Badge variant="secondary" className="text-xs">{dayLabel}</Badge>}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyWorkoutsState({
  weekName,
  onAddWorkout
}: {
  weekName: string
  onAddWorkout: () => void
}) {
  return (
    <div className="text-center py-12">
      <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="font-medium mb-1">No workouts yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add workouts to {weekName} to start planning
      </p>
      <Button onClick={onAddWorkout}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Workout
      </Button>
    </div>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

// Local date formatting helpers (work with Date objects)
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
