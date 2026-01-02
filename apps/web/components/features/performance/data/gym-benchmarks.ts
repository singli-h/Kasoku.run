/**
 * Gym Performance Benchmark Data
 * Reference standards for strength training analytics
 *
 * Sources:
 * - Strength Level (strength-level.com) research data
 * - NSCA guidelines
 * - Symmetric Strength standards
 */

export type StrengthLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

export interface StrengthLevelConfig {
  label: string
  color: string
  colorClass: string
  description: string
}

export const STRENGTH_LEVELS: Record<StrengthLevel, StrengthLevelConfig> = {
  beginner: {
    label: 'Beginner',
    color: '#f97316',
    colorClass: 'text-orange-500',
    description: 'New to lifting, building form and habits',
  },
  novice: {
    label: 'Novice',
    color: '#eab308',
    colorClass: 'text-yellow-500',
    description: '3-6 months consistent training',
  },
  intermediate: {
    label: 'Intermediate',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    description: '1-2 years structured training',
  },
  advanced: {
    label: 'Advanced',
    color: '#22c55e',
    colorClass: 'text-green-500',
    description: '3-5 years dedicated training',
  },
  elite: {
    label: 'Elite',
    color: '#a855f7',
    colorClass: 'text-purple-500',
    description: 'Competitive level strength',
  },
}

export interface StrengthStandard {
  exercise: string
  category: 'push' | 'pull' | 'legs' | 'core'
  unit: 'kg' | 'lbs' | 'bw' // bw = bodyweight multiplier
  male: Record<StrengthLevel, { min: number; max: number }>
  female: Record<StrengthLevel, { min: number; max: number }>
}

/**
 * Strength standards as bodyweight multipliers for major lifts
 * Values are 1RM relative to bodyweight
 */
export const STRENGTH_STANDARDS: StrengthStandard[] = [
  {
    exercise: 'Bench Press',
    category: 'push',
    unit: 'bw',
    male: {
      beginner: { min: 0.4, max: 0.6 },
      novice: { min: 0.6, max: 0.85 },
      intermediate: { min: 0.85, max: 1.15 },
      advanced: { min: 1.15, max: 1.45 },
      elite: { min: 1.45, max: 2.0 },
    },
    female: {
      beginner: { min: 0.25, max: 0.35 },
      novice: { min: 0.35, max: 0.5 },
      intermediate: { min: 0.5, max: 0.75 },
      advanced: { min: 0.75, max: 1.0 },
      elite: { min: 1.0, max: 1.5 },
    },
  },
  {
    exercise: 'Squat',
    category: 'legs',
    unit: 'bw',
    male: {
      beginner: { min: 0.5, max: 0.75 },
      novice: { min: 0.75, max: 1.0 },
      intermediate: { min: 1.0, max: 1.5 },
      advanced: { min: 1.5, max: 2.0 },
      elite: { min: 2.0, max: 2.75 },
    },
    female: {
      beginner: { min: 0.35, max: 0.5 },
      novice: { min: 0.5, max: 0.75 },
      intermediate: { min: 0.75, max: 1.15 },
      advanced: { min: 1.15, max: 1.5 },
      elite: { min: 1.5, max: 2.0 },
    },
  },
  {
    exercise: 'Deadlift',
    category: 'pull',
    unit: 'bw',
    male: {
      beginner: { min: 0.6, max: 1.0 },
      novice: { min: 1.0, max: 1.25 },
      intermediate: { min: 1.25, max: 1.75 },
      advanced: { min: 1.75, max: 2.25 },
      elite: { min: 2.25, max: 3.0 },
    },
    female: {
      beginner: { min: 0.5, max: 0.75 },
      novice: { min: 0.75, max: 1.0 },
      intermediate: { min: 1.0, max: 1.5 },
      advanced: { min: 1.5, max: 1.85 },
      elite: { min: 1.85, max: 2.5 },
    },
  },
  {
    exercise: 'Overhead Press',
    category: 'push',
    unit: 'bw',
    male: {
      beginner: { min: 0.25, max: 0.35 },
      novice: { min: 0.35, max: 0.55 },
      intermediate: { min: 0.55, max: 0.8 },
      advanced: { min: 0.8, max: 1.0 },
      elite: { min: 1.0, max: 1.35 },
    },
    female: {
      beginner: { min: 0.15, max: 0.25 },
      novice: { min: 0.25, max: 0.35 },
      intermediate: { min: 0.35, max: 0.5 },
      advanced: { min: 0.5, max: 0.7 },
      elite: { min: 0.7, max: 0.95 },
    },
  },
  {
    exercise: 'Barbell Row',
    category: 'pull',
    unit: 'bw',
    male: {
      beginner: { min: 0.35, max: 0.5 },
      novice: { min: 0.5, max: 0.75 },
      intermediate: { min: 0.75, max: 1.0 },
      advanced: { min: 1.0, max: 1.25 },
      elite: { min: 1.25, max: 1.6 },
    },
    female: {
      beginner: { min: 0.2, max: 0.35 },
      novice: { min: 0.35, max: 0.5 },
      intermediate: { min: 0.5, max: 0.7 },
      advanced: { min: 0.7, max: 0.9 },
      elite: { min: 0.9, max: 1.2 },
    },
  },
]

/**
 * Calculate strength level based on 1RM and bodyweight
 */
export function getStrengthLevel(
  oneRM: number,
  bodyweight: number,
  exercise: string,
  gender: 'male' | 'female'
): StrengthLevel {
  const standard = STRENGTH_STANDARDS.find(s => s.exercise === exercise)
  if (!standard) return 'beginner'

  const ratio = oneRM / bodyweight
  const genderStandards = standard[gender]

  if (ratio >= genderStandards.elite.min) return 'elite'
  if (ratio >= genderStandards.advanced.min) return 'advanced'
  if (ratio >= genderStandards.intermediate.min) return 'intermediate'
  if (ratio >= genderStandards.novice.min) return 'novice'
  return 'beginner'
}

/**
 * Calculate estimated 1RM using Brzycki formula
 */
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (36 / (37 - reps))
}

/**
 * Get the next standard target for an exercise
 */
export function getNextTarget(
  currentOneRM: number,
  bodyweight: number,
  exercise: string,
  gender: 'male' | 'female'
): { level: StrengthLevel; target: number } | null {
  const currentLevel = getStrengthLevel(currentOneRM, bodyweight, exercise, gender)
  const standard = STRENGTH_STANDARDS.find(s => s.exercise === exercise)
  if (!standard) return null

  const genderStandards = standard[gender]
  const levels: StrengthLevel[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']
  const currentIndex = levels.indexOf(currentLevel)

  if (currentIndex >= levels.length - 1) return null

  const nextLevel = levels[currentIndex + 1]
  const nextTarget = genderStandards[nextLevel].min * bodyweight

  return { level: nextLevel, target: Math.round(nextTarget * 10) / 10 }
}

/**
 * Format weight with unit
 */
export function formatWeight(value: number, unit: 'kg' | 'lbs' = 'kg'): string {
  return `${value.toFixed(1)} ${unit}`
}

/**
 * Volume metrics
 */
export interface VolumeMetric {
  label: string
  description: string
  optimalRange: { min: number; max: number }
  unit: string
}

export const VOLUME_METRICS: Record<string, VolumeMetric> = {
  weeklyVolume: {
    label: 'Weekly Volume',
    description: 'Total sets per week per muscle group',
    optimalRange: { min: 10, max: 20 },
    unit: 'sets',
  },
  sessionDuration: {
    label: 'Session Duration',
    description: 'Optimal workout length',
    optimalRange: { min: 45, max: 90 },
    unit: 'min',
  },
  weeklyFrequency: {
    label: 'Weekly Frequency',
    description: 'Training days per week',
    optimalRange: { min: 3, max: 6 },
    unit: 'days',
  },
  restDays: {
    label: 'Rest Days',
    description: 'Recovery days per week',
    optimalRange: { min: 1, max: 3 },
    unit: 'days',
  },
}

/**
 * Training intensity zones
 */
export interface IntensityZone {
  label: string
  rpeRange: { min: number; max: number }
  percentageRange: { min: number; max: number }
  description: string
  color: string
}

export const INTENSITY_ZONES: IntensityZone[] = [
  {
    label: 'Recovery',
    rpeRange: { min: 4, max: 5 },
    percentageRange: { min: 50, max: 60 },
    description: 'Light work, technique focus',
    color: '#22c55e',
  },
  {
    label: 'Hypertrophy',
    rpeRange: { min: 6, max: 7 },
    percentageRange: { min: 65, max: 75 },
    description: 'Muscle building focus',
    color: '#3b82f6',
  },
  {
    label: 'Strength',
    rpeRange: { min: 7, max: 8 },
    percentageRange: { min: 75, max: 85 },
    description: 'Strength development',
    color: '#f97316',
  },
  {
    label: 'Peak',
    rpeRange: { min: 8, max: 10 },
    percentageRange: { min: 85, max: 100 },
    description: 'Maximum effort work',
    color: '#ef4444',
  },
]
