/**
 * Sprint Performance Benchmark Data
 * Reference standards for sprint analytics comparisons
 *
 * Sources:
 * - World Athletics biomechanics research
 * - PMC: Elite 100m Sprint Performance studies
 * - Professional coaching standards
 */

export type SprintLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export interface SprintLevelConfig {
  label: string
  color: string
  colorClass: string
  men100m: { min: number; max: number }
  women100m: { min: number; max: number }
}

export const SPRINT_LEVELS: Record<SprintLevel, SprintLevelConfig> = {
  elite: {
    label: 'Elite',
    color: '#a855f7',
    colorClass: 'text-purple-500',
    men100m: { min: 9.80, max: 10.20 },
    women100m: { min: 10.80, max: 11.20 },
  },
  advanced: {
    label: 'Advanced',
    color: '#22c55e',
    colorClass: 'text-green-500',
    men100m: { min: 10.20, max: 10.80 },
    women100m: { min: 11.20, max: 11.80 },
  },
  intermediate: {
    label: 'Intermediate',
    color: '#3b82f6',
    colorClass: 'text-blue-500',
    men100m: { min: 10.80, max: 11.50 },
    women100m: { min: 11.80, max: 12.50 },
  },
  beginner: {
    label: 'Beginner',
    color: '#f97316',
    colorClass: 'text-orange-500',
    men100m: { min: 11.50, max: 13.00 },
    women100m: { min: 12.50, max: 14.00 },
  },
}

export interface SplitStandard {
  min: number
  max: number
}

export interface RunnerStandard {
  label: string
  color: string
  splits: Record<number, SplitStandard>
}

/**
 * Cumulative split standards for reference runners
 * Times are cumulative (total time to reach each distance)
 */
export const CUMULATIVE_SPLIT_STANDARDS: Record<string, RunnerStandard> = {
  '10.00': {
    label: '10.00s Runner',
    color: '#22c55e',
    splits: {
      10: { min: 1.80, max: 1.83 },
      20: { min: 3.00, max: 3.05 },
      30: { min: 3.95, max: 4.05 },
      40: { min: 5.05, max: 5.15 },
      50: { min: 6.05, max: 6.15 },
      60: { min: 6.85, max: 6.95 },
      70: { min: 7.95, max: 8.05 },
      80: { min: 8.85, max: 8.95 },
      90: { min: 9.55, max: 9.65 },
      100: { min: 10.00, max: 10.00 },
    },
  },
  '11.00': {
    label: '11.00s Runner',
    color: '#f97316',
    splits: {
      10: { min: 1.85, max: 1.90 },
      20: { min: 3.10, max: 3.20 },
      30: { min: 4.15, max: 4.25 },
      40: { min: 5.30, max: 5.40 },
      50: { min: 6.40, max: 6.55 },
      60: { min: 7.45, max: 7.60 },
      70: { min: 8.55, max: 8.70 },
      80: { min: 9.65, max: 9.80 },
      90: { min: 10.35, max: 10.50 },
      100: { min: 11.00, max: 11.00 },
    },
  },
  '12.00': {
    label: '12.00s Runner',
    color: '#6b7280',
    splits: {
      10: { min: 1.95, max: 2.05 },
      20: { min: 3.35, max: 3.50 },
      30: { min: 4.55, max: 4.75 },
      40: { min: 5.80, max: 6.00 },
      50: { min: 7.00, max: 7.25 },
      60: { min: 8.20, max: 8.50 },
      70: { min: 9.40, max: 9.70 },
      80: { min: 10.55, max: 10.90 },
      90: { min: 11.70, max: 12.00 },
      100: { min: 12.00, max: 12.00 },
    },
  },
}

export interface PerformanceParameter {
  label: string
  unit: string
  description: string
  standards: {
    '10.00': { min: number; max: number }
    '11.00': { min: number; max: number }
  }
  higherIsBetter: boolean
}

/**
 * Phase-Specific Stride Metrics
 *
 * Research shows stride length and frequency vary significantly by sprint phase:
 * - Acceleration (0-30m): Shorter strides, building frequency, longer ground contact
 * - Max Velocity (30-60m): Peak stride length (~2.5m elite), optimal frequency
 * - Speed Maintenance (60-100m): Stride frequency decreases, contact time increases
 *
 * IMPORTANT: Do NOT average stride metrics across phases - they must be compared
 * within the same phase for meaningful analysis.
 *
 * Sources:
 * - PMC: Kinematic Stride Characteristics of Elite Sprinters
 * - MDPI: Muscle Activity and Biomechanics of Sprinting Meta-Analysis
 * - World Athletics Biomechanics Reports
 */
export type SprintPhaseType = 'acceleration' | 'maxVelocity' | 'maintenance'

export interface PhaseStrideMetrics {
  strideLength: { min: number; max: number }
  strideFrequency: { min: number; max: number }
  groundContact: { min: number; max: number }
}

export const PHASE_STRIDE_STANDARDS: Record<string, Record<SprintPhaseType, PhaseStrideMetrics>> = {
  '10.00': {
    acceleration: {
      strideLength: { min: 1.60, max: 1.90 },    // Building up from blocks
      strideFrequency: { min: 4.2, max: 4.6 },   // High turnover
      groundContact: { min: 0.100, max: 0.120 }, // Longer contact for drive
    },
    maxVelocity: {
      strideLength: { min: 2.50, max: 2.70 },    // Peak stride length
      strideFrequency: { min: 4.6, max: 4.9 },   // Optimal frequency
      groundContact: { min: 0.080, max: 0.088 }, // Minimal contact
    },
    maintenance: {
      strideLength: { min: 2.40, max: 2.60 },    // Slight decrease
      strideFrequency: { min: 4.3, max: 4.6 },   // Frequency drops
      groundContact: { min: 0.085, max: 0.095 }, // Contact increases
    },
  },
  '11.00': {
    acceleration: {
      strideLength: { min: 1.50, max: 1.80 },
      strideFrequency: { min: 3.9, max: 4.3 },
      groundContact: { min: 0.110, max: 0.130 },
    },
    maxVelocity: {
      strideLength: { min: 2.20, max: 2.40 },
      strideFrequency: { min: 4.2, max: 4.5 },
      groundContact: { min: 0.090, max: 0.100 },
    },
    maintenance: {
      strideLength: { min: 2.10, max: 2.30 },
      strideFrequency: { min: 4.0, max: 4.3 },
      groundContact: { min: 0.095, max: 0.110 },
    },
  },
  '12.00': {
    acceleration: {
      strideLength: { min: 1.40, max: 1.70 },
      strideFrequency: { min: 3.6, max: 4.0 },
      groundContact: { min: 0.120, max: 0.145 },
    },
    maxVelocity: {
      strideLength: { min: 2.00, max: 2.25 },
      strideFrequency: { min: 3.9, max: 4.2 },
      groundContact: { min: 0.100, max: 0.115 },
    },
    maintenance: {
      strideLength: { min: 1.90, max: 2.15 },
      strideFrequency: { min: 3.7, max: 4.0 },
      groundContact: { min: 0.105, max: 0.125 },
    },
  },
}

/**
 * Distance-based time standards
 * Supports sprint distances from 20m to 400m
 */
export interface DistanceStandard {
  distance: number
  label: string
  standards: {
    '10.00': { min: number; max: number }
    '11.00': { min: number; max: number }
    '12.00': { min: number; max: number }
  }
}

export const DISTANCE_STANDARDS: DistanceStandard[] = [
  {
    distance: 20,
    label: '20m',
    standards: {
      '10.00': { min: 3.00, max: 3.05 },
      '11.00': { min: 3.10, max: 3.20 },
      '12.00': { min: 3.35, max: 3.50 },
    },
  },
  {
    distance: 30,
    label: '30m',
    standards: {
      '10.00': { min: 3.95, max: 4.05 },
      '11.00': { min: 4.15, max: 4.25 },
      '12.00': { min: 4.55, max: 4.75 },
    },
  },
  {
    distance: 40,
    label: '40m',
    standards: {
      '10.00': { min: 5.05, max: 5.15 },
      '11.00': { min: 5.30, max: 5.40 },
      '12.00': { min: 5.80, max: 6.00 },
    },
  },
  {
    distance: 60,
    label: '60m',
    standards: {
      '10.00': { min: 6.85, max: 6.95 },
      '11.00': { min: 7.45, max: 7.60 },
      '12.00': { min: 8.20, max: 8.50 },
    },
  },
  {
    distance: 80,
    label: '80m',
    standards: {
      '10.00': { min: 8.85, max: 8.95 },
      '11.00': { min: 9.65, max: 9.80 },
      '12.00': { min: 10.55, max: 10.90 },
    },
  },
  {
    distance: 100,
    label: '100m',
    standards: {
      '10.00': { min: 9.90, max: 10.10 },
      '11.00': { min: 10.90, max: 11.10 },
      '12.00': { min: 11.90, max: 12.10 },
    },
  },
  {
    distance: 150,
    label: '150m',
    standards: {
      '10.00': { min: 15.50, max: 16.00 },
      '11.00': { min: 17.00, max: 17.50 },
      '12.00': { min: 18.50, max: 19.20 },
    },
  },
  {
    distance: 200,
    label: '200m',
    standards: {
      '10.00': { min: 20.00, max: 20.50 },
      '11.00': { min: 22.00, max: 22.80 },
      '12.00': { min: 24.00, max: 25.00 },
    },
  },
  {
    distance: 300,
    label: '300m',
    standards: {
      '10.00': { min: 32.00, max: 33.50 },
      '11.00': { min: 36.00, max: 38.00 },
      '12.00': { min: 40.00, max: 42.50 },
    },
  },
  {
    distance: 400,
    label: '400m',
    standards: {
      '10.00': { min: 45.00, max: 47.00 },
      '11.00': { min: 50.00, max: 53.00 },
      '12.00': { min: 56.00, max: 60.00 },
    },
  },
]

/**
 * Get time standard for a specific distance
 */
export function getDistanceStandard(distance: number): DistanceStandard | undefined {
  return DISTANCE_STANDARDS.find(s => s.distance === distance)
}

/**
 * Get the sprint phase for a given distance within a race
 */
export function getPhaseForDistance(distance: number, totalDistance: number = 100): SprintPhaseType {
  // For shorter sprints (≤60m), adjust phase boundaries
  if (totalDistance <= 40) {
    // 40m sprint: 0-20m accel, 20-40m max velocity
    if (distance <= totalDistance * 0.5) return 'acceleration'
    return 'maxVelocity'
  }
  if (totalDistance <= 60) {
    // 60m sprint: 0-25m accel, 25-60m max velocity
    if (distance <= 25) return 'acceleration'
    return 'maxVelocity'
  }
  // 100m+ sprint: standard phases
  if (distance <= 30) return 'acceleration'
  if (distance <= 60) return 'maxVelocity'
  return 'maintenance'
}

/**
 * Get phase-specific stride standards
 */
export function getPhaseStrideStandards(
  phase: SprintPhaseType,
  targetStandard: '10.00' | '11.00' | '12.00' = '11.00'
): PhaseStrideMetrics | undefined {
  return PHASE_STRIDE_STANDARDS[targetStandard]?.[phase]
}

/**
 * Detailed performance parameters for sprint analysis
 * Note: Stride metrics shown are for max velocity phase by default
 */
export const PERFORMANCE_PARAMETERS: Record<string, PerformanceParameter> = {
  reactionTime: {
    label: 'Reaction Time',
    unit: 's',
    description: 'Neural response speed at start',
    standards: {
      '10.00': { min: 0.13, max: 0.15 },
      '11.00': { min: 0.15, max: 0.18 },
    },
    higherIsBetter: false,
  },
  // Research-backed phase boundaries (PMC8847979)
  // 0-40m Acceleration, 40-80m Max Velocity, 80-100m Deceleration
  phase0_40: {
    label: '0-40m Acceleration',
    unit: 's',
    description: 'Full acceleration phase from blocks',
    standards: {
      '10.00': { min: 5.05, max: 5.15 },  // From cumulative split standards
      '11.00': { min: 5.30, max: 5.40 },
    },
    higherIsBetter: false,
  },
  phase40_80: {
    label: '40-80m Max Velocity',
    unit: 's',
    description: 'Peak velocity phase',
    standards: {
      '10.00': { min: 3.75, max: 3.85 },  // 8.95 - 5.15 = 3.80
      '11.00': { min: 4.30, max: 4.45 },  // 9.80 - 5.40 = 4.40
    },
    higherIsBetter: false,
  },
  phase80_100: {
    label: '80-100m Deceleration',
    unit: 's',
    description: 'Speed maintenance phase',
    standards: {
      '10.00': { min: 1.00, max: 1.10 },  // 10.00 - 8.95 = 1.05
      '11.00': { min: 1.15, max: 1.25 },  // 11.00 - 9.80 = 1.20
    },
    higherIsBetter: false,
  },
  // Sub-phases for short sprint analysis (≤40m)
  phase0_20: {
    label: '0-20m Initial Accel',
    unit: 's',
    description: 'Block start and initial drive',
    standards: {
      '10.00': { min: 3.00, max: 3.05 },
      '11.00': { min: 3.10, max: 3.20 },
    },
    higherIsBetter: false,
  },
  phase20_40: {
    label: '20-40m Main Accel',
    unit: 's',
    description: 'Transition and continued acceleration',
    standards: {
      '10.00': { min: 2.00, max: 2.15 },  // 5.15 - 3.05 = 2.10
      '11.00': { min: 2.15, max: 2.25 },  // 5.40 - 3.20 = 2.20
    },
    higherIsBetter: false,
  },
  // Legacy phase keys (deprecated, kept for backwards compatibility)
  phase0_30: {
    label: '0-30m Phase',
    unit: 's',
    description: 'Acceleration phase (legacy)',
    standards: {
      '10.00': { min: 3.95, max: 4.05 },
      '11.00': { min: 4.15, max: 4.25 },
    },
    higherIsBetter: false,
  },
  phase30_60: {
    label: '30-60m Phase',
    unit: 's',
    description: 'Max velocity phase (legacy)',
    standards: {
      '10.00': { min: 2.85, max: 2.95 },
      '11.00': { min: 3.25, max: 3.35 },
    },
    higherIsBetter: false,
  },
  phase60_100: {
    label: '60-100m Phase',
    unit: 's',
    description: 'Speed maintenance phase (legacy)',
    standards: {
      '10.00': { min: 3.05, max: 3.15 },
      '11.00': { min: 3.45, max: 3.55 },
    },
    higherIsBetter: false,
  },
  topSpeed: {
    label: 'Top Speed',
    unit: 'm/s',
    description: 'Maximum velocity achieved (typically 50-70m)',
    standards: {
      '10.00': { min: 11.2, max: 11.8 },
      '11.00': { min: 9.8, max: 10.4 },
    },
    higherIsBetter: true,
  },
  // Max velocity phase stride metrics (reference phase for benchmarks)
  strideLength: {
    label: 'Stride Length',
    unit: 'm',
    description: 'Distance per stride at max velocity phase (30-60m)',
    standards: {
      '10.00': { min: 2.50, max: 2.70 },
      '11.00': { min: 2.20, max: 2.40 },
    },
    higherIsBetter: true,
  },
  strideFrequency: {
    label: 'Stride Frequency',
    unit: 'Hz',
    description: 'Steps per second at max velocity phase (30-60m)',
    standards: {
      '10.00': { min: 4.6, max: 4.9 },
      '11.00': { min: 4.2, max: 4.5 },
    },
    higherIsBetter: true,
  },
  groundContact: {
    label: 'Ground Contact',
    unit: 'ms',
    description: 'Contact time at max velocity',
    standards: {
      '10.00': { min: 0.080, max: 0.088 },
      '11.00': { min: 0.090, max: 0.100 },
    },
    higherIsBetter: false,
  },
}

/**
 * Sprint phase definitions for analysis
 *
 * Based on biomechanics research (PMC8847979):
 * - Acceleration: 0-40m (subdivided into initial 0-20m and main 20-40m)
 * - Maximum Velocity: 40-80m (athletes typically reach peak speed 50-70m)
 * - Deceleration: 80-100m (speed maintenance phase)
 *
 * For shorter sprints (≤40m), only acceleration phases apply.
 */
export interface SprintPhase {
  id: string
  label: string
  shortLabel: string
  startDistance: number
  endDistance: number
  description: string
  focusAreas: string[]
}

export const SPRINT_PHASES: SprintPhase[] = [
  {
    id: 'acceleration',
    label: '0-40m Acceleration',
    shortLabel: '0-40m',
    startDistance: 0,
    endDistance: 40,
    description: 'Drive phase with rapid velocity increase from blocks',
    focusAreas: ['Block start', 'Drive angle', 'Horizontal force', 'Posture transition'],
  },
  {
    id: 'maxVelocity',
    label: '40-80m Max Velocity',
    shortLabel: '40-80m',
    startDistance: 40,
    endDistance: 80,
    description: 'Peak velocity phase with upright running mechanics',
    focusAreas: ['Vertical stiffness', 'Stride optimization', 'Ground contact time'],
  },
  {
    id: 'deceleration',
    label: '80-100m Speed Maintenance',
    shortLabel: '80-100m',
    startDistance: 80,
    endDistance: 100,
    description: 'Minimizing velocity loss through efficient mechanics',
    focusAreas: ['Relaxation', 'Stride efficiency', 'Fatigue resistance'],
  },
]

/**
 * Sub-phases for detailed 40m sprint analysis
 * When total distance is ≤40m, we show these instead
 */
export const SHORT_SPRINT_PHASES: SprintPhase[] = [
  {
    id: 'initialAccel',
    label: '0-20m Initial Acceleration',
    shortLabel: '0-20m',
    startDistance: 0,
    endDistance: 20,
    description: 'Block clearance and initial drive phase',
    focusAreas: ['Reaction time', 'Block start', 'First 10 steps'],
  },
  {
    id: 'mainAccel',
    label: '20-40m Main Acceleration',
    shortLabel: '20-40m',
    startDistance: 20,
    endDistance: 40,
    description: 'Transition to upright running with continued acceleration',
    focusAreas: ['Posture transition', 'Stride lengthening', 'Power output'],
  },
]

/**
 * Calculate sprint level based on 100m time
 */
export function getSprintLevel(time100m: number, gender: 'male' | 'female'): SprintLevel {
  const key = gender === 'male' ? 'men100m' : 'women100m'

  if (time100m <= SPRINT_LEVELS.elite[key].max) return 'elite'
  if (time100m <= SPRINT_LEVELS.advanced[key].max) return 'advanced'
  if (time100m <= SPRINT_LEVELS.intermediate[key].max) return 'intermediate'
  return 'beginner'
}

/**
 * Calculate percentage score for a phase time against standards
 */
export function calculatePhaseScore(
  phaseTime: number,
  parameterKey: string,
  targetStandard: '10.00' | '11.00' = '11.00'
): number {
  const param = PERFORMANCE_PARAMETERS[parameterKey]
  if (!param) return 0

  const target = param.standards[targetStandard]
  const midpoint = (target.min + target.max) / 2

  if (param.higherIsBetter) {
    // Higher is better (e.g., speed)
    return Math.min(100, (phaseTime / midpoint) * 100)
  } else {
    // Lower is better (e.g., time)
    if (phaseTime <= target.min) return 100
    if (phaseTime >= target.max * 1.2) return 50 // 20% slower = 50%
    return Math.max(50, 100 - ((phaseTime - midpoint) / midpoint) * 100)
  }
}

/**
 * Get comparison status for a metric
 */
export function getComparisonStatus(
  value: number,
  parameterKey: string,
  targetStandard: '10.00' | '11.00' = '11.00'
): 'ahead' | 'on-track' | 'behind' {
  const param = PERFORMANCE_PARAMETERS[parameterKey]
  if (!param) return 'on-track'

  const target = param.standards[targetStandard]

  if (param.higherIsBetter) {
    if (value >= target.min) return 'ahead'
    if (value >= target.min * 0.95) return 'on-track'
    return 'behind'
  } else {
    if (value <= target.max) return 'ahead'
    if (value <= target.max * 1.05) return 'on-track'
    return 'behind'
  }
}

/**
 * Format time with appropriate precision
 */
export function formatSprintTime(seconds: number, precision: number = 2): string {
  return seconds.toFixed(precision) + 's'
}

/**
 * Format speed with appropriate precision
 */
export function formatSpeed(metersPerSecond: number, precision: number = 2): string {
  return metersPerSecond.toFixed(precision) + ' m/s'
}

/**
 * Convert splits array to cumulative times
 */
export function toCumulativeSplits(splits: Array<{ distance: number; time: number }>): Array<{ distance: number; cumulativeTime: number }> {
  let cumulative = 0
  return splits.map(split => {
    cumulative += split.time
    return { distance: split.distance, cumulativeTime: cumulative }
  })
}
