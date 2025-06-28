/**
 * Individual Performance Analytics Dashboard
 * Comprehensive analytics for individual athlete performance tracking
 * with trend charts, exercise progress, volume/intensity tracking, and personal records
 */

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  Calendar,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Timer,
  Weight,
  Repeat,
  Trophy,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Share2,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/lib/hooks/use-mobile"

// Types
interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  icon: any
  color: string
}

interface ExerciseProgress {
  exerciseId: string
  exerciseName: string
  category: string
  personalRecord: {
    weight: number
    reps: number
    date: string
  }
  recentProgress: Array<{
    date: string
    weight: number
    reps: number
    sets: number
    volume: number
    rpe: number
  }>
  trends: {
    volume: 'up' | 'down' | 'stable'
    strength: 'up' | 'down' | 'stable'
    consistency: number
  }
}

interface GoalProgress {
  id: string
  title: string
  category: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  progress: number
  status: 'on-track' | 'behind' | 'ahead' | 'completed'
}

interface IndividualPerformanceAnalyticsProps {
  athleteId?: string
  className?: string
}

// Mock data - would come from actual API
const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    id: 'total-volume',
    name: 'Total Volume',
    value: 12500,
    unit: 'lbs',
    trend: 'up',
    trendPercentage: 8.5,
    icon: Weight,
    color: 'text-blue-500'
  },
  {
    id: 'avg-intensity',
    name: 'Avg Intensity',
    value: 7.8,
    unit: 'RPE',
    trend: 'up',
    trendPercentage: 2.1,
    icon: Zap,
    color: 'text-orange-500'
  },
  {
    id: 'workout-frequency',
    name: 'Workout Frequency',
    value: 4.2,
    unit: '/week',
    trend: 'stable',
    trendPercentage: 0.5,
    icon: Calendar,
    color: 'text-green-500'
  },
  {
    id: 'personal-records',
    name: 'Personal Records',
    value: 3,
    unit: 'this month',
    trend: 'up',
    trendPercentage: 50,
    icon: Trophy,
    color: 'text-yellow-500'
  }
]

const mockExerciseProgress: ExerciseProgress[] = [
  {
    exerciseId: 'squat',
    exerciseName: 'Back Squat',
    category: 'Legs',
    personalRecord: {
      weight: 315,
      reps: 5,
      date: '2024-01-15'
    },
    recentProgress: [
      { date: '2024-01-01', weight: 275, reps: 5, sets: 3, volume: 4125, rpe: 7 },
      { date: '2024-01-08', weight: 285, reps: 5, sets: 3, volume: 4275, rpe: 7.5 },
      { date: '2024-01-15', weight: 315, reps: 5, sets: 3, volume: 4725, rpe: 8 },
      { date: '2024-01-22', weight: 295, reps: 6, sets: 3, volume: 5310, rpe: 7.5 },
    ],
    trends: {
      volume: 'up',
      strength: 'up',
      consistency: 92
    }
  },
  {
    exerciseId: 'bench',
    exerciseName: 'Bench Press',
    category: 'Chest',
    personalRecord: {
      weight: 225,
      reps: 8,
      date: '2024-01-20'
    },
    recentProgress: [
      { date: '2024-01-01', weight: 185, reps: 8, sets: 3, volume: 4440, rpe: 7 },
      { date: '2024-01-08', weight: 195, reps: 8, sets: 3, volume: 4680, rpe: 7.5 },
      { date: '2024-01-15', weight: 205, reps: 8, sets: 3, volume: 4920, rpe: 8 },
      { date: '2024-01-20', weight: 225, reps: 8, sets: 3, volume: 5400, rpe: 8.5 },
    ],
    trends: {
      volume: 'up',
      strength: 'up',
      consistency: 88
    }
  }
]

const mockGoals: GoalProgress[] = [
  {
    id: 'squat-goal',
    title: 'Squat 350lbs x 5',
    category: 'Strength',
    targetValue: 350,
    currentValue: 315,
    unit: 'lbs',
    deadline: '2024-06-01',
    progress: 90,
    status: 'on-track'
  },
  {
    id: 'volume-goal',
    title: 'Weekly Volume 15,000lbs',
    category: 'Volume',
    targetValue: 15000,
    currentValue: 12500,
    unit: 'lbs',
    deadline: '2024-03-01',
    progress: 83,
    status: 'behind'
  }
]

export default function IndividualPerformanceAnalytics({ 
  athleteId, 
  className 
}: IndividualPerformanceAnalyticsProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  // State management
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("4weeks")
  const [selectedMetric, setSelectedMetric] = useState("volume")
  const [selectedExercise, setSelectedExercise] = useState("all")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Computed values
  const totalPRs = mockExerciseProgress.reduce((acc, exercise) => acc + 1, 0)
  const averageConsistency = mockExerciseProgress.reduce((acc, exercise) => 
    acc + exercise.trends.consistency, 0) / mockExerciseProgress.length

  const renderMetricCard = (metric: PerformanceMetric) => {
    const IconComponent = metric.icon
    const trendIcon = metric.trend === 'up' ? ArrowUp : 
                     metric.trend === 'down' ? ArrowDown : null

    return (
      <Card key={metric.id} className="mobile-card-spacing">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${metric.color}`}>
                <IconComponent className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </div>
              <div>
                <p className="text-mobile-base font-medium">{metric.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isMobile ? 'text-2xl' : 'text-xl'}`}>
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>
              </div>
            </div>
            
                         {trendIcon && (
               <div className={`flex items-center gap-1 ${
                 metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
               }`}>
                 {React.createElement(trendIcon, { className: "h-4 w-4" })}
                 <span className="text-sm font-medium">
                   {metric.trendPercentage}%
                 </span>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderExerciseProgressCard = (exercise: ExerciseProgress) => {
    const latestSession = exercise.recentProgress[exercise.recentProgress.length - 1]
    const previousSession = exercise.recentProgress[exercise.recentProgress.length - 2]
    const volumeChange = latestSession && previousSession ? 
      ((latestSession.volume - previousSession.volume) / previousSession.volume * 100) : 0

    return (
      <Card key={exercise.exerciseId} className="mobile-card-spacing">
        <CardHeader>
          <div className="flex-mobile-center">
            <div>
              <CardTitle className="text-mobile-lg">{exercise.exerciseName}</CardTitle>
              <CardDescription>{exercise.category}</CardDescription>
            </div>
            <Badge variant="secondary" className={isMobile ? "text-xs px-2 py-1" : "text-xs"}>
              {exercise.trends.consistency}% consistency
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Personal Record */}
            <div className="flex-mobile-center">
              <div>
                <p className="text-sm text-muted-foreground">Personal Record</p>
                <p className="font-semibold">
                  {exercise.personalRecord.weight}lbs × {exercise.personalRecord.reps}
                </p>
              </div>
              <Trophy className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-yellow-500`} />
            </div>

            {/* Recent Progress */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Recent Progress</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Latest Volume:</span>
                  <span className="ml-2 font-medium">
                    {latestSession?.volume.toLocaleString()}lbs
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Change:</span>
                  <span className={`ml-1 font-medium flex items-center gap-1 ${
                    volumeChange > 0 ? 'text-green-500' : volumeChange < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {volumeChange > 0 ? <ArrowUp className="h-3 w-3" /> : 
                     volumeChange < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                    {Math.abs(volumeChange).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Trend Indicators */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  exercise.trends.volume === 'up' ? 'bg-green-500' : 
                  exercise.trends.volume === 'down' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground">Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  exercise.trends.strength === 'up' ? 'bg-green-500' : 
                  exercise.trends.strength === 'down' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground">Strength</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGoalCard = (goal: GoalProgress) => {
    const statusColors = {
      'on-track': 'text-green-500 bg-green-50',
      'behind': 'text-red-500 bg-red-50',
      'ahead': 'text-blue-500 bg-blue-50',
      'completed': 'text-green-600 bg-green-100'
    }

    return (
      <Card key={goal.id} className="mobile-card-spacing">
        <CardHeader>
          <div className="flex-mobile-center">
            <div>
              <CardTitle className="text-mobile-lg">{goal.title}</CardTitle>
              <CardDescription>{goal.category}</CardDescription>
            </div>
            <Badge className={statusColors[goal.status]}>
              {goal.status.replace('-', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current:</span>
                <span className="ml-2 font-medium">
                  {goal.currentValue.toLocaleString()}{goal.unit}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>
                <span className="ml-2 font-medium">
                  {goal.targetValue.toLocaleString()}{goal.unit}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex-mobile-center gap-4">
        <div>
          <h1 className="text-mobile-xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground text-mobile-base">
            Track your progress and analyze performance trends
          </p>
        </div>
        
        <div className="mobile-button-group">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className={`w-full sm:w-[150px] ${isMobile ? 'touch-target' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1week">Last Week</SelectItem>
              <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size={isMobile ? "lg" : "default"}
                className={isMobile ? "touch-target" : ""}
              >
                <Settings className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid-mobile-cards">
        {mockPerformanceMetrics.map(renderMetricCard)}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="trends" className={isMobile ? "text-xs" : ""}>
            Trends
          </TabsTrigger>
          <TabsTrigger value="exercises" className={isMobile ? "text-xs" : ""}>
            Exercises
          </TabsTrigger>
          <TabsTrigger value="goals" className={isMobile ? "text-xs" : ""}>
            Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Performance Trends */}
          <Card className="mobile-card-spacing">
            <CardHeader>
              <CardTitle className="text-mobile-lg">Performance Trends</CardTitle>
              <CardDescription>
                Track your training volume and intensity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">+15%</div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">+8%</div>
                    <div className="text-sm text-muted-foreground">Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">7.8</div>
                    <div className="text-sm text-muted-foreground">Avg RPE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">92%</div>
                    <div className="text-sm text-muted-foreground">Consistency</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          {/* Exercise Filter */}
          <div className="flex-mobile-stack gap-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className={`w-full sm:w-[200px] ${isMobile ? 'touch-target' : ''}`}>
                <SelectValue placeholder="Filter by exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises</SelectItem>
                <SelectItem value="squat">Back Squat</SelectItem>
                <SelectItem value="bench">Bench Press</SelectItem>
                <SelectItem value="deadlift">Deadlift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Progress Cards */}
          <div className="grid-mobile-cards">
            {mockExerciseProgress.map(renderExerciseProgressCard)}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid-mobile-cards">
            {mockGoals.map(renderGoalCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 