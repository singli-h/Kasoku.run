/**
 * Session Template Library - Predefined templates for common training sessions
 * Allows users to quickly create sessions from proven training protocols
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Zap, 
  Dumbbell, 
  Heart, 
  Clock, 
  Target, 
  Flame, 
  Mountain, 
  Activity,
  Copy,
  Play,
  Star,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Timer,
  TrendingUp,
  Gauge
} from "lucide-react"

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Types
import type { SessionData, ExerciseInSession } from "./session-planning"

interface SessionTemplate {
  id: string
  name: string
  description: string
  category: 'strength' | 'cardio' | 'hiit' | 'powerlifting' | 'bodybuilding' | 'crossfit' | 'endurance' | 'recovery'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // minutes
  exercises: {
    name: string
    sets: number
    reps: string
    weight?: string
    rest: number
    notes?: string
    type: 'strength' | 'cardio' | 'plyometric' | 'flexibility'
  }[]
  tags: string[]
  icon: React.ReactNode
  popularity: number
  estimatedCalories: number
  focus: string[]
  equipment: string[]
  instructions: string[]
}

const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'upper-strength',
    name: 'Upper Body Strength',
    description: 'Classic upper body strength training focusing on compound movements',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 60,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '6-8', weight: '80-85% 1RM', rest: 180, type: 'strength' },
      { name: 'Barbell Row', sets: 4, reps: '6-8', weight: '80-85% 1RM', rest: 180, type: 'strength' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', weight: '75-80% 1RM', rest: 150, type: 'strength' },
      { name: 'Pull-ups', sets: 3, reps: '8-12', rest: 120, type: 'strength' },
      { name: 'Dips', sets: 3, reps: '10-15', rest: 120, type: 'strength' },
      { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: 90, type: 'strength' }
    ],
    tags: ['compound', 'strength', 'upper body'],
    icon: <Dumbbell className="h-4 w-4" />,
    popularity: 95,
    estimatedCalories: 350,
    focus: ['Chest', 'Back', 'Shoulders', 'Arms'],
    equipment: ['Barbell', 'Dumbbells', 'Pull-up Bar'],
    instructions: [
      'Warm up with 5-10 minutes of light cardio',
      'Perform 2-3 warm-up sets with lighter weight',
      'Focus on controlled movements and proper form',
      'Rest 48-72 hours before training upper body again'
    ]
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Blast',
    description: 'High-intensity interval training for maximum calorie burn',
    category: 'hiit',
    difficulty: 'intermediate',
    duration: 30,
    exercises: [
      { name: 'Burpees', sets: 4, reps: '30s work', rest: 30, type: 'cardio' },
      { name: 'Mountain Climbers', sets: 4, reps: '30s work', rest: 30, type: 'cardio' },
      { name: 'Jump Squats', sets: 4, reps: '30s work', rest: 30, type: 'plyometric' },
      { name: 'Push-ups', sets: 4, reps: '30s work', rest: 30, type: 'strength' },
      { name: 'High Knees', sets: 4, reps: '30s work', rest: 30, type: 'cardio' },
      { name: 'Plank Hold', sets: 1, reps: '60s', rest: 0, type: 'strength' }
    ],
    tags: ['hiit', 'cardio', 'bodyweight', 'fat loss'],
    icon: <Zap className="h-4 w-4" />,
    popularity: 88,
    estimatedCalories: 400,
    focus: ['Cardiovascular', 'Full Body', 'Fat Loss'],
    equipment: ['Bodyweight Only'],
    instructions: [
      'Warm up with 5 minutes of light movement',
      'Work at 85-95% effort during work intervals',
      'Use rest periods to recover, not stop completely',
      'Cool down with 5 minutes of stretching'
    ]
  },
  {
    id: 'powerlifting-squat',
    name: 'Powerlifting Squat Focus',
    description: 'Squat-focused session for powerlifting development',
    category: 'powerlifting',
    difficulty: 'advanced',
    duration: 90,
    exercises: [
      { name: 'Back Squat', sets: 5, reps: '3-5', weight: '85-95% 1RM', rest: 300, type: 'strength' },
      { name: 'Front Squat', sets: 3, reps: '6-8', weight: '70-80% 1RM', rest: 180, type: 'strength' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', weight: '70-75% 1RM', rest: 150, type: 'strength' },
      { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12 each leg', rest: 120, type: 'strength' },
      { name: 'Leg Press', sets: 3, reps: '15-20', rest: 90, type: 'strength' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', rest: 60, type: 'strength' }
    ],
    tags: ['powerlifting', 'squat', 'strength', 'legs'],
    icon: <Target className="h-4 w-4" />,
    popularity: 76,
    estimatedCalories: 320,
    focus: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Barbell', 'Squat Rack', 'Leg Press Machine'],
    instructions: [
      'Extended warm-up with dynamic stretches',
      'Build up to working weight gradually',
      'Focus on depth and control in squats',
      'Maintain neutral spine throughout'
    ]
  },
  {
    id: 'recovery-yoga',
    name: 'Active Recovery Yoga',
    description: 'Gentle yoga flow for recovery and mobility',
    category: 'recovery',
    difficulty: 'beginner',
    duration: 45,
    exercises: [
      { name: 'Sun Salutation A', sets: 3, reps: '5 rounds', rest: 30, type: 'flexibility' },
      { name: 'Warrior II Hold', sets: 2, reps: '60s each side', rest: 30, type: 'flexibility' },
      { name: 'Downward Dog', sets: 3, reps: '60s', rest: 30, type: 'flexibility' },
      { name: 'Pigeon Pose', sets: 2, reps: '90s each side', rest: 30, type: 'flexibility' },
      { name: 'Child\'s Pose', sets: 1, reps: '2-3 minutes', rest: 0, type: 'flexibility' },
      { name: 'Savasana', sets: 1, reps: '5 minutes', rest: 0, type: 'flexibility' }
    ],
    tags: ['recovery', 'yoga', 'flexibility', 'mobility'],
    icon: <Heart className="h-4 w-4" />,
    popularity: 82,
    estimatedCalories: 150,
    focus: ['Flexibility', 'Mobility', 'Recovery', 'Stress Relief'],
    equipment: ['Yoga Mat', 'Yoga Blocks (Optional)'],
    instructions: [
      'Focus on deep, controlled breathing',
      'Move slowly and mindfully',
      'Listen to your body and don\'t force poses',
      'End with relaxation and meditation'
    ]
  },
  {
    id: 'crossfit-wod',
    name: 'CrossFit WOD: "Fran"',
    description: 'Classic CrossFit workout - Thrusters and Pull-ups for time',
    category: 'crossfit',
    difficulty: 'advanced',
    duration: 20,
    exercises: [
      { name: 'Thrusters', sets: 1, reps: '21-15-9', weight: '95lbs/65lbs', rest: 0, type: 'strength' },
      { name: 'Pull-ups', sets: 1, reps: '21-15-9', rest: 0, type: 'strength' },
    ],
    tags: ['crossfit', 'wod', 'conditioning', 'for time'],
    icon: <Flame className="h-4 w-4" />,
    popularity: 71,
    estimatedCalories: 280,
    focus: ['Full Body', 'Conditioning', 'Mental Toughness'],
    equipment: ['Barbell', 'Pull-up Bar', 'Plates'],
    instructions: [
      'Complete 21 thrusters, then 21 pull-ups',
      'Then 15 thrusters, then 15 pull-ups',
      'Finally 9 thrusters, then 9 pull-ups',
      'Record your time for tracking progress'
    ]
  },
  {
    id: 'endurance-run',
    name: 'Endurance Base Run',
    description: 'Steady-state aerobic base building run',
    category: 'endurance',
    difficulty: 'intermediate',
    duration: 45,
    exercises: [
      { name: 'Easy Run', sets: 1, reps: '40 minutes', rest: 0, type: 'cardio', notes: 'Conversational pace' },
      { name: 'Strides', sets: 4, reps: '100m', rest: 60, type: 'cardio', notes: 'Gradual acceleration' },
      { name: 'Cool-down Walk', sets: 1, reps: '5 minutes', rest: 0, type: 'cardio' }
    ],
    tags: ['endurance', 'running', 'aerobic', 'base building'],
    icon: <Mountain className="h-4 w-4" />,
    popularity: 79,
    estimatedCalories: 450,
    focus: ['Aerobic Base', 'Endurance', 'Running Economy'],
    equipment: ['Running Shoes', 'Heart Rate Monitor (Optional)'],
    instructions: [
      'Maintain conversational pace throughout',
      'Focus on consistent effort, not speed',
      'Build weekly mileage gradually',
      'Include dynamic warm-up before running'
    ]
  }
]

interface SessionTemplateLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateSelect: (template: SessionTemplate) => void
  className?: string
}

export function SessionTemplateLibrary({ 
  open, 
  onOpenChange, 
  onTemplateSelect,
  className 
}: SessionTemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("popular")

  // Filter templates
  const filteredTemplates = SESSION_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || template.difficulty === selectedDifficulty
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  // Sort templates based on active tab
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (activeTab) {
      case 'popular':
        return b.popularity - a.popularity
      case 'quick':
        return a.duration - b.duration
      case 'intense':
        return b.estimatedCalories - a.estimatedCalories
      default:
        return 0
    }
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'strength', label: 'Strength' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'bodybuilding', label: 'Bodybuilding' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'recovery', label: 'Recovery' }
  ]

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  const handleTemplateSelect = (template: SessionTemplate) => {
    onTemplateSelect(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-6xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Session Template Library
          </DialogTitle>
          <DialogDescription>
            Choose from proven training templates to quickly build your session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular
                </TabsTrigger>
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quick
                </TabsTrigger>
                <TabsTrigger value="intense" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Intense
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {template.icon}
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {template.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.duration}min
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {template.estimatedCalories} cal
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {template.exercises.length} exercises
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {template.focus.slice(0, 3).map((focus) => (
                          <Badge key={focus} variant="secondary" className="text-xs">
                            {focus}
                          </Badge>
                        ))}
                        {template.focus.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.focus.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Sample Exercises:</div>
                        <div className="space-y-1">
                          {template.exercises.slice(0, 3).map((exercise, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{exercise.name}</span>
                              <span className="text-muted-foreground">
                                {exercise.sets} × {exercise.reps}
                              </span>
                            </div>
                          ))}
                          {template.exercises.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{template.exercises.length - 3} more exercises
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleTemplateSelect(template)}
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Use This Template
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {sortedTemplates.length} templates</span>
            <div className="flex items-center gap-2">
              <span>Can't find what you're looking for?</span>
              <Button variant="link" size="sm" className="p-0 h-auto">
                Create Custom Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 