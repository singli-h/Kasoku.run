/**
 * MesoWizard - Step 3: Session Planning
 * Implement session planning with exercise selection, ordering, and superset management
 */

"use client"

import { useState, useEffect, useMemo } from "react"
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
  Trash2,
  Star
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
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Components
import { SetConfigurationModal } from "./set-configuration-modal"
import { SessionTemplateLibrary } from "./session-template-library"

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
  // Basic parameters
  reps?: number
  weight?: number
  rpe?: number
  restTime?: number
  
  // Advanced parameters from database
  distance?: number
  duration?: number // seconds (renamed from performing_time)
  power?: number
  velocity?: number
  effort?: number
  height?: number
  resistance?: number
  resistance_unit_id?: number
  tempo?: string
  metadata?: any
  notes?: string
  
  // UI-specific fields
  completed?: boolean
}

export interface SupersetGroup {
  id: string
  label: string // A, B, C, etc.
  exercises: ExerciseInSession[]
  type: 'antagonist' | 'compound' | 'circuit' | 'standard'
  restBetweenExercises?: number // seconds
  restBetweenSets?: number // seconds
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
  // Enhanced exercise library state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExerciseType, setSelectedExerciseType] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [favoriteExercises, setFavoriteExercises] = useState<number[]>([])
  const [recentExercises, setRecentExercises] = useState<number[]>([])
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false)
  const [draggedExercise, setDraggedExercise] = useState<ExerciseInSession | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Set Configuration Modal state
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configExercise, setConfigExercise] = useState<ExerciseInSession | null>(null)
  
  // Session Template Library state
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false)

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

  // CRITICAL FIX: Update selectedSession when plan changes to ensure form inputs show current data
  useEffect(() => {
    if (selectedSession) {
      // Find the updated session object in the plan state
      const updatedSession = plan.sessions.find(s => s.id === selectedSession.id)
      if (updatedSession) {
        setSelectedSession(updatedSession)
      }
    }
  }, [plan.sessions, selectedSession?.id])

  // Enhanced exercise filtering
  const filteredExercises = useMemo(() => {
    let filtered = exercises

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.exercise_type?.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Exercise type filter
    if (selectedExerciseType) {
      filtered = filtered.filter(exercise => exercise.exercise_type_id === selectedExerciseType)
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(exercise => 
        exercise.tags?.some(tag => selectedTags.includes(tag.id))
      )
    }

    // Sort by favorites first, then recent, then alphabetical
    return filtered.sort((a, b) => {
      const aFavorite = favoriteExercises.includes(a.id)
      const bFavorite = favoriteExercises.includes(b.id)
      const aRecent = recentExercises.includes(a.id)
      const bRecent = recentExercises.includes(b.id)

      if (aFavorite && !bFavorite) return -1
      if (!aFavorite && bFavorite) return 1
      if (aRecent && !bRecent) return -1
      if (!aRecent && bRecent) return 1
      
      return a.name.localeCompare(b.name)
    })
  }, [exercises, searchTerm, selectedExerciseType, selectedTags, favoriteExercises, recentExercises])

  // Get sessions for current week
  const currentWeekSessions = plan.sessions.filter(s => s.week === currentWeek)

  // Toggle exercise favorite
  const toggleExerciseFavorite = (exerciseId: number) => {
    setFavoriteExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  // Add to recent exercises
  const addToRecentExercises = (exerciseId: number) => {
    setRecentExercises(prev => {
      const filtered = prev.filter(id => id !== exerciseId)
      return [exerciseId, ...filtered].slice(0, 10) // Keep last 10
    })
  }

  // Enhanced add exercise function
  const addExerciseToSession = (exercise: ExerciseWithDetails, sessionId: string) => {
    addToRecentExercises(exercise.id)
    
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
              { setIndex: 1, reps: 10, weight: 0, rpe: 6, restTime: 90 },
              { setIndex: 2, reps: 10, weight: 0, rpe: 7, restTime: 90 },
              { setIndex: 3, reps: 10, weight: 0, rpe: 8, restTime: 90 }
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

  // Enhanced superset management functions
  const createSuperset = (sessionId: string, exerciseIds: string[], supersetType: 'antagonist' | 'compound' | 'circuit' | 'standard' = 'standard') => {
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

  // Create a new empty superset
  const createEmptySuperset = (sessionId: string, supersetType: 'antagonist' | 'compound' | 'circuit' | 'standard' = 'standard') => {
    return `superset-${Date.now()}`
  }

  // Add exercise to existing superset
  const addExerciseToSuperset = (sessionId: string, exerciseId: string, supersetId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              ex.id === exerciseId 
                ? { ...ex, supersetId }
                : ex
            )
          }
        }
        return session
      })
    }))
  }

  // Remove exercise from superset (make it standalone)
  const removeExerciseFromSuperset = (sessionId: string, exerciseId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              ex.id === exerciseId 
                ? { ...ex, supersetId: undefined }
                : ex
            )
          }
        }
        return session
      })
    }))
  }

  // Remove entire superset
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

  // Get organized superset groups for a session
  const getSupersetGroups = (session: SessionData): { supersets: SupersetGroup[], standalone: ExerciseInSession[] } => {
    const supersetMap = new Map<string, ExerciseInSession[]>()
    const standalone: ExerciseInSession[] = []
    
    // Group exercises by superset
    session.exercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!supersetMap.has(exercise.supersetId)) {
          supersetMap.set(exercise.supersetId, [])
        }
        supersetMap.get(exercise.supersetId)!.push(exercise)
      } else {
        standalone.push(exercise)
      }
    })
    
    // Convert to SupersetGroup objects with labels
    const supersets: SupersetGroup[] = Array.from(supersetMap.entries()).map(([id, exercises], index) => ({
      id,
      label: String.fromCharCode(65 + index), // A, B, C, etc.
      exercises: exercises.sort((a, b) => a.order - b.order),
      type: 'standard', // Default type, can be enhanced later
      notes: ''
    }))
    
    return { 
      supersets: supersets.sort((a, b) => Math.min(...a.exercises.map(e => e.order)) - Math.min(...b.exercises.map(e => e.order))), 
      standalone: standalone.sort((a, b) => a.order - b.order) 
    }
  }

  // Bulk operations for exercises
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  
  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const bulkUpdateExercises = (sessionId: string, updates: Partial<ExerciseInSession>) => {
    if (selectedExerciseIds.length === 0) return

    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              selectedExerciseIds.includes(ex.id) 
                ? { ...ex, ...updates }
                : ex
            )
          }
        }
        return session
      })
    }))
    
    setSelectedExerciseIds([]) // Clear selection after bulk update
  }

  const bulkDeleteExercises = (sessionId: string) => {
    if (selectedExerciseIds.length === 0) return

    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises
              .filter(ex => !selectedExerciseIds.includes(ex.id))
              .map((ex, index) => ({ ...ex, order: index + 1 }))
          }
        }
        return session
      })
    }))
    
    setSelectedExerciseIds([]) // Clear selection after deletion
  }

  const bulkCreateSuperset = (sessionId: string) => {
    if (selectedExerciseIds.length < 2) return

    createSuperset(sessionId, selectedExerciseIds)
    setSelectedExerciseIds([]) // Clear selection after creating superset
  }

  // Enhanced exercise parameter update
  const updateExerciseParameters = (sessionId: string, exerciseId: string, setIndex: number, parameters: Partial<SetData>) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => {
              if (ex.id === exerciseId) {
                return {
                  ...ex,
                  sets: ex.sets.map(set => 
                    set.setIndex === setIndex 
                      ? { ...set, ...parameters }
                      : set
                  )
                }
              }
              return ex
            })
          }
        }
        return session
      })
    }))
  }

  // Add new set to exercise
  const addSetToExercise = (sessionId: string, exerciseId: string) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => {
              if (ex.id === exerciseId) {
                const newSetIndex = ex.sets.length + 1
                const lastSet = ex.sets[ex.sets.length - 1]
                
                return {
                  ...ex,
                  sets: [...ex.sets, {
                    setIndex: newSetIndex,
                    reps: lastSet?.reps || 10,
                    weight: lastSet?.weight || 0,
                    rpe: lastSet?.rpe || 6,
                    restTime: lastSet?.restTime || 90
                  }]
                }
              }
              return ex
            })
          }
        }
        return session
      })
    }))
  }

  // Remove set from exercise
  const removeSetFromExercise = (sessionId: string, exerciseId: string, setIndex: number) => {
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            exercises: session.exercises.map(ex => {
              if (ex.id === exerciseId && ex.sets.length > 1) {
                return {
                  ...ex,
                  sets: ex.sets
                    .filter(set => set.setIndex !== setIndex)
                    .map((set, index) => ({ ...set, setIndex: index + 1 }))
                }
              }
              return ex
            })
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

  // Set Configuration Modal handling
  const openSetConfiguration = (exercise: ExerciseInSession) => {
    setConfigExercise(exercise)
    setConfigModalOpen(true)
  }

  const handleSetsUpdate = (updatedSets: SetData[]) => {
    if (!configExercise || !selectedSession) return

    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === selectedSession.id) {
          return {
            ...session,
            exercises: session.exercises.map(ex => 
              ex.id === configExercise.id 
                ? { ...ex, sets: updatedSets }
                : ex
            )
          }
        }
        return session
      })
    }))
  }

  // Handle template selection and application
  const handleTemplateSelect = (template: any) => {
    if (!selectedSession) return

    // Convert template exercises to ExerciseInSession format
    const templateExercises: ExerciseInSession[] = template.exercises.map((exercise: any, index: number) => ({
      id: `exercise-${Date.now()}-${index}`,
      exerciseId: 0, // Placeholder - would need to match with actual exercise DB
      exercise: {
        id: 0,
        name: exercise.name,
        description: exercise.notes || '',
        exercise_type_id: 1,
        unit_id: null,
        video_url: null
      },
      order: index + 1,
      sets: Array.from({ length: exercise.sets }, (_, setIndex) => ({
        setIndex: setIndex + 1,
        reps: parseInt(exercise.reps.split('-')[0]) || 10,
        weight: exercise.weight ? 0 : undefined, // Placeholder for weight
        restTime: exercise.rest || 90,
        rpe: 7 // Default RPE
      })),
      notes: exercise.notes || '',
      restTime: exercise.rest || 90
    }))

    // Update session with template
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === selectedSession.id 
          ? { 
              ...session, 
              name: template.name,
              description: template.description,
              exercises: templateExercises,
              estimatedDuration: template.duration,
              focus: template.focus
            }
          : session
      )
    }))
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
                    {currentWeekSessions.map((session: SessionData) => (
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
                                {session.focus.slice(0, 2).map((focus: string) => (
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setTemplateLibraryOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Templates
                    </Button>
                    
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
                    <div className="flex items-center gap-2">
                      {selectedExerciseIds.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkCreateSuperset(selectedSession.id)}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Create Superset ({selectedExerciseIds.length})
                        </Button>
                      )}
                      
                      {selectedExerciseIds.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkDeleteExercises(selectedSession.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedExerciseIds.length})
                        </Button>
                      )}
                      
                      {selectedSession.exercises.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExerciseIds(
                            selectedExerciseIds.length === selectedSession.exercises.length 
                              ? [] 
                              : selectedSession.exercises.map(ex => ex.id)
                          )}
                        >
                          {selectedExerciseIds.length === selectedSession.exercises.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      )}
                    </div>
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
                                className={cn(
                                  "transition-all duration-200 hover:shadow-sm",
                                  selectedExerciseIds.includes(exercise.id) && "ring-2 ring-primary border-primary"
                                )}
                                draggable
                                onDragStart={() => handleDragStart(exercise)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index, selectedSession.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedExerciseIds.includes(exercise.id)}
                                      onCheckedChange={() => toggleExerciseSelection(exercise.id)}
                                      className="mt-1"
                                    />
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-medium">{exercise.exercise.name}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {exercise.sets.length} sets × {exercise.sets[0]?.reps || 'varies'} reps
                                            {exercise.sets[0]?.weight && ` @ ${exercise.sets[0].weight}kg`}
                                            {exercise.sets[0]?.rpe && ` RPE ${exercise.sets[0].rpe}`}
                                          </p>
                                          {exercise.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openSetConfiguration(exercise)}
                                            title="Configure sets & reps"
                                          >
                                            <Target className="h-4 w-4" />
                                          </Button>
                                          
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem onClick={() => addSetToExercise(selectedSession.id, exercise.id)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Set
                                              </DropdownMenuItem>
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
                                  </div>
                                </CardContent>
                              </Card>
                            ))}

                            {/* Superset groups */}
                            {supersets.map((superset) => (
                              <Card key={superset.id} className="border-2 border-dashed border-primary/50">
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
                                        onClick={() => removeSuperset(selectedSession.id, superset.id)}
                                      >
                                        <Unlink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    {superset.exercises.map((exercise: ExerciseInSession, index: number) => (
                                      <div 
                                        key={exercise.id} 
                                        className={cn(
                                          "flex items-center gap-3 pl-6 p-2 rounded",
                                          selectedExerciseIds.includes(exercise.id) && "bg-primary/5 ring-1 ring-primary/20"
                                        )}
                                      >
                                        <Checkbox
                                          checked={selectedExerciseIds.includes(exercise.id)}
                                          onCheckedChange={() => toggleExerciseSelection(exercise.id)}
                                          className="mt-1"
                                        />
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                          {String.fromCharCode(65 + index)}
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-medium">{exercise.exercise.name}</h4>
                                          <p className="text-sm text-muted-foreground">
                                            {exercise.sets.length} sets × {exercise.sets[0]?.reps || 'varies'} reps
                                            {exercise.sets[0]?.weight && ` @ ${exercise.sets[0].weight}kg`}
                                            {exercise.sets[0]?.rpe && ` RPE ${exercise.sets[0].rpe}`}
                                          </p>
                                          {exercise.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openSetConfiguration(exercise)}
                                            title="Configure sets & reps"
                                          >
                                            <Target className="h-4 w-4" />
                                          </Button>
                                          
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeExerciseFromSuperset(selectedSession.id, exercise.id)}
                                            title="Remove from superset"
                                          >
                                            <Unlink className="h-4 w-4" />
                                          </Button>
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

      {/* Set Configuration Modal */}
      {configExercise && (
        <SetConfigurationModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          exercise={configExercise}
          onSetsUpdate={handleSetsUpdate}
        />
      )}

      {/* Session Template Library */}
      <SessionTemplateLibrary
        open={templateLibraryOpen}
        onOpenChange={setTemplateLibraryOpen}
        onTemplateSelect={handleTemplateSelect}
      />

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