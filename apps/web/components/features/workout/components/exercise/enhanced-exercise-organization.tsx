/**
 * Enhanced Exercise Organization Component
 * Advanced exercise organization with improved visual indicators, 
 * smart grouping controls, and enhanced superset visualization
 */

"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronDown, 
  ChevronRight, 
  Grid3X3, 
  List, 
  Filter, 
  Eye, 
  EyeOff,
  Shuffle,
  ArrowUpDown,
  Users,
  Target,
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Settings,
  Layers,
  Link,
  Unlink
} from "lucide-react"

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Workout components
import { 
  useExerciseContext,
  groupExercises,
  type WorkoutExercise,
  type ExerciseGroup,
  type ExerciseGroupType
} from "../../index"
import { ExerciseTypeSection } from "./exercise-type-section"
import { SupersetContainer } from "./superset-container"
import { ExerciseCard } from "./exercise-card"

interface EnhancedExerciseOrganizationProps {
  exercises: WorkoutExercise[]
  className?: string
}

// View modes for exercise organization - simplified per user feedback
type ViewMode = 'grouped' | 'list'
type SortMode = 'order'

// Clean section configuration - Apple-like design
const SECTION_CONFIG: Record<ExerciseGroupType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  priority: number
}> = {
  "warm up": {
    label: "Warm Up",
    icon: Target,
    priority: 1
  },
  "gym": {
    label: "Strength Training",
    icon: Zap,
    priority: 2
  },
  "gymMerged": {
    label: "Strength Training",
    icon: Zap,
    priority: 2
  },
  "circuit": {
    label: "Circuit Training",
    icon: Shuffle,
    priority: 3
  },
  "isometric": {
    label: "Isometric",
    icon: Clock,
    priority: 4
  },
  "plyometric": {
    label: "Plyometric",
    icon: ArrowUpDown,
    priority: 5
  },
  "sprint": {
    label: "Sprint",
    icon: Zap,
    priority: 6
  },
  "drill": {
    label: "Skill Drills",
    icon: Target,
    priority: 7
  },
  "superset": {
    label: "Superset",
    icon: Users,
    priority: 8
  },
  "other": {
    label: "Other",
    icon: MoreHorizontal,
    priority: 9
  }
}

export function EnhancedExerciseOrganization({ 
  exercises, 
  className 
}: EnhancedExerciseOrganizationProps) {
  const { showVideo, toggleVideo } = useExerciseContext()
  
  // Simplified state management
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [showCompleted, setShowCompleted] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Simple exercise organization - maintain order, filter by completion
  const organizedExercises = useMemo(() => {
    let filteredExercises = [...exercises]
    
    // Filter by completion status if needed
    if (!showCompleted) {
      filteredExercises = filteredExercises.filter(ex => !ex.completed)
    }
    
    // Maintain preset order
    filteredExercises.sort((a, b) => ((a as any).exercise_order || 0) - ((b as any).exercise_order || 0))
    
    return groupExercises(filteredExercises)
  }, [exercises, showCompleted])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const total = exercises.length
    const completed = exercises.filter(ex => ex.completed).length
    const supersets = new Set(exercises.filter(ex => ex.superset_id).map(ex => ex.superset_id)).size
    const types = new Set(exercises.map(ex => ex.exercise?.exercise_type_id)).size
    
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      supersets,
      types
    }
  }, [exercises])

  // Toggle section collapse
  const toggleSectionCollapse = (sectionType: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionType)) {
      newCollapsed.delete(sectionType)
    } else {
      newCollapsed.add(sectionType)
    }
    setCollapsedSections(newCollapsed)
  }

  // Clean, minimal controls
  const renderControls = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'grouped' 
                ? "bg-white shadow-sm text-gray-900" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            Grouped
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'list' 
                ? "bg-white shadow-sm text-gray-900" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {overallStats.completed} / {overallStats.total} complete
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="btn-outline-enhanced">
              <Settings className="h-4 w-4 mr-2" />
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                  <Label htmlFor="show-completed" className="text-sm font-medium text-high-contrast">
                  Show completed
                </Label>
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
              </div>
              
              <div className="flex items-center justify-between">
                  <Label htmlFor="show-video" className="text-sm font-medium text-high-contrast">
                  Show videos
                </Label>
                <Switch
                  id="show-video"
                  checked={showVideo}
                  onCheckedChange={toggleVideo}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  // Clean grouped view
  const renderGroupedView = () => (
    <div className="space-y-4">
      {organizedExercises
        .sort((a, b) => {
          const configA = SECTION_CONFIG[a.type]
          const configB = SECTION_CONFIG[b.type]
          return configA.priority - configB.priority
        })
        .map((group) => {
          const config = SECTION_CONFIG[group.type]
          const isCollapsed = collapsedSections.has(group.type)
          const Icon = config.icon
          
          return (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="card-enhanced border rounded-lg">
                <div className="p-4">
                  <button
                    onClick={() => toggleSectionCollapse(group.type)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-medium-contrast" />
                      </div>
                      <div>
                        <h3 className="font-medium text-high-contrast">
                          {config.label}
                        </h3>
                        <p className="text-sm text-medium-contrast">
                          {group.exercises.length} exercises
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-medium-contrast">
                        {group.exercises.filter(ex => ex.completed).length}/{group.exercises.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-low-contrast" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-low-contrast" />
                      )}
                    </div>
                  </button>
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4">
                        {group.type === 'superset' ? (
                          <SupersetContainer 
                            exercises={group.exercises} 
                            supersetId={group.id}
                          />
                        ) : (
                          <ExerciseTypeSection 
                            group={group} 
                            defaultCollapsed={false}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
    </div>
  )

  // Clean list view
  const renderListView = () => (
    <div className="space-y-3">
      {organizedExercises.flatMap(group => group.exercises).map((exercise, index) => (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.02 }}
        >
          <ExerciseCard exercise={exercise} />
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className={cn("space-y-4", className)}>
      {renderControls()}
      
      <div className="min-h-[200px]">
        {viewMode === 'grouped' && renderGroupedView()}
        {viewMode === 'list' && renderListView()}
      </div>
    </div>
  )
} 