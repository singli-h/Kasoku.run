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
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

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
import { useIsMobile } from "@/hooks/use-mobile"
import { getIndividualPerformanceDataAction } from "@/actions/performance/performance-actions"
import type { 
  PerformanceMetric, 
  ExerciseProgress, 
  GoalProgress 
} from "@/components/features/performance/types/performance-types"

interface IndividualPerformanceAnalyticsProps {
  athleteId?: string
  className?: string
}

export default function IndividualPerformanceAnalytics({ 
  athleteId, 
  className 
}: IndividualPerformanceAnalyticsProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("4weeks")
  const [selectedMetric, setSelectedMetric] = useState("volume")
  const [selectedExercise, setSelectedExercise] = useState("all")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [data, setData] = useState<{
    performanceMetrics: PerformanceMetric[],
    exerciseProgress: ExerciseProgress[],
    goals: GoalProgress[]
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!athleteId) {
        setError("Athlete ID is required for performance analytics.")
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const result = await getIndividualPerformanceDataAction(athleteId)
        if (result.isSuccess) {
          setData(result.data)
        } else {
          setError(result.message)
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
        setError(errorMessage)
        toast({
          title: "Error",
          description: "Failed to load individual performance data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [athleteId, toast])

  const { performanceMetrics, exerciseProgress, goals } = useMemo(() => {
    if (!data) {
      return {
        performanceMetrics: [],
        exerciseProgress: [],
        goals: []
      }
    }
    return data
  }, [data])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  // Computed values
  const totalPRs = exerciseProgress.reduce((acc, exercise) => acc + 1, 0)
  const averageConsistency = exerciseProgress.length > 0 ? exerciseProgress.reduce((acc, exercise) => 
    acc + exercise.trends.consistency, 0) / exerciseProgress.length : 0

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
    <div className={cn("space-y-8", className)}>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">Your detailed performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map(renderMetricCard)}
      </section>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exercises">Exercise Deep-Dive</TabsTrigger>
          <TabsTrigger value="goals">Goal Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Overall performance trends over the selected time range.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
                <p>Chart Placeholder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises</SelectItem>
                {exerciseProgress.map(ex => (
                  <SelectItem key={ex.exerciseId} value={ex.exerciseId}>
                    {ex.exerciseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exerciseProgress
              .filter(ex => selectedExercise === 'all' || ex.exerciseId === selectedExercise)
              .map(renderExerciseProgressCard)}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(renderGoalCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 