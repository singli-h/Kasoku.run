"use server"

import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import supabase from "@/lib/supabase-server"
import { ActionState } from "@/types"

/**
 * Sprint Analytics Data Types
 */
export interface SprintAnalyticsData {
  sessions: SprintSessionRecord[]
  quickStats: SprintQuickStats
  phaseAnalysis: PhaseAnalysis[]
  athleteMetrics: AthleteSprintMetrics
  // Competition PBs for overlay (wind-legal only)
  competitionPBs: CompetitionPB[]
}

export interface SprintSessionRecord {
  id: string
  date: string
  distance: number
  totalTime: number
  reactionTime?: number
  topSpeed?: number
  frequency?: number
  strideLength?: number
  isPB?: boolean
  delta?: number
  splits?: Array<{ distance: number; time: number; cumulativeTime: number }>
}

export interface SprintQuickStats {
  bestTime40m: number | null
  bestTimeChange: number | null
  topSpeed: number | null
  topSpeedChange: number | null
  avgReactionTime: number | null
  reactionTimeChange: number | null
  sessionsThisMonth: number
}

export interface PhaseAnalysis {
  phaseId: string  // 'acceleration' | 'transition' | 'maintenance'
  time: number     // Phase time in seconds
  speed?: number   // Average speed in this phase
  strideLength?: number
  strideFrequency?: number
}

export interface AthleteSprintMetrics {
  reactionTime?: number
  topSpeed?: number
  // Phase-specific stride metrics (from max velocity phase 30-60m)
  strideLengthMaxV?: number
  strideFrequencyMaxV?: number
  // Legacy fields (deprecated, use phase-specific instead)
  strideLength?: number
  strideFrequency?: number
  // Dynamic best time support
  bestTime?: number
  bestDistance?: number
  time40m?: number
  time100m?: number
}

/**
 * Competition PB data for overlay on charts
 */
export interface CompetitionPB {
  eventId: number
  eventName: string
  distance: number         // in meters (60, 100, 200, etc.)
  value: number            // time in seconds
  date: string             // ISO date
  isWindLegal: boolean
  isIndoor: boolean
  wind?: number            // wind reading if outdoor
}

// Sprint event ID to distance mapping
const SPRINT_EVENT_DISTANCES: Record<number, number> = {
  24: 60,   // 60m
  1: 100,   // 100m
  27: 150,  // 150m
  2: 200,   // 200m
  28: 300,  // 300m
  3: 400,   // 400m
}

// Reverse mapping: distance to event ID
const DISTANCE_TO_EVENT_ID: Record<number, number> = {
  60: 24,
  100: 1,
  150: 27,
  200: 2,
  300: 28,
  400: 3,
}

/**
 * Gym Analytics Data Types
 */
export interface GymAnalyticsData {
  quickStats: GymQuickStats
  exerciseProgress: ExerciseProgressData[]
  workoutHistory: WorkoutHistoryRecord[]
  liftStats: LiftStatsRecord[]
  bodyweight: number
}

export interface GymQuickStats {
  weeklyVolume: number
  volumeChange: number
  avgIntensity: number
  intensityChange: number
  prsThisMonth: number
  sessionsThisWeek: number
}

export interface ExerciseProgressData {
  exercise: string
  currentOneRM: number
  previousOneRM?: number
  data: Array<{ date: string; value: number }>
  color: string
}

export interface WorkoutHistoryRecord {
  date: string
  intensity: number
  duration?: number
  exercises?: number
}

export interface LiftStatsRecord {
  exercise: string
  oneRM: number
  previousOneRM?: number
}

// Type definitions for database query results
// Supports both legacy field names and current Freelap data format
interface FreeelapMetadata {
  source?: string           // May or may not be present
  // Primary time field names
  time?: number             // Total time (seconds)
  total_time?: number       // Alternative name for total time
  // Speed fields
  speed?: number            // Top speed (m/s)
  top_speed?: number        // Alternative name for top speed
  // Stride metrics
  frequency?: number        // Stride frequency (Hz)
  stride_length?: number    // Stride length (m)
  steps?: number            // Total steps
  // Reaction time
  reaction_time?: number    // Block start reaction (seconds)
  // Distance
  distance?: number         // Sprint distance (meters)
  // Split data
  splits?: Array<{
    distance: number
    time: number          // Split time for this segment
    speed?: number
    cumulativeTime?: number  // Total time to this point
    cumulative_time?: number // Alternative field name
    stride_length?: number
    stride_frequency?: number
    frequency?: number    // Alternative field name for stride frequency
    steps?: number
  }>
}

/**
 * Helper: Detect if metadata contains sprint timing data
 * Sprint data is identified by presence of time/speed/splits fields
 */
function isSprintMetadata(metadata: unknown): metadata is FreeelapMetadata {
  if (!metadata || typeof metadata !== "object") return false
  const m = metadata as Record<string, unknown>
  // Sprint data has time OR speed OR splits
  return (
    typeof m.time === "number" ||
    typeof m.total_time === "number" ||
    (typeof m.speed === "number" && Array.isArray(m.splits)) ||
    Array.isArray(m.splits)
  )
}

/**
 * Helper: Calculate phase times from splits data
 * IMPORTANT: Splits contain SEGMENT distances (e.g., 20, 20), not cumulative (20, 40)
 *
 * Research-backed phase boundaries (PMC8847979):
 * - 100m sprint: Acceleration (0-40m), Max Velocity (40-80m), Deceleration (80-100m)
 * - Short sprint (≤40m): Initial Accel (0-20m), Main Accel (20-40m)
 *
 * Returns phase analysis only for phases with available data
 */
function calculatePhaseAnalysis(splits: FreeelapMetadata['splits']): PhaseAnalysis[] {
  if (!splits || splits.length === 0) return []

  const phases: PhaseAnalysis[] = []

  // Build cumulative data from segment splits
  interface CumulativeSplit {
    segmentDistance: number
    segmentTime: number
    cumulativeDistance: number
    cumulativeTime: number
    speed?: number
    strideLength?: number
    strideFrequency?: number
  }

  const cumulativeSplits: CumulativeSplit[] = []
  let runningDistance = 0
  let runningTime = 0

  for (const split of splits) {
    runningDistance += split.distance
    runningTime += split.time
    cumulativeSplits.push({
      segmentDistance: split.distance,
      segmentTime: split.time,
      cumulativeDistance: runningDistance,
      cumulativeTime: runningTime,
      speed: split.speed,
      strideLength: split.stride_length,
      strideFrequency: split.stride_frequency ?? split.frequency,
    })
  }

  // Find cumulative time at or near a target distance
  const getTimeAtDistance = (targetDistance: number): number | undefined => {
    const exactMatch = cumulativeSplits.find(s => s.cumulativeDistance === targetDistance)
    if (exactMatch) return exactMatch.cumulativeTime

    const passingMatch = cumulativeSplits.find(s => s.cumulativeDistance >= targetDistance)
    if (passingMatch) {
      const prevSplits = cumulativeSplits.filter(s => s.cumulativeDistance < targetDistance)
      const prevSplit = prevSplits[prevSplits.length - 1]
      if (prevSplit) {
        const ratio = (targetDistance - prevSplit.cumulativeDistance) /
          (passingMatch.cumulativeDistance - prevSplit.cumulativeDistance)
        return prevSplit.cumulativeTime + ratio * (passingMatch.cumulativeTime - prevSplit.cumulativeTime)
      }
      const ratio = targetDistance / passingMatch.cumulativeDistance
      return passingMatch.cumulativeTime * ratio
    }
    return undefined
  }

  // Get stride data from split closest to target distance
  const getStrideDataNear = (targetDistance: number) => {
    let closest = cumulativeSplits[0]
    let minDiff = Math.abs(closest.cumulativeDistance - targetDistance)
    for (const split of cumulativeSplits) {
      const diff = Math.abs(split.cumulativeDistance - targetDistance)
      if (diff < minDiff) {
        minDiff = diff
        closest = split
      }
    }
    return closest
  }

  const totalDistance = runningDistance

  // For short sprints (≤40m), use sub-phases: 0-20m and 20-40m
  if (totalDistance <= 40) {
    // Initial Acceleration (0-20m)
    if (totalDistance >= 15) {  // Need at least 15m for meaningful phase
      const phaseEnd = Math.min(20, totalDistance)
      const time = getTimeAtDistance(phaseEnd)
      if (time !== undefined && time > 0) {
        const strideData = getStrideDataNear(phaseEnd / 2)
        phases.push({
          phaseId: 'initialAccel',
          time,
          speed: strideData?.speed,
          strideLength: strideData?.strideLength,
          strideFrequency: strideData?.strideFrequency,
        })
      }
    }

    // Main Acceleration (20-40m)
    if (totalDistance > 20) {
      const phaseStart = 20
      const phaseEnd = Math.min(40, totalDistance)
      const timeStart = getTimeAtDistance(phaseStart)
      const timeEnd = getTimeAtDistance(phaseEnd)
      if (timeStart !== undefined && timeEnd !== undefined && timeEnd > timeStart) {
        const phaseTime = timeEnd - timeStart
        const strideData = getStrideDataNear((phaseStart + phaseEnd) / 2)
        phases.push({
          phaseId: 'mainAccel',
          time: phaseTime,
          speed: strideData?.speed,
          strideLength: strideData?.strideLength,
          strideFrequency: strideData?.strideFrequency,
        })
      }
    }
  } else {
    // For longer sprints (>40m), use research-backed phases: 0-40m, 40-80m, 80-100m

    // Acceleration phase (0-40m)
    const accelTime = getTimeAtDistance(40)
    if (accelTime !== undefined && accelTime > 0) {
      const strideData = getStrideDataNear(20) // Middle of phase
      phases.push({
        phaseId: 'acceleration',
        time: accelTime,
        speed: strideData?.speed,
        strideLength: strideData?.strideLength,
        strideFrequency: strideData?.strideFrequency,
      })
    }

    // Max Velocity phase (40-80m)
    if (totalDistance > 40) {
      const phaseStart = 40
      const phaseEnd = Math.min(80, totalDistance)
      const timeStart = getTimeAtDistance(phaseStart)
      const timeEnd = getTimeAtDistance(phaseEnd)
      if (timeStart !== undefined && timeEnd !== undefined && timeEnd > timeStart) {
        const phaseTime = timeEnd - timeStart
        const strideData = getStrideDataNear((phaseStart + phaseEnd) / 2)
        phases.push({
          phaseId: 'maxVelocity',
          time: phaseTime,
          speed: strideData?.speed,
          strideLength: strideData?.strideLength,
          strideFrequency: strideData?.strideFrequency,
        })
      }
    }

    // Deceleration phase (80-100m)
    if (totalDistance > 80) {
      const phaseStart = 80
      const phaseEnd = Math.min(100, totalDistance)
      const timeStart = getTimeAtDistance(phaseStart)
      const timeEnd = getTimeAtDistance(phaseEnd)
      if (timeStart !== undefined && timeEnd !== undefined && timeEnd > timeStart) {
        const phaseTime = timeEnd - timeStart
        const strideData = getStrideDataNear((phaseStart + phaseEnd) / 2)
        phases.push({
          phaseId: 'deceleration',
          time: phaseTime,
          speed: strideData?.speed,
          strideLength: strideData?.strideLength,
          strideFrequency: strideData?.strideFrequency,
        })
      }
    }
  }

  return phases
}

/**
 * Helper: Extract max velocity phase stride metrics from splits
 * Max velocity phase is typically 30-60m (or 50-60m for elite)
 * IMPORTANT: Splits contain SEGMENT distances, we need to calculate cumulative
 */
function extractMaxVelocityMetrics(splits: FreeelapMetadata['splits']): {
  strideLengthMaxV?: number
  strideFrequencyMaxV?: number
} {
  if (!splits || splits.length === 0) return {}

  // Calculate cumulative distances
  let cumulativeDistance = 0
  const splitsWithCumulative = splits.map(s => {
    cumulativeDistance += s.distance
    return {
      ...s,
      cumulativeDistance,
    }
  })

  // Find splits in the 30-60m range (by cumulative distance)
  // This is where max velocity typically occurs
  const maxVSplits = splitsWithCumulative.filter(s =>
    s.cumulativeDistance > 20 && s.cumulativeDistance <= 60
  )

  if (maxVSplits.length === 0) {
    // Fall back to last split if no splits in max velocity range
    const lastSplit = splitsWithCumulative[splitsWithCumulative.length - 1]
    return {
      strideLengthMaxV: lastSplit?.stride_length,
      strideFrequencyMaxV: lastSplit?.stride_frequency ?? lastSplit?.frequency,
    }
  }

  // Prefer the split closest to 40-50m as it's typically peak velocity
  const preferredSplit = maxVSplits.find(s => s.cumulativeDistance >= 40) ||
                         maxVSplits[maxVSplits.length - 1]

  return {
    strideLengthMaxV: preferredSplit?.stride_length,
    strideFrequencyMaxV: preferredSplit?.stride_frequency ?? preferredSplit?.frequency,
  }
}

interface WorkoutLogSetWithRelations {
  id: string
  created_at: string | null
  distance: number | null
  performing_time: number | null
  metadata: FreeelapMetadata | null
  workout_log_exercise: {
    id: string
    workout_log: {
      id: string
      athlete_id: number | null
      date_time: string | null
    } | null
  } | null
}

interface WorkoutLogWithExercises {
  id: string
  date_time: string | null
  notes: string | null
  workout_log_exercises: Array<{
    id: string
    exercise_id: number
    exercise: { id: number; name: string } | null
    workout_log_sets: Array<{
      id: string
      weight: number | null
      reps: number | null
      rpe: number | null
      completed: boolean | null
    }>
  }>
}

/**
 * Get sprint analytics data for the current user
 * Fetches from workout_log_sets with Freelap metadata
 */
export async function getSprintAnalyticsAction(
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<ActionState<SprintAnalyticsData>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(userId)

    // First get the athlete_id for this user
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete) {
      // User is not an athlete - return empty data
      return {
        isSuccess: true,
        message: "No athlete profile found",
        data: {
          sessions: [],
          quickStats: {
            bestTime40m: null,
            bestTimeChange: null,
            topSpeed: null,
            topSpeedChange: null,
            avgReactionTime: null,
            reactionTimeChange: null,
            sessionsThisMonth: 0,
          },
          phaseAnalysis: [],
          athleteMetrics: {},
          competitionPBs: [],
        }
      }
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = null
        break
    }

    // Query workout_log_sets with sprint metadata
    let query = supabase
      .from('workout_log_sets')
      .select(`
        id,
        created_at,
        distance,
        performing_time,
        metadata,
        workout_log_exercise:workout_log_exercises!inner(
          id,
          workout_log:workout_logs!inner(
            id,
            athlete_id,
            date_time
          )
        )
      `)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    const { data: sets, error } = await query

    if (error) {
      console.error('[getSprintAnalyticsAction] Query error:', error)
      return { isSuccess: false, message: error.message }
    }

    // Filter sets that have sprint data and belong to user's athlete
    // Detects sprint data by presence of time/speed/splits (not requiring source='freelap')
    const sprintSets = ((sets || []) as WorkoutLogSetWithRelations[]).filter(set => {
      const metadata = set.metadata
      const workoutLog = set.workout_log_exercise?.workout_log
      return (
        isSprintMetadata(metadata) &&
        workoutLog?.athlete_id === athlete.id
      )
    })

    console.log(`[getSprintAnalyticsAction] Found ${sprintSets.length} sprint sets for athlete ${athlete.id}`)

    // Query personal bests for sprint events
    const { data: personalBests } = await supabase
      .from('athlete_personal_bests')
      .select('id, value, achieved_date, metadata, session_id, exercise_id')
      .eq('athlete_id', athlete.id)
      .order('achieved_date', { ascending: false })

    // Create a map of session_id to PB status
    const pbSessionIds = new Set(
      (personalBests || [])
        .filter(pb => pb.session_id)
        .map(pb => String(pb.session_id))
    )

    // Query competition PBs (race results) for sprint events
    // Filter for wind-legal results only (indoor or wind <= 2.0 m/s)
    const sprintEventIds = Object.keys(SPRINT_EVENT_DISTANCES).map(Number)
    const { data: raceResults } = await supabase
      .from('athlete_personal_bests')
      .select(`
        id,
        value,
        achieved_date,
        metadata,
        event_id,
        event:events(id, name, type)
      `)
      .eq('athlete_id', athlete.id)
      .in('event_id', sprintEventIds)
      .order('achieved_date', { ascending: false })

    // Process race results into competition PBs (wind-legal only)
    interface RaceMetadata {
      indoor?: boolean
      wind?: number
    }

    const competitionPBs: CompetitionPB[] = (raceResults || [])
      .filter(result => {
        if (!result.event_id || !result.value) return false
        const metadata = result.metadata as RaceMetadata | null
        // Indoor is always legal
        if (metadata?.indoor) return true
        // Outdoor: wind must be <= 2.0 m/s (or not recorded)
        const wind = metadata?.wind
        return wind === undefined || wind === null || wind <= 2.0
      })
      .map(result => {
        const metadata = result.metadata as RaceMetadata | null
        const event = result.event as { id: number; name: string; type: string } | null
        return {
          eventId: result.event_id!,
          eventName: event?.name || `Event ${result.event_id}`,
          distance: SPRINT_EVENT_DISTANCES[result.event_id!] || 0,
          value: result.value!,
          date: result.achieved_date || '',
          isWindLegal: true, // Already filtered above
          isIndoor: metadata?.indoor ?? false,
          wind: metadata?.wind,
        }
      })
      .filter(pb => pb.distance > 0) // Only include known sprint distances

    console.log(`[getSprintAnalyticsAction] Found ${competitionPBs.length} wind-legal competition PBs`)

    // Process sets into sessions and sort by time (best first)
    const sessions: SprintSessionRecord[] = sprintSets
      .map((set) => {
        const metadata = set.metadata as FreeelapMetadata
        const workoutLog = set.workout_log_exercise?.workout_log
        const workoutLogId = workoutLog?.id

        // Handle both field name variants (time/total_time, speed/top_speed)
        const totalTime = metadata.time ?? metadata.total_time ?? 0

        // Top speed should be MAX from splits (if available), not the average from main metadata
        // Main speed field is typically average speed, splits contain segment speeds
        const maxSpeedFromSplits = metadata.splits?.length
          ? Math.max(...metadata.splits.filter(s => s.speed !== undefined).map(s => s.speed!))
          : undefined
        const topSpeed = maxSpeedFromSplits ?? metadata.speed ?? metadata.top_speed

        // For splits, calculate cumulative time AND distance
        // Splits contain segment distances (20, 20) not cumulative (20, 40)
        // The chart expects cumulative distances to plot correctly
        let cumulativeTime = 0
        let cumulativeDistance = 0
        const processedSplits = metadata.splits?.map(s => {
          // If cumulative time is provided, use it; otherwise accumulate
          const splitCumulative = s.cumulativeTime ?? s.cumulative_time
          if (splitCumulative !== undefined) {
            cumulativeTime = splitCumulative
          } else {
            cumulativeTime += s.time
          }
          // Always accumulate distance (splits have segment distances)
          cumulativeDistance += s.distance
          return {
            distance: cumulativeDistance,  // Use cumulative distance for chart
            time: s.time,
            cumulativeTime: cumulativeTime,
          }
        })

        // Get distance from set column, metadata, or sum of splits (splits have segment distances)
        const distance = (set as WorkoutLogSetWithRelations).distance
          ?? metadata.distance
          ?? (metadata.splits?.length
            ? metadata.splits.reduce((sum, s) => sum + s.distance, 0)
            : 40)

        return {
          id: String(set.id),
          date: workoutLog?.date_time || set.created_at || new Date().toISOString(),
          distance,
          totalTime,
          reactionTime: metadata.reaction_time,
          topSpeed,
          frequency: metadata.frequency,
          strideLength: metadata.stride_length,
          // Mark as PB if the workout_log matches a PB record
          isPB: workoutLogId ? pbSessionIds.has(String(workoutLogId)) : false,
          splits: processedSplits,
        }
      })
      .filter(s => s.totalTime > 0)
      .sort((a, b) => a.totalTime - b.totalTime) // Sort by best time

    // If no session is marked as PB from database, mark the best one
    if (sessions.length > 0 && !sessions.some(s => s.isPB)) {
      sessions[0].isPB = true
    }

    // Calculate time ranges for comparison
    const periodDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const currentPeriodStart = startDate || new Date(0)
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Split sessions into current and previous periods
    const currentPeriodSessions = sessions.filter(s => new Date(s.date) >= currentPeriodStart)
    const previousPeriodSessions = sessions.filter(s => {
      const d = new Date(s.date)
      return d >= previousPeriodStart && d < currentPeriodStart
    })

    // Calculate best times for each period
    const currentBestTime = currentPeriodSessions.length > 0
      ? Math.min(...currentPeriodSessions.map(s => s.totalTime))
      : null
    const previousBestTime = previousPeriodSessions.length > 0
      ? Math.min(...previousPeriodSessions.map(s => s.totalTime))
      : null

    // Calculate top speeds
    const currentTopSpeed = currentPeriodSessions.length > 0
      ? Math.max(...currentPeriodSessions.filter(s => s.topSpeed).map(s => s.topSpeed!))
      : null
    const previousTopSpeed = previousPeriodSessions.length > 0
      ? Math.max(...previousPeriodSessions.filter(s => s.topSpeed).map(s => s.topSpeed!))
      : null

    // Calculate reaction times
    const currentReactionSessions = currentPeriodSessions.filter(s => s.reactionTime !== undefined)
    const previousReactionSessions = previousPeriodSessions.filter(s => s.reactionTime !== undefined)
    const currentAvgReaction = currentReactionSessions.length > 0
      ? currentReactionSessions.reduce((sum, s) => sum + (s.reactionTime || 0), 0) / currentReactionSessions.length
      : null
    const previousAvgReaction = previousReactionSessions.length > 0
      ? previousReactionSessions.reduce((sum, s) => sum + (s.reactionTime || 0), 0) / previousReactionSessions.length
      : null

    // Build quick stats with proper change calculations
    const bestSession = sessions[0]
    const quickStats: SprintQuickStats = {
      bestTime40m: currentBestTime,
      bestTimeChange: currentBestTime !== null && previousBestTime !== null
        ? currentBestTime - previousBestTime  // Negative = improvement
        : null,
      topSpeed: currentTopSpeed || (bestSession?.topSpeed ?? null),
      topSpeedChange: currentTopSpeed !== null && previousTopSpeed !== null && previousTopSpeed > 0
        ? ((currentTopSpeed - previousTopSpeed) / previousTopSpeed) * 100
        : null,
      avgReactionTime: currentAvgReaction,
      reactionTimeChange: currentAvgReaction !== null && previousAvgReaction !== null
        ? currentAvgReaction - previousAvgReaction  // Negative = improvement
        : null,
      sessionsThisMonth: sessions.filter(s => {
        const sessionDate = new Date(s.date)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return sessionDate >= monthAgo
      }).length,
    }

    // Calculate phase analysis from best session's splits (show available phases only)
    const bestSessionMetadata = sprintSets.find(s => String(s.id) === bestSession?.id)?.metadata as FreeelapMetadata | undefined
    const phaseAnalysis = calculatePhaseAnalysis(bestSessionMetadata?.splits)

    // Extract max velocity phase stride metrics
    const maxVMetrics = extractMaxVelocityMetrics(bestSessionMetadata?.splits)

    // Build athlete metrics with phase-specific data
    const athleteMetrics: AthleteSprintMetrics = bestSession ? {
      reactionTime: bestSession.reactionTime,
      topSpeed: bestSession.topSpeed,
      // Phase-specific stride metrics from max velocity phase
      strideLengthMaxV: maxVMetrics.strideLengthMaxV,
      strideFrequencyMaxV: maxVMetrics.strideFrequencyMaxV,
      // Legacy fields (fall back to overall values if phase-specific not available)
      strideLength: maxVMetrics.strideLengthMaxV ?? bestSession.strideLength,
      strideFrequency: maxVMetrics.strideFrequencyMaxV ?? bestSession.frequency,
      // Dynamic best time
      bestTime: bestSession.totalTime,
      bestDistance: bestSession.distance,
      time40m: bestSession.distance === 40 ? bestSession.totalTime : undefined,
      time100m: bestSession.distance === 100 ? bestSession.totalTime : undefined,
    } : {}

    return {
      isSuccess: true,
      message: "Sprint analytics retrieved",
      data: {
        sessions: currentPeriodSessions.length > 0 ? currentPeriodSessions : sessions,
        quickStats,
        phaseAnalysis,
        athleteMetrics,
        competitionPBs,
      }
    }
  } catch (error) {
    console.error('[getSprintAnalyticsAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch sprint analytics"
    }
  }
}

/**
 * Get gym analytics data for the current user
 * Fetches from workout_logs, workout_log_exercises, workout_log_sets
 */
export async function getGymAnalyticsAction(
  timeRange: '4weeks' | '3months' | '6months' | '1year' = '3months'
): Promise<ActionState<GymAnalyticsData>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(userId)

    // First get the athlete_id for this user
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, weight')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete) {
      // User is not an athlete - return empty data
      return {
        isSuccess: true,
        message: "No athlete profile found",
        data: {
          quickStats: {
            weeklyVolume: 0,
            volumeChange: 0,
            avgIntensity: 0,
            intensityChange: 0,
            prsThisMonth: 0,
            sessionsThisWeek: 0,
          },
          exerciseProgress: [],
          workoutHistory: [],
          liftStats: [],
          bodyweight: 80,
        }
      }
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case '4weeks':
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
        break
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6months':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
    }

    // Query workout logs with exercises and sets
    const { data: workoutLogs, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        date_time,
        notes,
        workout_log_exercises(
          id,
          exercise_id,
          exercise:exercises(id, name),
          workout_log_sets(
            id,
            weight,
            reps,
            rpe,
            completed
          )
        )
      `)
      .eq('athlete_id', athlete.id)
      .gte('date_time', startDate.toISOString())
      .order('date_time', { ascending: false })

    if (error) {
      console.error('[getGymAnalyticsAction] Query error:', error)
      return { isSuccess: false, message: error.message }
    }

    const logs = (workoutLogs || []) as WorkoutLogWithExercises[]

    // Calculate weekly volume (total sets this week vs last week)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeekLogs = logs.filter(log => log.date_time && new Date(log.date_time) >= weekAgo)
    const lastWeekLogs = logs.filter(log => {
      if (!log.date_time) return false
      const d = new Date(log.date_time)
      return d >= twoWeeksAgo && d < weekAgo
    })

    const countCompletedSets = (workoutLogs: WorkoutLogWithExercises[]) => {
      return workoutLogs.reduce((total: number, log) => {
        return total + (log.workout_log_exercises || []).reduce((exTotal: number, ex) => {
          return exTotal + (ex.workout_log_sets || []).filter((s) => s.completed).length
        }, 0)
      }, 0)
    }

    const weeklyVolume = countCompletedSets(thisWeekLogs)
    const lastWeekVolume = countCompletedSets(lastWeekLogs)

    // Calculate volume change percentage
    const volumeChange = lastWeekVolume > 0
      ? Math.round(((weeklyVolume - lastWeekVolume) / lastWeekVolume) * 100)
      : 0

    // Calculate average intensity (avg RPE) for current and previous period
    const calculateAvgRpe = (workoutLogs: WorkoutLogWithExercises[]) => {
      let totalRpe = 0
      let rpeCount = 0
      workoutLogs.forEach(log => {
        (log.workout_log_exercises || []).forEach(ex => {
          (ex.workout_log_sets || []).forEach((set) => {
            if (set.rpe) {
              totalRpe += set.rpe
              rpeCount++
            }
          })
        })
      })
      return rpeCount > 0 ? (totalRpe / rpeCount) * 10 : 0 // Convert to percentage
    }

    const avgIntensity = calculateAvgRpe(thisWeekLogs)
    const lastWeekAvgIntensity = calculateAvgRpe(lastWeekLogs)
    const intensityChange = lastWeekAvgIntensity > 0
      ? Math.round(avgIntensity - lastWeekAvgIntensity)
      : 0

    // Query PRs this month from athlete_personal_bests
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { count: prsThisMonth } = await supabase
      .from('athlete_personal_bests')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athlete.id)
      .gte('achieved_date', startOfMonth.toISOString().split('T')[0])

    // Build exercise progress data (1RM tracking)
    const exerciseData: Map<string, ExerciseProgressData> = new Map()
    const exerciseColors: Record<string, string> = {
      'Bench Press': '#3b82f6',
      'Squat': '#22c55e',
      'Deadlift': '#f97316',
      'Overhead Press': '#a855f7',
      'Barbell Row': '#eab308',
    }

    logs.forEach(log => {
      (log.workout_log_exercises || []).forEach(ex => {
        const exerciseName = ex.exercise?.name || 'Unknown'
        const sets = ex.workout_log_sets || []

        // Calculate estimated 1RM from best set (Brzycki formula)
        let best1RM = 0
        sets.forEach((set) => {
          if (set.weight && set.reps && set.reps > 0) {
            const estimated1RM = set.reps === 1
              ? set.weight
              : set.weight * (36 / (37 - set.reps))
            if (estimated1RM > best1RM) {
              best1RM = estimated1RM
            }
          }
        })

        if (best1RM > 0 && log.date_time) {
          if (!exerciseData.has(exerciseName)) {
            exerciseData.set(exerciseName, {
              exercise: exerciseName,
              currentOneRM: best1RM,
              data: [],
              color: exerciseColors[exerciseName] || '#6b7280',
            })
          }

          const data = exerciseData.get(exerciseName)!
          data.data.push({
            date: log.date_time,
            value: best1RM,
          })
          if (best1RM > data.currentOneRM) {
            data.previousOneRM = data.currentOneRM
            data.currentOneRM = best1RM
          }
        }
      })
    })

    // Build workout history for heatmap
    const workoutHistory: WorkoutHistoryRecord[] = logs
      .filter(log => log.date_time)
      .map(log => ({
        date: log.date_time as string,
        intensity: Math.min(4, Math.ceil(
          (log.workout_log_exercises || []).reduce((total: number, ex) =>
            total + (ex.workout_log_sets || []).filter((s) => s.completed).length, 0
          ) / 5
        )) as 0 | 1 | 2 | 3 | 4,
        exercises: (log.workout_log_exercises || []).length,
      }))

    // Build lift stats
    const liftStats: LiftStatsRecord[] = Array.from(exerciseData.values())
      .slice(0, 5)
      .map(ex => ({
        exercise: ex.exercise,
        oneRM: ex.currentOneRM,
        previousOneRM: ex.previousOneRM,
      }))

    // Get user's bodyweight from athlete profile
    const bodyweight = athlete.weight || 80

    const quickStats: GymQuickStats = {
      weeklyVolume,
      volumeChange,
      avgIntensity: Math.round(avgIntensity),
      intensityChange,
      prsThisMonth: prsThisMonth || 0,
      sessionsThisWeek: thisWeekLogs.length,
    }

    return {
      isSuccess: true,
      message: "Gym analytics retrieved",
      data: {
        quickStats,
        exerciseProgress: Array.from(exerciseData.values()),
        workoutHistory,
        liftStats,
        bodyweight,
      }
    }
  } catch (error) {
    console.error('[getGymAnalyticsAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch gym analytics"
    }
  }
}
