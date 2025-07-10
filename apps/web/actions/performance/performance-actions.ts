"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types/server-action-types"
import type {
  PeerComparison,
  BenchmarkData,
  GroupComparison,
  PerformancePercentile,
  PerformanceMetric,
  ExerciseProgress,
  GoalProgress
} from "@/components/features/performance/types/performance-types"
import {
  BarChart3,
  Repeat,
  Activity,
  Zap,
  TrendingUp,
  Users,
  Target,
  Award,
  LineChart,
  PieChart,
  Trophy,
  Star,
  Medal,
} from "lucide-react"

const iconMap: { [key: string]: React.ElementType } = {
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Repeat: Repeat,
  Activity: Activity,
  Zap: Zap,
  Users: Users,
  Target: Target,
  Award: Award,
  LineChart: LineChart,
  PieChart: PieChart,
  Trophy: Trophy,
  Star: Star,
  Medal: Medal,
}

// TODO: Implement the actual logic for fetching data from Supabase in the RPC function
export async function getComparativePerformanceDataAction(
  athleteId: string
): Promise<
  ActionState<{
    peerComparisons: PeerComparison[]
    benchmarks: BenchmarkData[]
    groupComparison: GroupComparison | null
    percentiles: PerformancePercentile[]
  }>
> {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const numericAthleteId = parseInt(athleteId, 10)
    if (isNaN(numericAthleteId)) {
      return {
        isSuccess: false,
        message: "Invalid Athlete ID provided.",
      }
    }

    const { data, error } = await supabase.rpc(
      "get_comparative_performance_data",
      {
        p_athlete_id: numericAthleteId,
      }
    )

    if (error) {
      console.error("Error fetching comparative performance data:", error)
      throw error
    }

    if (!data) {
      return {
        isSuccess: false,
        message: "No data returned from comparative performance RPC call",
      }
    }
    
    // Map icon strings to components
    const benchmarks = data.benchmarks.map(b => ({
      ...b,
      icon: iconMap[b.icon] || Activity
    }))
    
    const percentiles = data.percentiles.map(p => ({
      ...p,
      icon: iconMap[p.icon] || Activity
    }))

    return {
      isSuccess: true,
      message: "Comparative performance data retrieved successfully",
      data: {
        peerComparisons: data.peerComparisons,
        benchmarks,
        groupComparison: data.groupComparison,
        percentiles,
      },
    }
  } catch (error) {
    console.error("Error fetching comparative performance data:", error)
    return {
      isSuccess: false,
      message: "Failed to load comparative performance data"
    }
  }
}

export async function getIndividualPerformanceDataAction(
  athleteId: string
): Promise<
  ActionState<{
    performanceMetrics: PerformanceMetric[]
    exerciseProgress: ExerciseProgress[]
    goals: GoalProgress[]
  }>
> {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const numericAthleteId = parseInt(athleteId, 10)
    if (isNaN(numericAthleteId)) {
      return {
        isSuccess: false,
        message: "Invalid Athlete ID provided."
      }
    }

    const { data, error } = await supabase.rpc(
      "get_individual_performance_data",
      {
        p_athlete_id: numericAthleteId
      }
    )

    if (error) {
      console.error("Error fetching individual performance data:", error)
      throw error
    }

    if (!data) {
      return {
        isSuccess: false,
        message: "No data returned from performance RPC call"
      }
    }

    const performanceData = {
      performanceMetrics: data.performanceMetrics.map(metric => ({
        ...metric,
        icon: iconMap[metric.icon] || TrendingUp
      })),
      exerciseProgress: data.exerciseProgress,
      goals: data.goals
    }

    return {
      isSuccess: true,
      message: "Individual performance data retrieved successfully",
      data: performanceData
    }
  } catch (error) {
    console.error("Error fetching individual performance data:", error)
    return {
      isSuccess: false,
      message: "Failed to load individual performance data"
    }
  }
} 