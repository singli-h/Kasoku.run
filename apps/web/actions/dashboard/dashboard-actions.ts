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
 * Get all dashboard data for the current user using direct queries
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

    // Get athlete profile to determine if user is an athlete
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete) {
      return {
        isSuccess: false,
        message: "No athlete profile found"
      }
    }

    // Get today's date range for filtering
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get recent training sessions - prioritize ongoing and today's assigned sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        notes,
        session_plan:session_plans(
          name
        )
      `)
      .eq('athlete_id', athlete.id)
      .or(`session_status.eq.ongoing,session_status.eq.completed,and(date_time.gte.${startOfDay.toISOString()},date_time.lt.${endOfDay.toISOString()},session_status.eq.assigned)`)
      .order('session_status', { ascending: false }) // ongoing first, then assigned, then completed
      .order('date_time', { ascending: false })
      .limit(10)

    if (sessionsError) {
      console.error("Error fetching recent sessions:", sessionsError)
      return {
        isSuccess: false,
        message: "Failed to fetch recent sessions"
      }
    }

    // Get dashboard stats
    const { data: statsData, error: statsError } = await supabase
      .from('workout_logs')
      .select('session_status, date_time')
      .eq('athlete_id', athlete.id)

    if (statsError) {
      console.error("Error fetching stats:", statsError)
      return {
        isSuccess: false,
        message: "Failed to fetch dashboard stats"
      }
    }

    // Calculate stats
    const totalSessions = statsData?.length || 0
    const completedSessions = statsData?.filter(s => s.session_status === 'completed').length || 0
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    // Get this week's sessions
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeekSessions = statsData?.filter(s => 
      s.date_time && new Date(s.date_time) >= oneWeekAgo
    ).length || 0

    const stats: DashboardStats = {
      totalSessions,
      completedSessions,
      upcomingSessions: statsData?.filter(s => s.session_status === 'assigned').length || 0,
      activeAthletes: 1 // For now, just the current user as athlete
    }

    const recentSessions: RecentSession[] = (sessions || []).map(session => {
      // Map database status values to UI status values
      let uiStatus: 'pending' | 'in-progress' | 'completed' | 'cancelled'
      switch (session.session_status) {
        case 'assigned':
          uiStatus = 'pending'
          break
        case 'ongoing':
          uiStatus = 'in-progress'
          break
        case 'completed':
          uiStatus = 'completed'
          break
        case 'cancelled':
          uiStatus = 'cancelled'
          break
        default:
          uiStatus = 'pending'
      }

      return {
        id: session.id,
        title: session.session_plan?.name || 'Untitled Session',
        date: session.date_time ? new Date(session.date_time) : new Date(),
        status: uiStatus,
        notes: session.notes || undefined
      }
    })

    const dashboardData: DashboardData = {
      stats,
      recentSessions
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