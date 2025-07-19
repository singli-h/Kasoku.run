"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/server-action-types"
import type {
  DashboardData,
  RecentSession,
  DashboardStats
} from "@/components/features/dashboard/types/dashboard-types"

/**
 * Get all dashboard data for the current user using an RPC call
 */
export async function getDashboardDataAction(): Promise<
  ActionState<DashboardData>
> {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // Get database user ID using the cache utility
    const dbUserId = await getDbUserId(clerkUserId)

    const { data, error } = await supabase.rpc("get_dashboard_data", {
      p_clerk_id: clerkUserId
    })

    if (error) {
      console.error("Error fetching dashboard data:", error)
      throw error
    }

    if (!data) {
      return {
        isSuccess: false,
        message: "No data returned from dashboard RPC call"
      }
    }

    // The data from RPC is a single object with stats and recentSessions properties
    const dashboardData: DashboardData = {
      stats: data.stats,
      recentSessions: data.recent_sessions.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }))
    }

    return {
      isSuccess: true,
      message: "Dashboard data retrieved successfully",
      data: dashboardData
    }
  } catch (error) {
    console.error("Error in getDashboardDataAction:", error)
    return {
      isSuccess: false,
      message: "Failed to load dashboard data"
    }
  }
}

/**
 * Get recent training sessions for the current user
 */
export async function getRecentSessionsAction(): Promise<
  ActionState<RecentSession[]>
> {
  try {
    const result = await getDashboardDataAction()

    if (!result.isSuccess) {
      return {
        isSuccess: false,
        message: result.message
      }
    }

    return {
      isSuccess: true,
      message: "Recent sessions retrieved successfully",
      data: result.data.recentSessions
    }
  } catch (error) {
    console.error("Error fetching recent sessions:", error)
    return {
      isSuccess: false,
      message: "Failed to load recent sessions"
    }
  }
}

/**
 * Get dashboard statistics for the current user
 */
export async function getDashboardStatsAction(): Promise<
  ActionState<DashboardStats>
> {
  try {
    const result = await getDashboardDataAction()

    if (!result.isSuccess) {
      return {
        isSuccess: false,
        message: result.message
      }
    }

    return {
      isSuccess: true,
      message: "Dashboard stats retrieved successfully",
      data: result.data.stats
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      isSuccess: false,
      message: "Failed to load dashboard stats"
    }
  }
} 