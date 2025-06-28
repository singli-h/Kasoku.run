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
} from "../index"
import { ExerciseTypeSection } from "./exercise-type-section"
import { SupersetContainer } from "./superset-container"
import { ExerciseCard } from "./exercise-card"

interface EnhancedExerciseOrganizationProps {
  exercises: WorkoutExercise[]
  className?: string
}

// View modes for exercise organization
type ViewMode = 'grouped' | 'list' | 'supersets'
type SortMode = 'order' | 'type' | 'completion' | 'difficulty'

// Enhanced section configuration with more visual indicators
const ENHANCED_SECTION_CONFIG: Record<ExerciseGroupType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  bgGradient: string
  borderColor: string
  textColor: string
  badgeVariant: "default" | "secondary" | "outline"
  description: string
  priority: number
}> = {
  "warm up": {
    label: "Warm Up",
    icon: Target,
    bgGradient: "bg-gradient-to-br from-orange-50 to-orange-100",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    badgeVariant: "secondary",
    description: "Preparation and activation exercises",
    priority: 1
  },
  "gym": {
    label: "Strength Training",
    icon: Zap,
    bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeVariant: "default",
    description: "Weight training and resistance exercises",
    priority: 2
  },
  "gymMerged": {
    label: "Strength Training",
    icon: Zap,
    bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    badgeVariant: "default",
    description: "Weight training with integrated supersets",
    priority: 2
  },
  "circuit": {
    label: "Circuit Training",
    icon: Shuffle,
    bgGradient: "bg-gradient-to-br from-green-50 to-green-100",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    badgeVariant: "secondary",
    description: "High-intensity circuit exercises",
    priority: 3
  },
  "isometric": {
    label: "Isometric",
    icon: Clock,
    bgGradient: "bg-gradient-to-br from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    badgeVariant: "secondary",
    description: "Static hold and isometric exercises",
    priority: 4
  },
  "plyometric": {
    label: "Plyometric",
    icon: ArrowUpDown,
    bgGradient: "bg-gradient-to-br from-red-50 to-red-100",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeVariant: "secondary",
    description: "Explosive power and jumping exercises",
    priority: 5
  },
  "sprint": {
    label: "Sprint",
    icon: Zap,
    bgGradient: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    badgeVariant: "secondary",
    description: "Speed and sprint training",
    priority: 6
  },
  "drill": {
    label: "Skill Drills",
    icon: Target,
    bgGradient: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    badgeVariant: "secondary",
    description: "Technical skill development",
    priority: 7
  },
  "superset": {
    label: "Superset",
    icon: Users,
    bgGradient: "bg-gradient-to-br from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    badgeVariant: "outline",
    description: "Grouped exercises performed consecutively",
    priority: 8
  },
  "other": {
    label: "Other",
    icon: MoreHorizontal,
    bgGradient: "bg-gradient-to-br from-gray-50 to-gray-100",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
    badgeVariant: "outline",
    description: "Miscellaneous exercises",
    priority: 9
  }
}

export function EnhancedExerciseOrganization({ 
  exercises, 
  className 
}: EnhancedExerciseOrganizationProps) {
  const { showVideo, toggleVideo } = useExerciseContext()
  
  // Organization state
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [sortMode, setSortMode] = useState<SortMode>('order')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showSupersetsOnly, setShowSupersetsOnly] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Group and sort exercises
  const organizedExercises = useMemo(() => {
    let filteredExercises = [...exercises]
    
    // Filter by completion status
    if (!showCompleted) {
      filteredExercises = filteredExercises.filter(ex => !ex.completed)
    }
    
    // Filter by supersets only
    if (showSupersetsOnly) {
      filteredExercises = filteredExercises.filter(ex => ex.superset_id)
    }
    
    // Sort exercises
    switch (sortMode) {
      case 'type':
        filteredExercises.sort((a, b) => {
          const typeA = a.exercise?.exercise_type_id || 0
          const typeB = b.exercise?.exercise_type_id || 0
          return typeA - typeB
        })
        break
      case 'completion':
        filteredExercises.sort((a, b) => {
          if (a.completed === b.completed) return a.preset_order - b.preset_order
          return a.completed ? 1 : -1
        })
        break
      case 'difficulty':
        // Sort by estimated difficulty (could be enhanced with actual difficulty data)
        filteredExercises.sort((a, b) => {
          const diffA = a.exercise_preset_details?.length || 0
          const diffB = b.exercise_preset_details?.length || 0
          return diffB - diffA
        })
        break
      default: // 'order'
        filteredExercises.sort((a, b) => a.preset_order - b.preset_order)
    }
    
    return groupExercises(filteredExercises)
  }, [exercises, showCompleted, showSupersetsOnly, sortMode])

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

  // Render organization controls
  const renderControls = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Exercise Organization
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {overallStats.total} exercises • {overallStats.completed} completed • {overallStats.supersets} supersets
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {overallStats.percentage}% Complete
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>View Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-completed" className="text-sm">Show completed</Label>
                    <Switch
                      id="show-completed"
                      checked={showCompleted}
                      onCheckedChange={setShowCompleted}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="supersets-only" className="text-sm">Supersets only</Label>
                    <Switch
                      id="supersets-only"
                      checked={showSupersetsOnly}
                      onCheckedChange={setShowSupersetsOnly}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-view" className="text-sm">Compact view</Label>
                    <Switch
                      id="compact-view"
                      checked={compactView}
                      onCheckedChange={setCompactView}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-video" className="text-sm">Show videos</Label>
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
      </CardHeader>
      
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="grouped" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Grouped
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="supersets" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Supersets
              </TabsTrigger>
            </TabsList>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort: {sortMode}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortMode('order')}>
                  Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('type')}>
                  Exercise Type
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('completion')}>
                  Completion Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('difficulty')}>
                  Difficulty
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )

  // Render grouped view
  const renderGroupedView = () => (
    <div className="space-y-6">
      {organizedExercises
        .sort((a, b) => {
          const configA = ENHANCED_SECTION_CONFIG[a.type]
          const configB = ENHANCED_SECTION_CONFIG[b.type]
          return configA.priority - configB.priority
        })
        .map((group) => {
          const config = ENHANCED_SECTION_CONFIG[group.type]
          const isCollapsed = collapsedSections.has(group.type)
          const Icon = config.icon
          
          return (
            <motion.div
              key={group.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn("overflow-hidden", config.borderColor)}>
                <div className={config.bgGradient}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSectionCollapse(group.type)}
                        className="flex items-center gap-3 h-auto p-0 hover:bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg border-2", config.borderColor, "bg-white/50")}>
                            <Icon className={cn("h-5 w-5", config.textColor)} />
                          </div>
                          <div className="text-left">
                            <h3 className={cn("text-lg font-semibold", config.textColor)}>
                              {config.label}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {config.description} • {group.exercises.length} exercises
                            </p>
                          </div>
                        </div>
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={config.badgeVariant}>
                          {group.exercises.filter(ex => ex.completed).length}/{group.exercises.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
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
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="space-y-3">
      {organizedExercises.flatMap(group => group.exercises).map((exercise, index) => (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ExerciseCard exercise={exercise} compact={compactView} />
        </motion.div>
      ))}
    </div>
  )

  // Render supersets view
  const renderSupersetsView = () => {
    const supersetGroups = organizedExercises.filter(group => group.type === 'superset')
    
    if (supersetGroups.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No supersets in this workout</p>
            </div>
          </CardContent>
        </Card>
      )
    }
    
    return (
      <div className="space-y-6">
        {supersetGroups.map((group, index) => (
          <motion.div
            key={group.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <SupersetContainer 
              exercises={group.exercises} 
              supersetId={group.id}
            />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {renderControls()}
      
      <div className="min-h-[400px]">
        {viewMode === 'grouped' && renderGroupedView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'supersets' && renderSupersetsView()}
      </div>
    </div>
  )
} 