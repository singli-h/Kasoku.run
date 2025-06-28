/**
 * Comparative Performance Analytics Dashboard
 * Anonymous peer comparisons, training group analytics, benchmark tracking,
 * and performance percentiles while maintaining user privacy
 */

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users,
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Timer,
  Weight,
  Trophy,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  Eye,
  EyeOff,
  Percent,
  Medal,
  Activity,
  Calendar
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/lib/hooks/use-mobile"

// Types
interface PeerComparison {
  metric: string
  userValue: number
  peerAverage: number
  percentile: number
  unit: string
  category: string
  sampleSize: number
  trend: 'above' | 'below' | 'average'
}

interface BenchmarkData {
  id: string
  name: string
  category: string
  userValue: number
  benchmarks: {
    beginner: number
    intermediate: number
    advanced: number
    elite: number
  }
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  unit: string
  icon: any
}

interface GroupComparison {
  groupId: string
  groupName: string
  memberCount: number
  userRank: number
  metrics: {
    totalVolume: { user: number; groupAvg: number; percentile: number }
    avgIntensity: { user: number; groupAvg: number; percentile: number }
    consistency: { user: number; groupAvg: number; percentile: number }
    improvement: { user: number; groupAvg: number; percentile: number }
  }
  anonymized: boolean
}

interface PerformancePercentile {
  metric: string
  value: number
  percentile: number
  unit: string
  category: string
  comparison: 'age-group' | 'weight-class' | 'experience-level' | 'overall'
  sampleSize: number
  icon: any
  color: string
}

interface ComparativePerformanceAnalyticsProps {
  athleteId?: string
  className?: string
}

// Mock data - would come from actual API with proper anonymization
const mockPeerComparisons: PeerComparison[] = [
  {
    metric: 'Weekly Volume',
    userValue: 12500,
    peerAverage: 10800,
    percentile: 72,
    unit: 'lbs',
    category: 'Volume',
    sampleSize: 156,
    trend: 'above'
  },
  {
    metric: 'Training Frequency',
    userValue: 4.2,
    peerAverage: 3.8,
    percentile: 68,
    unit: 'sessions/week',
    category: 'Consistency',
    sampleSize: 156,
    trend: 'above'
  },
  {
    metric: 'Average RPE',
    userValue: 7.8,
    peerAverage: 7.2,
    percentile: 79,
    unit: 'RPE',
    category: 'Intensity',
    sampleSize: 156,
    trend: 'above'
  },
  {
    metric: 'Recovery Time',
    userValue: 36,
    peerAverage: 42,
    percentile: 35,
    unit: 'hours',
    category: 'Recovery',
    sampleSize: 156,
    trend: 'below'
  }
]

const mockBenchmarks: BenchmarkData[] = [
  {
    id: 'squat',
    name: 'Back Squat',
    category: 'Strength',
    userValue: 315,
    benchmarks: {
      beginner: 185,
      intermediate: 245,
      advanced: 315,
      elite: 405
    },
    userLevel: 'advanced',
    unit: 'lbs',
    icon: Weight
  },
  {
    id: 'bench',
    name: 'Bench Press',
    category: 'Strength',
    userValue: 225,
    benchmarks: {
      beginner: 135,
      intermediate: 185,
      advanced: 245,
      elite: 315
    },
    userLevel: 'intermediate',
    unit: 'lbs',
    icon: Weight
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Strength',
    userValue: 405,
    benchmarks: {
      beginner: 225,
      intermediate: 315,
      advanced: 405,
      elite: 500
    },
    userLevel: 'advanced',
    unit: 'lbs',
    icon: Weight
  }
]

const mockGroupComparison: GroupComparison = {
  groupId: 'strength-team-1',
  groupName: 'Elite Strength Team',
  memberCount: 24,
  userRank: 8,
  metrics: {
    totalVolume: { user: 12500, groupAvg: 11200, percentile: 67 },
    avgIntensity: { user: 7.8, groupAvg: 7.5, percentile: 71 },
    consistency: { user: 92, groupAvg: 85, percentile: 79 },
    improvement: { user: 15.2, groupAvg: 12.8, percentile: 75 }
  },
  anonymized: true
}

const mockPercentiles: PerformancePercentile[] = [
  {
    metric: 'Squat Strength',
    value: 315,
    percentile: 85,
    unit: 'lbs',
    category: 'Strength',
    comparison: 'age-group',
    sampleSize: 2341,
    icon: Weight,
    color: 'text-blue-500'
  },
  {
    metric: 'Training Volume',
    value: 12500,
    percentile: 72,
    unit: 'lbs/week',
    category: 'Volume',
    comparison: 'experience-level',
    sampleSize: 1876,
    icon: BarChart3,
    color: 'text-green-500'
  },
  {
    metric: 'Workout Consistency',
    value: 92,
    percentile: 91,
    unit: '%',
    category: 'Consistency',
    comparison: 'overall',
    sampleSize: 5432,
    icon: Calendar,
    color: 'text-purple-500'
  },
  {
    metric: 'RPE Management',
    value: 7.8,
    percentile: 68,
    unit: 'avg RPE',
    category: 'Intensity',
    comparison: 'weight-class',
    sampleSize: 987,
    icon: Zap,
    color: 'text-orange-500'
  }
]

export default function ComparativePerformanceAnalytics({ 
  athleteId, 
  className 
}: ComparativePerformanceAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedComparison, setSelectedComparison] = useState('age-group')
  const [privacyMode, setPrivacyMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Simulated data fetching
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [selectedTimeframe, selectedComparison])

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600'
    if (percentile >= 75) return 'text-blue-600'
    if (percentile >= 50) return 'text-yellow-600'
    if (percentile >= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPercentileBadgeColor = (percentile: number) => {
    if (percentile >= 90) return 'bg-green-100 text-green-800'
    if (percentile >= 75) return 'bg-blue-100 text-blue-800'
    if (percentile >= 50) return 'bg-yellow-100 text-yellow-800'
    if (percentile >= 25) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getBenchmarkProgress = (benchmark: BenchmarkData) => {
    const levels = ['beginner', 'intermediate', 'advanced', 'elite'] as const
    const currentIndex = levels.indexOf(benchmark.userLevel)
    const nextLevel = levels[currentIndex + 1]
    
    if (!nextLevel) return 100
    
    const currentThreshold = benchmark.benchmarks[benchmark.userLevel]
    const nextThreshold = benchmark.benchmarks[nextLevel]
    const progress = Math.min(100, ((benchmark.userValue - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    
    return Math.max(0, progress)
  }

  const renderPeerComparisonCard = (comparison: PeerComparison) => {
    const Icon = comparison.trend === 'above' ? TrendingUp : comparison.trend === 'below' ? TrendingDown : Activity
    const trendColor = comparison.trend === 'above' ? 'text-green-600' : comparison.trend === 'below' ? 'text-red-600' : 'text-gray-600'
    
    return (
      <motion.div
        key={comparison.metric}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{comparison.metric}</h4>
          <Badge className={getPercentileBadgeColor(comparison.percentile)}>
            {comparison.percentile}th percentile
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your Value</span>
            <span className="font-semibold text-gray-900">
              {comparison.userValue.toLocaleString()} {comparison.unit}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Peer Average</span>
            <span className="text-gray-700">
              {comparison.peerAverage.toLocaleString()} {comparison.unit}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", trendColor)} />
              <span className={cn("text-sm font-medium", trendColor)}>
                {comparison.trend === 'above' ? 'Above Average' : 
                 comparison.trend === 'below' ? 'Below Average' : 'Average'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              n={comparison.sampleSize}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderBenchmarkCard = (benchmark: BenchmarkData) => {
    const Icon = benchmark.icon
    const progress = getBenchmarkProgress(benchmark)
    const levels = ['beginner', 'intermediate', 'advanced', 'elite'] as const
    const currentIndex = levels.indexOf(benchmark.userLevel)
    const nextLevel = levels[currentIndex + 1]
    
    return (
      <motion.div
        key={benchmark.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{benchmark.name}</h4>
              <p className="text-sm text-gray-600">{benchmark.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {benchmark.userLevel}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {benchmark.userValue} {benchmark.unit}
            </div>
            <p className="text-sm text-gray-600">Current PR</p>
          </div>
          
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress to {nextLevel}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                Next: {benchmark.benchmarks[nextLevel]} {benchmark.unit}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-4 gap-2 text-xs">
            {levels.map((level, index) => (
              <div 
                key={level}
                className={cn(
                  "text-center p-2 rounded",
                  index <= currentIndex ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                )}
              >
                <div className="font-medium capitalize">{level}</div>
                <div>{benchmark.benchmarks[level]}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  const renderGroupComparisonCard = () => {
    const group = mockGroupComparison
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {group.groupName}
              </CardTitle>
              <CardDescription>
                Your rank: #{group.userRank} of {group.memberCount} members
              </CardDescription>
            </div>
            {group.anonymized && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Anonymous
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(group.metrics).map(([key, metric]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge className={getPercentileBadgeColor(metric.percentile)}>
                    {metric.percentile}th
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">You:</span>
                    <span className="font-semibold">{metric.user.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Group Avg:</span>
                    <span>{metric.groupAvg.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPercentileCard = (percentile: PerformancePercentile) => {
    const Icon = percentile.icon
    
    return (
      <motion.div
        key={percentile.metric}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon className={cn("h-5 w-5", percentile.color)} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{percentile.metric}</h4>
              <p className="text-sm text-gray-600 capitalize">
                {percentile.comparison.replace('-', ' ')} comparison
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {percentile.value.toLocaleString()} {percentile.unit}
            </div>
            <div className={cn("text-lg font-semibold", getPercentileColor(percentile.percentile))}>
              {percentile.percentile}th percentile
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={percentile.percentile} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0th</span>
              <span>50th</span>
              <span>100th</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Based on {percentile.sampleSize.toLocaleString()} athletes
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparative Analytics</h1>
          <p className="text-gray-600">See how you stack up against your peers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedComparison} onValueChange={setSelectedComparison}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age-group">Age Group</SelectItem>
              <SelectItem value="weight-class">Weight Class</SelectItem>
              <SelectItem value="experience-level">Experience Level</SelectItem>
              <SelectItem value="overall">Overall</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPrivacyMode(!privacyMode)}
            className="shrink-0"
          >
            {privacyMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      {privacyMode && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All comparisons are anonymized to protect user privacy. Individual identities are never revealed.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="peer-comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="peer-comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="group-analysis">Group Analysis</TabsTrigger>
          <TabsTrigger value="percentiles">Percentiles</TabsTrigger>
        </TabsList>

        {/* Peer Comparison Tab */}
        <TabsContent value="peer-comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockPeerComparisons.map(renderPeerComparisonCard)}
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockBenchmarks.map(renderBenchmarkCard)}
          </div>
        </TabsContent>

        {/* Group Analysis Tab */}
        <TabsContent value="group-analysis" className="space-y-6">
          {renderGroupComparisonCard()}
        </TabsContent>

        {/* Percentiles Tab */}
        <TabsContent value="percentiles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockPercentiles.map(renderPercentileCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 