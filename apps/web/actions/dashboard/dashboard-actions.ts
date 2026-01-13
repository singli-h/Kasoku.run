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
import type { WorkoutLogWithDetails, SessionPlanWithDetails } from "@/types/training"

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

    // Parallelize queries - fetch active sessions and completed sessions separately
    // This ensures assigned workouts are always shown (not pushed out by completed sessions)
    const [activeSessionsResult, completedSessionsResult, statsResult] = await Promise.all([
      // Get ongoing and assigned sessions (no limit - show all pending work)
      supabase
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
        .or(`session_status.eq.ongoing,session_status.eq.assigned`)
        .order('session_status', { ascending: false }) // ongoing first, then assigned
        .order('date_time', { ascending: true }), // oldest first (for overdue priority)

      // Get recent completed sessions for activity list
      supabase
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
        .eq('session_status', 'completed')
        .order('date_time', { ascending: false })
        .limit(10),

      // Get dashboard stats
      supabase
        .from('workout_logs')
        .select('session_status, date_time')
        .eq('athlete_id', athlete.id)
    ])

    const { data: activeSessions, error: activeSessionsError } = activeSessionsResult
    const { data: completedSessions, error: completedSessionsError } = completedSessionsResult
    const { data: statsData, error: statsError } = statsResult

    if (activeSessionsError) {
      console.error("Error fetching active sessions:", activeSessionsError)
      return {
        isSuccess: false,
        message: "Failed to fetch active sessions"
      }
    }

    if (completedSessionsError) {
      console.error("Error fetching completed sessions:", completedSessionsError)
      return {
        isSuccess: false,
        message: "Failed to fetch completed sessions"
      }
    }

    if (statsError) {
      console.error("Error fetching stats:", statsError)
      return {
        isSuccess: false,
        message: "Failed to fetch dashboard stats"
      }
    }

    // Combine sessions: active sessions first, then completed (maintaining proper priority)
    const sessions = [...(activeSessions || []), ...(completedSessions || [])]

    // Calculate stats
    const totalSessions = statsData?.length || 0
    const completedSessionsCount = statsData?.filter(s => s.session_status === 'completed').length || 0
    const completionRate = totalSessions > 0 ? (completedSessionsCount / totalSessions) * 100 : 0

    // Get this week's sessions
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeekSessions = statsData?.filter(s =>
      s.date_time && new Date(s.date_time) >= oneWeekAgo
    ).length || 0

    const stats: DashboardStats = {
      totalSessions,
      completedSessions: completedSessionsCount,
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

    // Find active session (ongoing first, then oldest assigned - prioritizes overdue)
    const activeSession = (activeSessions || []).find(
      s => s.session_status === 'ongoing' || s.session_status === 'assigned'
    )

    // Pre-fetch full workout data for active session to enable instant navigation
    let activeWorkout: WorkoutLogWithDetails | undefined = undefined
    if (activeSession) {
      const { data: fullSession, error: fullSessionError } = await supabase
        .from('workout_logs')
        .select(`
          id,
          date_time,
          session_status,
          notes,
          athlete_id,
          session_plan_id,
          session_plan:session_plans(
            id,
            name,
            description,
            date,
            session_plan_exercises(
              id,
              exercise_order,
              notes,
              exercise_id,
              superset_id,
              exercise:exercises(
                id,
                name,
                description,
                video_url,
                exercise_type:exercise_types(id, type),
                unit:units(id, name)
              ),
              session_plan_sets(
                id,
                set_index,
                reps,
                weight,
                distance,
                performing_time,
                rest_time,
                rpe
              )
            )
          ),
          athlete:athletes(
            id,
            user_id,
            athlete_group_id
          ),
          workout_log_exercises(
            id,
            exercise_id,
            exercise_order,
            superset_id,
            notes,
            session_plan_exercise_id,
            exercise:exercises(
              id,
              name,
              description,
              video_url,
              exercise_type:exercise_types(id, type),
              unit:units(id, name)
            ),
            workout_log_sets(
              id,
              set_index,
              reps,
              weight,
              distance,
              performing_time,
              rest_time,
              velocity,
              power,
              height,
              effort,
              resistance,
              tempo,
              rpe,
              completed,
              metadata,
              workout_log_exercise_id
            )
          ),
          workout_log_sets(
            id,
            set_index,
            reps,
            weight,
            distance,
            performing_time,
            rest_time,
            velocity,
            power,
            height,
            effort,
            resistance,
            tempo,
            rpe,
            completed,
            metadata,
            workout_log_exercise_id,
            session_plan_exercise_id
          )
        `)
        .eq('id', activeSession.id)
        .single()

      if (!fullSessionError && fullSession) {
        activeWorkout = {
          ...fullSession,
          session_plan: fullSession.session_plan as SessionPlanWithDetails,
          athlete: fullSession.athlete,
          workout_log_exercises: fullSession.workout_log_exercises || [],
          workout_log_sets: fullSession.workout_log_sets || []
        } as unknown as WorkoutLogWithDetails
      }
    }

    const dashboardData: DashboardData = {
      stats,
      recentSessions,
      activeWorkout
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