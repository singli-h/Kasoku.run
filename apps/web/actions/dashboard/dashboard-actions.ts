"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/server-action-types"
import type {
  DashboardData,
  RecentSession,
  DashboardStats,
  CoachWeekDashboardData
} from "@/components/features/dashboard/types/dashboard-types"
import type { WorkoutLogWithDetails, SessionPlanWithDetails } from "@/types/training"
import { formatExerciseSummary } from "@/lib/training-utils"
import type { ExerciseWithSets } from "@/lib/training-utils"

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
        isSuccess: true,
        message: "Dashboard loaded",
        data: {
          stats: {
            totalSessions: 0,
            completedSessions: 0,
            upcomingSessions: 0,
            activeAthletes: 0,
          },
          recentSessions: [],
          activeWorkout: undefined,
        }
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
      activeAthletes: 0
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
              target_subgroups,
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
            athlete_group_id,
            subgroups
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

/**
 * Get coach weekly dashboard data — compliance stats, today's sessions by group, active plans.
 * Single week-scoped query + parallel plan query. All aggregation done in-memory.
 */
export async function getCoachWeekDashboardDataAction(): Promise<
  ActionState<CoachWeekDashboardData>
> {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    const dbUserId = await getDbUserId(clerkUserId)

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (coachError || !coach) {
      return {
        isSuccess: false,
        message: "No coach profile found"
      }
    }

    // First get coach's athlete groups
    const { data: groups } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('coach_id', coach.id)

    const groupIds = groups?.map(g => g.id) || []

    // Compute week boundaries (Mon–Sun)
    const now = new Date()
    const today = now.toISOString().substring(0, 10)
    const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

    const emptyData: CoachWeekDashboardData = {
      weekStats: { totalSessions: 0, completedSessions: 0, completionRate: 0, athletesNotTrained: 0, totalAthletes: 0, activePlans: 0 },
      weekLabel,
      todayGroups: [],
      todayTotal: { completed: 0, total: 0 },
      activePlanDetails: []
    }

    if (groupIds.length === 0) {
      return { isSuccess: true, message: "Coach dashboard data retrieved", data: emptyData }
    }

    // Get athletes with subgroups (lightweight — no user join needed)
    const { data: athletesData, error: athletesError } = await supabase
      .from('athletes')
      .select('id, subgroups')
      .in('athlete_group_id', groupIds)

    if (athletesError) {
      console.error("Error fetching athletes:", athletesError)
      return { isSuccess: false, message: "Failed to fetch athletes" }
    }

    const athleteIds = athletesData?.map(a => a.id) || []
    const totalAthletes = athleteIds.length

    // Build athlete → primary subgroup lookup (first entry or "General")
    const athleteGroupMap = new Map<number, string>()
    for (const a of athletesData || []) {
      const primaryGroup = a.subgroups && a.subgroups.length > 0 ? a.subgroups[0] : 'General'
      athleteGroupMap.set(a.id, primaryGroup)
    }

    // Parallel: week's workout_logs + active macrocycles with mesocycles
    const [weekLogsResult, activePlansResult] = await Promise.all([
      athleteIds.length > 0
        ? supabase
            .from('workout_logs')
            .select('athlete_id, date_time, session_status')
            .in('athlete_id', athleteIds)
            .gte('date_time', weekStart.toISOString())
            .lte('date_time', weekEnd.toISOString())
        : Promise.resolve({ data: [] as Array<{ athlete_id: number | null; date_time: string | null; session_status: string }>, error: null }),

      supabase
        .from('macrocycles')
        .select(`
          id, name, start_date, end_date,
          mesocycles(id, name, start_date, end_date)
        `)
        .eq('user_id', dbUserId)
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .lte('start_date', now.toISOString())
        .gte('end_date', now.toISOString())
    ])

    // --- Section 1: Week Stats ---
    const weekLogs = weekLogsResult.data || []
    const completedWeekLogs = weekLogs.filter(l => l.session_status === 'completed')
    const totalWeekSessions = weekLogs.length
    const completedWeekSessions = completedWeekLogs.length
    const completionRate = totalWeekSessions > 0
      ? Math.round((completedWeekSessions / totalWeekSessions) * 100)
      : 0

    const trainedAthleteIds = new Set(completedWeekLogs.map(l => l.athlete_id))
    const athletesNotTrained = totalAthletes - trainedAthleteIds.size

    // --- Section 2: Today by group ---
    const todayLogs = weekLogs.filter(l => l.date_time?.substring(0, 10) === today)

    const groupAgg = new Map<string, { completed: number; total: number }>()
    for (const log of todayLogs) {
      const group = log.athlete_id ? (athleteGroupMap.get(log.athlete_id) || 'General') : 'General'
      const entry = groupAgg.get(group) || { completed: 0, total: 0 }
      entry.total++
      if (log.session_status === 'completed') entry.completed++
      groupAgg.set(group, entry)
    }

    const todayGroups = Array.from(groupAgg.entries())
      .map(([subgroup, counts]) => ({ subgroup, ...counts }))
      .sort((a, b) => a.subgroup.localeCompare(b.subgroup))

    const todayCompleted = todayLogs.filter(l => l.session_status === 'completed').length

    // --- Section 3: Active plans with phase ---
    const activePlanDetails = (activePlansResult.data || []).map(macro => {
      const mesocycles = (macro.mesocycles || []) as Array<{ id: number; name: string | null; start_date: string | null; end_date: string | null }>

      const currentMeso = mesocycles.find(m =>
        m.start_date && m.end_date &&
        today >= m.start_date.substring(0, 10) &&
        today <= m.end_date.substring(0, 10)
      )

      const macroStart = new Date(macro.start_date!)
      const macroEnd = new Date(macro.end_date!)
      const totalWeeks = Math.max(1, Math.ceil((macroEnd.getTime() - macroStart.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      const currentWeek = Math.min(
        totalWeeks,
        Math.max(1, Math.ceil((now.getTime() - macroStart.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      )

      return {
        id: macro.id,
        name: macro.name || 'Untitled Plan',
        currentPhase: currentMeso?.name || null,
        currentWeek,
        totalWeeks
      }
    })

    return {
      isSuccess: true,
      message: "Coach dashboard data retrieved",
      data: {
        weekStats: {
          totalSessions: totalWeekSessions,
          completedSessions: completedWeekSessions,
          completionRate,
          athletesNotTrained,
          totalAthletes,
          activePlans: activePlanDetails.length
        },
        weekLabel,
        todayGroups,
        todayTotal: { completed: todayCompleted, total: todayLogs.length },
        activePlanDetails
      }
    }
  } catch (error) {
    console.error("Error in getCoachWeekDashboardDataAction:", error)
    return { isSuccess: false, message: "Failed to load coach dashboard data" }
  }
}

// ============================================================================
// WEEK CALENDAR ACTIONS
// ============================================================================

export interface WeekCalendarSession {
  id: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  exercises: Array<{
    name: string
    summary: string
    target_subgroups: string[] | null
  }>
}

/**
 * Get sessions for a 7-day window starting from weekStart (Monday).
 * Used by the dashboard mini calendar strip.
 * Subgroup filtering is handled by RLS for athlete role.
 */
export async function getWeekSessionsAction(
  weekStart: string
): Promise<ActionState<WeekCalendarSession[]>> {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(clerkUserId)

    // Get athlete profile (include subgroups for exercise filtering)
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id, subgroups')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete) {
      return {
        isSuccess: true,
        message: "No athlete profile",
        data: []
      }
    }

    const athleteSubgroups: string[] = athlete.subgroups ?? []

    // Calculate week end (weekStart + 6 days, end of day)
    const startDate = new Date(weekStart)
    const endDate = new Date(weekStart)
    endDate.setDate(endDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)

    // Fetch workout_logs for the week with session plan details
    const { data: sessions, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        session_status,
        session_plan:session_plans(
          id,
          name,
          session_plan_exercises(
            id,
            exercise_order,
            target_subgroups,
            exercise:exercises(
              id,
              name,
              exercise_type:exercise_types(id)
            ),
            session_plan_sets(
              reps,
              weight,
              distance,
              performing_time,
              rest_time
            )
          )
        )
      `)
      .eq('athlete_id', athlete.id)
      .gte('date_time', startDate.toISOString())
      .lte('date_time', endDate.toISOString())
      .order('date_time', { ascending: true })

    if (error) {
      console.error("[getWeekSessionsAction] Error:", error)
      return { isSuccess: false, message: "Failed to fetch week sessions" }
    }

    // Transform to WeekCalendarSession[]
    const weekSessions: WeekCalendarSession[] = (sessions || []).map((session: any) => {
      // Map DB status to UI status
      let status: WeekCalendarSession['status'] = 'pending'
      switch (session.session_status) {
        case 'assigned': status = 'pending'; break
        case 'ongoing': status = 'in-progress'; break
        case 'completed': status = 'completed'; break
        case 'cancelled': status = 'cancelled'; break
      }

      // Extract date as YYYY-MM-DD
      const dateStr = session.date_time
        ? session.date_time.substring(0, 10)
        : ''

      // Build exercise summaries (filtered by athlete's subgroups)
      const allExercises = (session.session_plan?.session_plan_exercises || [])
        .slice()
        .sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))
      const exercises = allExercises
        .filter((spe: any) => {
          // Include if target_subgroups is null/empty (untagged exercise = all athletes see it)
          if (!spe.target_subgroups || spe.target_subgroups.length === 0) return true
          // Untagged athlete = only untagged exercises
          if (!athleteSubgroups.length) return false
          // Include if any of athlete's subgroups overlaps with target_subgroups
          return spe.target_subgroups.some((g: string) => athleteSubgroups.includes(g))
        })
        .map((spe: any) => {
          const exerciseTypeId = spe.exercise?.exercise_type?.id ?? null
          const sets = (spe.session_plan_sets || []).map((s: any) => ({
            reps: s.reps,
            weight: s.weight,
            distance: s.distance,
            performing_time: s.performing_time,
            rest_time: s.rest_time,
          }))

          const exerciseWithSets: ExerciseWithSets = {
            exercise_type_id: exerciseTypeId,
            sets,
          }

          return {
            name: spe.exercise?.name || 'Unknown Exercise',
            summary: formatExerciseSummary(exerciseWithSets),
            target_subgroups: spe.target_subgroups,
          }
        })

      return {
        id: session.id,
        title: session.session_plan?.name || 'Untitled Session',
        date: dateStr,
        status,
        exercises,
      }
    })

    return {
      isSuccess: true,
      message: "Week sessions retrieved successfully",
      data: weekSessions
    }
  } catch (error) {
    console.error("Error in getWeekSessionsAction:", error)
    return {
      isSuccess: false,
      message: "Failed to load week sessions"
    }
  }
}