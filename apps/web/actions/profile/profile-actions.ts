/*
<ai_context>
Server actions for viewing athlete and coach profiles.
Includes permission checks to ensure users can only view profiles they have access to:
- Athletes can view: their own profile, their coach's profile, other athletes in the same group
- Coaches can view: their own profile, all athletes assigned to them
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// ============================================================================
// Types
// ============================================================================

type User = Database['public']['Tables']['users']['Row']
type Athlete = Database['public']['Tables']['athletes']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']
type AthleteGroup = Database['public']['Tables']['athlete_groups']['Row']

// Profile data structure for the HolographicProfileCard
export interface ProfileViewData {
  id: number
  firstName: string
  lastName: string
  username: string | null
  avatarUrl: string | null
  email: string
  role: 'athlete' | 'coach' | 'individual'

  // Common fields
  birthdate: string | null
  sex: string | null
  timezone: string
  joinDate: string

  // Athlete-specific
  height: number | null
  weight: number | null
  experience: string | null
  events: string[] | null
  trainingGoals: string | null
  groupId: number | null
  groupName: string | null

  // Coach-specific
  speciality: string | null
  sportFocus: string | null
  philosophy: string | null
  coachExperience: string | null

  // Stats (to be populated separately)
  stats: {
    totalWorkouts?: number
    weeklyStreak?: number
    personalRecords?: number
    completionRate?: number
    athletesCoached?: number
    yearsExperience?: number
    programsCreated?: number
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform database user/athlete/coach data to ProfileViewData
 */
function transformToProfileViewData(
  user: User,
  athlete: (Athlete & { athlete_group?: AthleteGroup | null }) | null,
  coach: Coach | null
): ProfileViewData {
  return {
    id: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username,
    avatarUrl: user.avatar_url,
    email: user.email,
    role: user.role as 'athlete' | 'coach' | 'individual',
    birthdate: user.birthdate,
    sex: user.sex,
    timezone: user.timezone,
    joinDate: user.created_at,

    // Athlete fields
    height: athlete?.height || null,
    weight: athlete?.weight || null,
    experience: athlete?.experience || null,
    events: athlete?.events ? (athlete.events as string[]) : null,
    trainingGoals: athlete?.training_goals || null,
    groupId: athlete?.athlete_group_id || null,
    groupName: athlete?.athlete_group?.group_name || null,

    // Coach fields
    speciality: coach?.speciality || null,
    sportFocus: coach?.sport_focus || null,
    philosophy: coach?.philosophy || null,
    coachExperience: coach?.experience || null,

    // Stats placeholder - populated separately
    stats: {}
  }
}

// ============================================================================
// Permission Check Actions
// ============================================================================

/**
 * Check if the current user can view a specific profile
 * Returns the relationship type if allowed, or null if not
 */
async function checkProfileViewPermission(
  currentDbUserId: number,
  targetUserId: number
): Promise<{ allowed: boolean; relationship: 'self' | 'coach' | 'teammate' | 'athlete' | null }> {
  // Same user - always allowed
  if (currentDbUserId === targetUserId) {
    return { allowed: true, relationship: 'self' }
  }

  // Get current user's role and profile
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select(`
      id, role,
      athlete:athletes(id, athlete_group_id),
      coach:coaches(id)
    `)
    .eq('id', currentDbUserId)
    .single()

  if (currentUserError || !currentUser) {
    console.error('[checkProfileViewPermission] Error fetching current user:', currentUserError)
    return { allowed: false, relationship: null }
  }

  // Get target user's profile
  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select(`
      id, role,
      athlete:athletes(id, athlete_group_id),
      coach:coaches(id)
    `)
    .eq('id', targetUserId)
    .single()

  if (targetUserError || !targetUser) {
    console.error('[checkProfileViewPermission] Error fetching target user:', targetUserError)
    return { allowed: false, relationship: null }
  }

  const currentAthletes = Array.isArray(currentUser.athlete) ? currentUser.athlete : currentUser.athlete ? [currentUser.athlete] : []
  const currentCoaches = Array.isArray(currentUser.coach) ? currentUser.coach : currentUser.coach ? [currentUser.coach] : []
  const targetAthletes = Array.isArray(targetUser.athlete) ? targetUser.athlete : targetUser.athlete ? [targetUser.athlete] : []
  const targetCoaches = Array.isArray(targetUser.coach) ? targetUser.coach : targetUser.coach ? [targetUser.coach] : []

  // Current user is a coach - can view any athlete assigned to them
  if (currentCoaches.length > 0 && targetAthletes.length > 0) {
    const coachId = currentCoaches[0]?.id
    const targetAthleteGroupId = targetAthletes[0]?.athlete_group_id

    if (coachId && targetAthleteGroupId) {
      // Check if the target athlete's group belongs to this coach
      const { data: group } = await supabase
        .from('athlete_groups')
        .select('id')
        .eq('id', targetAthleteGroupId)
        .eq('coach_id', coachId)
        .single()

      if (group) {
        return { allowed: true, relationship: 'athlete' }
      }
    }
  }

  // Current user is an athlete - can view their coach
  if (currentAthletes.length > 0 && targetCoaches.length > 0) {
    const currentAthleteGroupId = currentAthletes[0]?.athlete_group_id
    const targetCoachId = targetCoaches[0]?.id

    if (currentAthleteGroupId && targetCoachId) {
      // Check if the current athlete's group is managed by the target coach
      const { data: group } = await supabase
        .from('athlete_groups')
        .select('id')
        .eq('id', currentAthleteGroupId)
        .eq('coach_id', targetCoachId)
        .single()

      if (group) {
        return { allowed: true, relationship: 'coach' }
      }
    }
  }

  // Current user is an athlete - can view teammates in the same group
  if (currentAthletes.length > 0 && targetAthletes.length > 0) {
    const currentGroupId = currentAthletes[0]?.athlete_group_id
    const targetGroupId = targetAthletes[0]?.athlete_group_id

    if (currentGroupId && targetGroupId && currentGroupId === targetGroupId) {
      return { allowed: true, relationship: 'teammate' }
    }
  }

  // No permission
  return { allowed: false, relationship: null }
}

// ============================================================================
// Profile View Actions
// ============================================================================

/**
 * Get a user's profile by their database user ID
 * Includes permission checking
 */
export async function getProfileByUserIdAction(
  targetUserId: number
): Promise<ActionState<ProfileViewData>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const currentDbUserId = await getDbUserId(userId)

    // Check permission
    const permission = await checkProfileViewPermission(currentDbUserId, targetUserId)

    if (!permission.allowed) {
      return {
        isSuccess: false,
        message: "You don't have permission to view this profile"
      }
    }

    // Fetch the profile data
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        athlete:athletes(
          *,
          athlete_group:athlete_groups(*)
        ),
        coach:coaches(*)
      `)
      .eq('id', targetUserId)
      .single()

    if (error) {
      console.error('[getProfileByUserIdAction] Error:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch profile"
      }
    }

    const athlete = Array.isArray(user.athlete) ? user.athlete[0] || null : user.athlete
    const coach = Array.isArray(user.coach) ? user.coach[0] || null : user.coach

    const profileData = transformToProfileViewData(user, athlete, coach)

    // Add stats based on role
    if (user.role === 'athlete' && athlete) {
      profileData.stats = await getAthleteStats(athlete.id)
    } else if (user.role === 'coach' && coach) {
      profileData.stats = await getCoachStats(coach.id)
    }

    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profileData
    }
  } catch (error) {
    console.error('[getProfileByUserIdAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get an athlete's profile by their athlete ID
 */
export async function getAthleteProfileAction(
  athleteId: number
): Promise<ActionState<ProfileViewData>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    // First get the user_id for this athlete
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('user_id')
      .eq('id', athleteId)
      .single()

    if (athleteError || !athlete) {
      return {
        isSuccess: false,
        message: "Athlete not found"
      }
    }

    // Use the existing function with permission check
    return getProfileByUserIdAction(athlete.user_id)
  } catch (error) {
    console.error('[getAthleteProfileAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get profiles of all athletes in the current user's group
 */
export async function getTeammateProfilesAction(): Promise<ActionState<ProfileViewData[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get current user's athlete profile and group
    const { data: currentAthlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !currentAthlete?.athlete_group_id) {
      return {
        isSuccess: true,
        message: "No group assigned",
        data: []
      }
    }

    // Get all athletes in the same group with their user data
    const { data: teammates, error: teammatesError } = await supabase
      .from('athletes')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        user:users(*)
      `)
      .eq('athlete_group_id', currentAthlete.athlete_group_id)
      .neq('user_id', dbUserId) // Exclude self

    if (teammatesError) {
      console.error('[getTeammateProfilesAction] Error:', teammatesError)
      return {
        isSuccess: false,
        message: "Failed to fetch teammates"
      }
    }

    const profiles: ProfileViewData[] = []

    for (const teammate of teammates || []) {
      const user = Array.isArray(teammate.user) ? teammate.user[0] : teammate.user
      if (user) {
        const profile = transformToProfileViewData(user, teammate, null)
        profile.stats = await getAthleteStats(teammate.id)
        profiles.push(profile)
      }
    }

    return {
      isSuccess: true,
      message: `Found ${profiles.length} teammates`,
      data: profiles
    }
  } catch (error) {
    console.error('[getTeammateProfilesAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the coach profile for the current athlete's group
 */
export async function getMyCoachProfileAction(): Promise<ActionState<ProfileViewData | null>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get current athlete's group
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select(`
        athlete_group:athlete_groups(
          *,
          coach:coaches(
            *,
            user:users(*)
          )
        )
      `)
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete?.athlete_group) {
      return {
        isSuccess: true,
        message: "No coach assigned",
        data: null
      }
    }

    const group = Array.isArray(athlete.athlete_group) ? athlete.athlete_group[0] : athlete.athlete_group
    const coach = Array.isArray(group?.coach) ? group.coach[0] : group?.coach
    const coachUser = Array.isArray(coach?.user) ? coach.user[0] : coach?.user

    if (!coachUser || !coach) {
      return {
        isSuccess: true,
        message: "No coach assigned",
        data: null
      }
    }

    const profile = transformToProfileViewData(coachUser, null, coach)
    profile.stats = await getCoachStats(coach.id)

    return {
      isSuccess: true,
      message: "Coach profile retrieved",
      data: profile
    }
  } catch (error) {
    console.error('[getMyCoachProfileAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// Stats Helper Functions
// ============================================================================

/**
 * Get stats for an athlete
 */
async function getAthleteStats(athleteId: number): Promise<ProfileViewData['stats']> {
  try {
    // Count workout logs
    const { count: workoutCount } = await supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)

    // Count personal records
    const { count: prCount } = await supabase
      .from('athlete_personal_bests')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)

    // Calculate completion rate from workout_logs session_status
    const { count: completedCount } = await supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('session_status', 'completed')

    const { count: totalRelevant } = await supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .in('session_status', ['completed', 'assigned', 'ongoing'])

    const completed = completedCount || 0
    const total = totalRelevant || 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      totalWorkouts: workoutCount || 0,
      personalRecords: prCount || 0,
      completionRate
    }
  } catch (error) {
    console.error('[getAthleteStats] Error:', error)
    return {}
  }
}

/**
 * Get stats for a coach
 */
async function getCoachStats(coachId: number): Promise<ProfileViewData['stats']> {
  try {
    // Count athletes in coach's groups
    const { data: groups } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('coach_id', coachId)

    const groupIds = groups?.map(g => g.id) || []

    let athleteCount = 0
    if (groupIds.length > 0) {
      const { count } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: true })
        .in('athlete_group_id', groupIds)

      athleteCount = count || 0
    }

    // Count programs (macrocycles created by this coach)
    const { data: coach } = await supabase
      .from('coaches')
      .select('user_id, created_at')
      .eq('id', coachId)
      .single()

    let programCount = 0
    if (coach?.user_id) {
      const { count } = await supabase
        .from('macrocycles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', coach.user_id)

      programCount = count || 0
    }

    // Calculate years of experience from coach created_at (full 12-month years)
    let yearsExperience: number | undefined
    if (coach?.created_at) {
      const now = new Date()
      const created = new Date(coach.created_at)
      const diffMs = now.getTime() - created.getTime()
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
      if (years >= 1) {
        yearsExperience = years
      }
    }

    return {
      athletesCoached: athleteCount,
      programsCreated: programCount,
      ...(yearsExperience !== undefined && { yearsExperience })
    }
  } catch (error) {
    console.error('[getCoachStats] Error:', error)
    return {}
  }
}
