/**
 * MesoWizard - Step 3: Session Planning
 * Implement session planning with exercise selection, ordering, and superset management
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  GripVertical,
  X,
  Link,
  Unlink,
  Calendar,
  Clock,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  MoreHorizontal,
  Copy,
  Trash2
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Types
import type { PlanType } from "./plan-type-selection"
import type { PlanConfiguration } from "./plan-configuration"
import type { ExerciseWithDetails, ExerciseType, Tag } from "@/types/training"

// Actions
import { getExercisesAction, getExerciseTypesAction, getTagsAction } from "@/actions/training/exercise-actions"

export interface SessionPlan {
  sessions: SessionData[]
  weekStructure: {
    daysPerWeek: number
    sessionsPerDay: number
  }
}

export interface SessionData {
  id: string
  name: string
  description: string
  day: number // 1-7 (Monday to Sunday)
  week: number // Week number in the plan
  exercises: ExerciseInSession[]
  estimatedDuration: number // minutes
  focus: string[]
  notes: string
}

export interface ExerciseInSession {
  id: string
  exerciseId: number
  exercise: ExerciseWithDetails
  order: number
  supersetId?: string
  sets: SetData[]
  notes: string
  restTime: number // seconds
}

export interface SetData {
  setIndex: number
  reps?: number
  weight?: number
  rpe?: number
  restTime?: number
  distance?: number
  duration?: number // seconds
  notes?: string
}

interface SessionPlanningProps {
  planType: PlanType
  configuration: PlanConfiguration
  sessionPlan: SessionPlan | null
  onSessionPlanChange: (plan: SessionPlan) => void
  onNext: () => void
  onPrevious: () => void
  isLoading?: boolean
  className?: string
}

// Helper function to generate default sessions based on plan type
const generateDefaultSessions = (planType: PlanType, configuration: PlanConfiguration): SessionData[] => {
  const sessions: SessionData[] = []
  if (!configuration?.duration) {
    return sessions;
  }
  const weeks = configuration.duration.weeks
  
  // Default session structure based on plan type
  const sessionStructures = {
    macrocycle: { daysPerWeek: 5, sessionsPerDay: 1 },
    mesocycle: { daysPerWeek: 4, sessionsPerDay: 1 },
    microcycle: { daysPerWeek: 3, sessionsPerDay: 1 }
  }
  
  const structure = sessionStructures[planType]
  
  for (let week = 1; week <= weeks; week++) {
    for (let day = 1; day <= structure.daysPerWeek; day++) {
      sessions.push({
        id: `session-${week}-${day}`,
        name: `Week ${week} - Day ${day}`,
        description: '',
        day,
        week,
        exercises: [],
        estimatedDuration: 60,
        focus: [],
        notes: ''
      })
    }
  }
  
  return sessions
}

export function SessionPlanning({ 
  planType, 
  configuration, 
  sessionPlan, 
  onSessionPlanChange, 
  onNext, 
  onPrevious,
  isLoading = false,
  className 
}: SessionPlanningProps) {
  // State management
  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExerciseType, setSelectedExerciseType] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false)
  const [draggedExercise, setDraggedExercise] = useState<ExerciseInSession | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize session plan
  const [plan, setPlan] = useState<SessionPlan>(() => {
    if (sessionPlan) return sessionPlan
    
    const sessions = generateDefaultSessions(planType, configuration)
    return {
      sessions,
      weekStructure: {
        daysPerWeek: planType === 'macrocycle' ? 5 : planType === 'mesocycle' ? 4 : 3,
        sessionsPerDay: 1
      }
    }
  })

  // Load exercise data
  useEffect(() => {
    const loadExerciseData = async () => {
      try {
        const [exercisesResult, typesResult, tagsResult] = await Promise.all([
          getExercisesAction(),
          getExerciseTypesAction(),
          getTagsAction()
        ])

        if (exercisesResult.isSuccess) {
          setExercises(exercisesResult.data)
        }
        if (typesResult.isSuccess) {
          setExerciseTypes(typesResult.data)
        }
        if (tagsResult.isSuccess) {
          setTags(tagsResult.data)
        }
      } catch (error) {
        console.error('Error loading exercise data:', error)
      }
    }

    loadExerciseData()
  }, [])

  // Update parent when plan changes
  useEffect(() => {
    onSessionPlanChange(plan)
  }, [plan, onSessionPlanChange])

  // Set first session as selected when week changes
  useEffect(() => {
    const weekSessions = plan.sessions.filter(s => s.week === currentWeek)
    if (weekSessions.length > 0 && !selectedSession) {
      setSelectedSession(weekSessions[0])
    }
  }, [currentWeek, plan.sessions, selectedSession])

  // Filter exercises based on search and filters
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedExerciseType || exercise.exercise_type_id === selectedExerciseType
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tagId => exercise.tags?.some(tag => tag.id === tagId))
    
    return matchesSearch && matchesType && matchesTags
  })

  // Get sessions for current week
  const currentWeekSessions = plan.sessions.filter(s => s.week === currentWeek)

  // Add exercise to session
  const addExerciseToSession = (exercise: ExerciseWithDetails, sessionId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          const newExercise: ExerciseInSession = {
            id: `exercise-${Date.now()}`,
            exerciseId: exercise.id,
            exercise,
            order: session.exercises.length + 1,
            sets: [
              { setIndex: 1, reps: 10, weight: 0, rpe: 6 },
              { setIndex: 2, reps: 10, weight: 0, rpe: 7 },
              { setIndex: 3, reps: 10, weight: 0, rpe: 8 }
            ],
            notes: '',
            restTime: 90
          }
          
          return {
            ...session,
            exercises: [...session.exercises, newExercise]
          }
        }
        return session
      })
    }))
    
    setIsExerciseLibraryOpen(false)
  }

  // Remove exercise from session
  const removeExerciseFromSession = (sessionId: string, exerciseId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises
              .filter(ex => ex.id !== exerciseId)
              .map((ex, index) => ({ ...ex, order: index + 1 }))
          }
        }
        return session
      })
    }))
  }

  // Create superset
  const createSuperset = (sessionId: string, exerciseIds: string[]) => {
    const supersetId = `superset-${Date.now()}`
    
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              exerciseIds.includes(ex.id) 
                ? { ...ex, supersetId }
                : ex
            )
          }
        }
        return session
      })
    }))
  }

  // Remove superset
  const removeSuperset = (sessionId: string, supersetId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              ex.supersetId === supersetId 
                ? { ...ex, supersetId: undefined }
                : ex
            )
          }
        }
        return session
      })
    }))
  }

  // Update session details
  const updateSession = (sessionId: string, updates: Partial<SessionData>) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === sessionId ? { ...session, ...updates } : session
      )
    }))
  }

  // Drag and drop handlers
  const handleDragStart = (exercise: ExerciseInSession) => {
    setDraggedExercise(exercise)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number, sessionId: string) => {
    e.preventDefault()
    
    if (!draggedExercise) return
    
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          const exercises = [...session.exercises]
          const draggedIndex = exercises.findIndex(ex => ex.id === draggedExercise.id)
          
          if (draggedIndex !== -1) {
            exercises.splice(draggedIndex, 1)
            exercises.splice(targetIndex, 0, draggedExercise)
            
            // Update order
            return {
              ...session,
              exercises: exercises.map((ex, index) => ({ ...ex, order: index + 1 }))
            }
          }
        }
        return session
      })
    }))
    
    setDraggedExercise(null)
  }

  // Validation
  const validatePlan = () => {
    const newErrors: Record<string, string> = {}
    
    const sessionsWithExercises = plan.sessions.filter(s => s.exercises.length > 0)
    if (sessionsWithExercises.length === 0) {
      newErrors.sessions = 'At least one session must have exercises'
    }
    
    // Check for sessions without names
    const unnamedSessions = plan.sessions.filter(s => s.exercises.length > 0 && !s.name.trim())
    if (unnamedSessions.length > 0) {
      newErrors.sessionNames = 'All sessions with exercises must have names'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (validatePlan()) {
      onNext()
    }
  }

  // Get superset groups for a session
  const getSupersetGroups = (session: SessionData) => {
    const supersets = new Map<string, ExerciseInSession[]>()
    const standalone: ExerciseInSession[] = []
    
    session.exercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!supersets.has(exercise.supersetId)) {
          supersets.set(exercise.supersetId, [])
        }
        supersets.get(exercise.supersetId)!.push(exercise)
      } else {
        standalone.push(exercise)
      }
    })
    
    return { supersets: Array.from(supersets.entries()), standalone }
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h2 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Plan Your Training Sessions
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Create detailed session plans with exercise selection, ordering, and superset management.
        </motion.p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Week Navigation & Session List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Training Schedule
              </CardTitle>
              <CardDescription>
                {configuration.duration.weeks} week {planType}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Week Selector */}
              <div className="space-y-2">
                <Label>Select Week</Label>
                <Select
                  value={currentWeek.toString()}
                  onValueChange={(value) => setCurrentWeek(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: configuration.duration.weeks }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Week {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session List */}
              <div className="space-y-2">
                <Label>Sessions</Label>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {currentWeekSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          selectedSession?.id === session.id
                            ? "ring-2 ring-primary border-primary"
                            : "hover:shadow-md"
                        )}
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{session.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                Day {session.day}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Dumbbell className="h-3 w-3" />
                              <span>{session.exercises.length} exercises</span>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>{session.estimatedDuration}min</span>
                            </div>
                            {session.focus.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {session.focus.slice(0, 2).map((focus) => (
                                  <Badge key={focus} variant="secondary" className="text-xs">
                                    {focus}
                                  </Badge>
                                ))}
                                {session.focus.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{session.focus.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Session Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          {selectedSession ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {selectedSession.name}
                    </CardTitle>
                    <CardDescription>
                      Week {selectedSession.week}, Day {selectedSession.day}
                    </CardDescription>
                  </div>
                  <Dialog open={isExerciseLibraryOpen} onOpenChange={setIsExerciseLibraryOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Exercise Library</DialogTitle>
                        <DialogDescription>
                          Select exercises to add to your session
                        </DialogDescription>
                      </DialogHeader>
                      
                      {/* Exercise Library Content */}
                      <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search exercises..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <Select
                            value={selectedExerciseType?.toString() || "all"}
                            onValueChange={(value) => 
                              setSelectedExerciseType(value === "all" ? null : parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Exercise Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {exerciseTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Exercise List */}
                        <ScrollArea className="h-96">
                          <div className="grid gap-2">
                            {filteredExercises.map((exercise) => (
                              <Card
                                key={exercise.id}
                                className="cursor-pointer hover:shadow-md transition-all duration-200"
                                onClick={() => addExerciseToSession(exercise, selectedSession.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <h4 className="font-medium">{exercise.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {exercise.description}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {exercise.exercise_type?.type}
                                        </Badge>
                                        {exercise.unit && (
                                          <Badge variant="outline" className="text-xs">
                                            {exercise.unit.name}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button size="sm">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-name">Session Name</Label>
                    <Input
                      id="session-name"
                      value={selectedSession.name}
                      onChange={(e) => updateSession(selectedSession.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated-duration">Duration (minutes)</Label>
                    <Input
                      id="estimated-duration"
                      type="number"
                      value={selectedSession.estimatedDuration}
                      onChange={(e) => updateSession(selectedSession.id, { 
                        estimatedDuration: parseInt(e.target.value) || 60 
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-description">Description</Label>
                  <Textarea
                    id="session-description"
                    value={selectedSession.description}
                    onChange={(e) => updateSession(selectedSession.id, { description: e.target.value })}
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Exercise List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Exercises ({selectedSession.exercises.length})</Label>
                    {selectedSession.exercises.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Create superset from selected exercises (simplified for demo)
                          const exerciseIds = selectedSession.exercises.slice(0, 2).map(ex => ex.id)
                          createSuperset(selectedSession.id, exerciseIds)
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Create Superset
                      </Button>
                    )}
                  </div>

                  {selectedSession.exercises.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No exercises added yet</p>
                      <p className="text-sm">Click "Add Exercise" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const { supersets, standalone } = getSupersetGroups(selectedSession)
                        
                        return (
                          <>
                            {/* Standalone exercises */}
                            {standalone.map((exercise, index) => (
                              <Card
                                key={exercise.id}
                                className="transition-all duration-200 hover:shadow-sm"
                                draggable
                                onDragStart={() => handleDragStart(exercise)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index, selectedSession.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="font-medium">{exercise.exercise.name}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {exercise.sets.length} sets × {exercise.sets[0]?.reps || 0} reps
                                          </p>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem>
                                              <Copy className="h-4 w-4 mr-2" />
                                              Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => removeExerciseFromSession(selectedSession.id, exercise.id)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}

                            {/* Superset groups */}
                            {supersets.map(([supersetId, exercises]) => (
                              <Card key={supersetId} className="border-2 border-dashed border-primary/50">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Link className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-sm">Superset</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSuperset(selectedSession.id, supersetId)}
                                      >
                                        <Unlink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    {exercises.map((exercise, index) => (
                                      <div key={exercise.id} className="flex items-center gap-3 pl-6">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                          {String.fromCharCode(65 + index)}
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-medium">{exercise.exercise.name}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {exercise.sets.length} sets × {exercise.sets[0]?.reps || 0} reps
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Session Notes */}
                <div className="space-y-2">
                  <Label htmlFor="session-notes">Session Notes</Label>
                  <Textarea
                    id="session-notes"
                    value={selectedSession.notes}
                    onChange={(e) => updateSession(selectedSession.id, { notes: e.target.value })}
                    placeholder="Add any additional notes for this session..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a session to start planning</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above before continuing.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous Step
        </Button>
        
        <div className="text-center">
          <Badge variant="outline">Step 3 of 4</Badge>
        </div>
        
        <Button onClick={handleNext} className="flex items-center gap-2">
          Next Step
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}