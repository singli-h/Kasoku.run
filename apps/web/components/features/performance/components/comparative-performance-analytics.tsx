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
import { useIsMobile } from "@/hooks/use-mobile"
// import { getComparativePerformanceDataAction } from "@/actions/performance/performance-actions" // Temporarily disabled
import type { 
  PeerComparison, 
  BenchmarkData, 
  GroupComparison, 
  PerformancePercentile 
} from "@/components/features/performance/types/performance-types"

// Types
interface ComparativePerformanceAnalyticsProps {
  athleteId?: string
  className?: string
}

export default function ComparativePerformanceAnalytics({ 
  athleteId, 
  className 
}: ComparativePerformanceAnalyticsProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedComparison, setSelectedComparison] = useState('age-group')
  const [privacyMode, setPrivacyMode] = useState(true)
  const [data, setData] = useState<{
    peerComparisons: PeerComparison[],
    benchmarks: BenchmarkData[],
    groupComparison: GroupComparison | null,
    percentiles: PerformancePercentile[]
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
        // const result = await getComparativePerformanceDataAction(athleteId) // Temporarily disabled
        const result = { isSuccess: false, message: "Performance analytics temporarily disabled" }
        if (result.isSuccess) {
          setData(null)
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
          description: "Failed to load comparative performance data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [athleteId, toast])

  const { peerComparisons, benchmarks, groupComparison, percentiles } = useMemo(() => {
    if (!data) {
      return {
        peerComparisons: [],
        benchmarks: [],
        groupComparison: null,
        percentiles: []
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

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-purple-600"
    if (percentile >= 75) return "text-green-600"
    if (percentile >= 50) return "text-blue-600"
    if (percentile >= 25) return "text-orange-600"
    return "text-red-600"
  }

  const getPercentileBadgeColor = (percentile: number) => {
    if (percentile >= 90) return "bg-purple-100 text-purple-800"
    if (percentile >= 75) return "bg-green-100 text-green-800"
    if (percentile >= 50) return "bg-blue-100 text-blue-800"
    if (percentile >= 25) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getBenchmarkProgress = (benchmark: BenchmarkData) => {
    const { userValue, benchmarks } = benchmark
    if (userValue >= benchmarks.elite) return 100
    if (userValue >= benchmarks.advanced) return 75 + ((userValue - benchmarks.advanced) / (benchmarks.elite - benchmarks.advanced)) * 25
    if (userValue >= benchmarks.intermediate) return 50 + ((userValue - benchmarks.intermediate) / (benchmarks.advanced - benchmarks.intermediate)) * 25
    if (userValue >= benchmarks.beginner) return 25 + ((userValue - benchmarks.beginner) / (benchmarks.intermediate - benchmarks.beginner)) * 25
    return (userValue / benchmarks.beginner) * 25
  }

  const renderPeerComparisonCard = (comparison: PeerComparison) => {
    const Icon = comparison.trend === 'above' ? TrendingUp : comparison.trend === 'below' ? TrendingDown : Activity
    const trendColor = comparison.trend === 'above' ? 'text-green-600' : comparison.trend === 'below' ? 'text-red-600' : 'text-gray-600'
    
    return (
      <Card key={comparison.metric}>
        <CardHeader>
          <CardTitle className="text-base font-medium">{comparison.metric}</CardTitle>
          <CardDescription>{comparison.category}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{comparison.userValue.toLocaleString()}</span>
            <span className="text-sm text-gray-500">{comparison.unit}</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Peer Average</span>
              <span>{comparison.peerAverage.toLocaleString()} {comparison.unit}</span>
            </div>
            <Progress value={comparison.percentile} className="mt-1" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Bottom 10%</span>
              <span>Top 10%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Icon className={cn("h-5 w-5", trendColor)} />
            <span className={cn("font-semibold", trendColor)}>
              {comparison.percentile}th percentile
            </span>
            <span className="text-sm text-gray-500">(vs {comparison.sampleSize} peers)</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderBenchmarkCard = (benchmark: BenchmarkData) => {
    const Icon = benchmark.icon
    const progress = getBenchmarkProgress(benchmark)

    return (
      <Card key={benchmark.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-medium">{benchmark.name}</CardTitle>
              <CardDescription>{benchmark.category}</CardDescription>
            </div>
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{benchmark.userValue.toLocaleString()} {benchmark.unit}</p>
          <p className="text-sm capitalize mt-1">Level: {benchmark.userLevel}</p>
          <div className="mt-4">
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
              <span>Elite</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGroupComparisonCard = (group: GroupComparison) => (
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
                Anonymized
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(group.metrics).map(([key, metric]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <Badge variant={metric.percentile >= 75 ? "default" : "secondary"}>
                    Top {100 - metric.percentile}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{metric.user}</span>
                  <span className="text-sm text-gray-500">/ avg {metric.groupAvg}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
  )

  const renderPercentileCard = (percentile: PerformancePercentile) => {
    const Icon = percentile.icon
    return (
      <Card key={percentile.metric}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="w-10/12">
              <CardTitle className="text-base font-medium">{percentile.metric}</CardTitle>
              <CardDescription>{percentile.category} ({percentile.comparison})</CardDescription>
            </div>
            <Icon className={cn("h-6 w-6", percentile.color)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-baseline">
            <span className={`text-3xl font-bold ${percentile.color}`}>{percentile.value}{percentile.unit === '%' ? '%' : ''}</span>
            <Badge variant="outline">{percentile.comparison}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-2">Based on a sample of {percentile.sampleSize} athletes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
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

      {privacyMode && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All comparisons are anonymized to protect user privacy. Individual identities are never revealed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="peer-comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="peer-comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="group-analytics">Group Analytics</TabsTrigger>
          <TabsTrigger value="percentiles">Percentiles</TabsTrigger>
        </TabsList>

        <TabsContent value="peer-comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peerComparisons.map(renderPeerComparisonCard)}
          </div>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks.map(renderBenchmarkCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="group-analytics" className="space-y-6">
          {groupComparison && renderGroupComparisonCard(groupComparison)}
        </TabsContent>

        <TabsContent value="percentiles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {percentiles.map(renderPercentileCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 