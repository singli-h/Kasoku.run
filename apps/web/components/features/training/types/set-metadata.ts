/**
 * Set Metadata Schema
 *
 * Defines the structure for advanced equipment data stored in the
 * `metadata` JSONB column of session_plan_sets and workout_log_sets tables.
 *
 * This enables:
 * - AI image/screenshot parsing to extract equipment-specific data
 * - Consistent analytics queries across different equipment types
 * - Type-safe storage and retrieval
 *
 * Note: Basic metrics (reps, weight, distance, time, etc.) use dedicated columns.
 * Metadata is for advanced/equipment-specific data that varies by device.
 */

/**
 * Sprint timing/biomechanics data
 * Sources: Freelap, 1080 Sprint, timing gates, video analysis
 */
export interface SprintMetadata {
  equipment?: 'freelap' | '1080_sprint' | 'timing_gates' | 'video_analysis' | 'other'

  // Timing data
  reaction_time_ms?: number // Reaction time from start signal
  split_times_ms?: number[] // Split times at each gate/checkpoint
  acceleration_time_ms?: number // Time in acceleration phase (0-30m typically)
  max_velocity_time_ms?: number // Time at max velocity
  deceleration_time_ms?: number // Time in deceleration phase

  // Biomechanics
  stride_count?: number // Total number of strides
  stride_frequency_hz?: number // Strides per second at max velocity
  stride_length_m?: number // Average stride length in meters
  ground_contact_time_ms?: number // Average ground contact time
  flight_time_ms?: number // Average flight time between contacts

  // 1080 Sprint specific
  peak_power_w?: number // Peak power output
  mean_power_w?: number // Mean power output
  peak_force_n?: number // Peak force (newtons)
  peak_velocity_ms?: number // Peak velocity achieved

  // Raw data reference (for AI to link to source image)
  source_image_url?: string
  source_device_id?: string
  raw_data?: Record<string, unknown> // Device-specific raw output
}

/**
 * Plyometric/Jump data
 * Sources: Force plates, contact mats, jump mats, video analysis
 */
export interface PlyometricMetadata {
  equipment?: 'force_plate' | 'contact_mat' | 'jump_mat' | 'video_analysis' | 'other'

  // Jump metrics
  jump_height_cm?: number // Calculated jump height
  air_time_ms?: number // Time in the air
  contact_time_ms?: number // Ground contact time (for reactive jumps)
  rsi?: number // Reactive Strength Index (height / contact_time)
  rsi_modified?: number // Modified RSI (height / (contact_time + air_time))

  // Force plate specific
  peak_force_n?: number // Peak ground reaction force
  peak_force_relative?: number // Peak force relative to body weight
  rate_of_force_development?: number // RFD (N/s)
  impulse_ns?: number // Impulse (N*s)
  mean_power_w?: number // Mean power during push-off
  peak_power_w?: number // Peak power during push-off

  // Landing metrics
  landing_force_n?: number // Peak landing force
  landing_rfd?: number // Landing rate of force development
  time_to_stabilization_ms?: number // Time to achieve stable landing

  // Asymmetry (bilateral jumps)
  left_right_asymmetry_percent?: number // % difference between legs
  left_force_n?: number
  right_force_n?: number

  // Raw data reference
  source_image_url?: string
  source_device_id?: string
  raw_data?: Record<string, unknown>
}

/**
 * Velocity-Based Training (VBT) data
 * Sources: GymAware, PUSH, Vitruve, Perch, etc.
 */
export interface VBTMetadata {
  equipment?: 'gymaware' | 'push' | 'vitruve' | 'perch' | 'tendo' | 'other'

  // Velocity metrics
  mean_velocity_ms?: number // Mean barbell velocity
  peak_velocity_ms?: number // Peak barbell velocity
  velocity_loss_percent?: number // Velocity loss from first rep

  // Power metrics
  mean_power_w?: number // Mean power output
  peak_power_w?: number // Peak power output
  power_loss_percent?: number // Power loss from first rep

  // Force metrics
  mean_force_n?: number
  peak_force_n?: number
  force_velocity_profile?: { // For profiling
    velocity_intercept?: number
    force_intercept?: number
    slope?: number
  }

  // Range of motion
  rom_cm?: number // Range of motion
  eccentric_duration_ms?: number
  concentric_duration_ms?: number
  pause_duration_ms?: number

  // Raw data reference
  source_image_url?: string
  source_device_id?: string
  raw_data?: Record<string, unknown>
}

/**
 * Keiser/Pneumatic resistance data
 */
export interface KeiserMetadata {
  equipment?: 'keiser' | 'other_pneumatic'

  // Power curve data
  peak_power_w?: number
  mean_power_w?: number
  peak_velocity_ms?: number
  peak_force_n?: number

  // Asymmetry (unilateral exercises)
  left_power_w?: number
  right_power_w?: number
  asymmetry_percent?: number

  // Force-velocity profile
  power_at_load?: { load_kg: number; power_w: number }[]

  // Raw data reference
  source_image_url?: string
  raw_data?: Record<string, unknown>
}

/**
 * Isometric testing data
 * Sources: Force plates, strain gauges, isometric rigs
 */
export interface IsometricMetadata {
  equipment?: 'force_plate' | 'strain_gauge' | 'isometric_rig' | 'other'

  // Force metrics
  peak_force_n?: number
  mean_force_n?: number
  time_to_peak_force_ms?: number
  rate_of_force_development?: number // RFD (N/s)
  impulse_ns?: number // Force x Time

  // Fatigue metrics (for sustained holds)
  force_at_intervals?: { time_s: number; force_n: number }[]
  fatigue_index?: number // % decline over time

  // Asymmetry
  left_force_n?: number
  right_force_n?: number
  asymmetry_percent?: number

  // Raw data reference
  source_image_url?: string
  raw_data?: Record<string, unknown>
}

/**
 * Heart rate / physiological data
 * Sources: HR monitors, wearables
 */
export interface PhysiologicalMetadata {
  heart_rate_bpm?: number // Current/peak HR
  heart_rate_avg_bpm?: number // Average HR during set
  heart_rate_recovery_bpm?: number // HR after rest period
  hrv_rmssd?: number // Heart rate variability
  lactate_mmol?: number // Blood lactate if measured
  spo2_percent?: number // Blood oxygen saturation

  source_device?: string
}

/**
 * Combined set metadata type
 * Allows flexible storage of any equipment-specific data
 */
export interface SetMetadata {
  // Equipment type identifier
  equipment_type?: 'sprint' | 'plyometric' | 'vbt' | 'keiser' | 'isometric' | 'physiological' | 'custom'

  // Equipment-specific data (use one based on equipment_type)
  sprint?: SprintMetadata
  plyometric?: PlyometricMetadata
  vbt?: VBTMetadata
  keiser?: KeiserMetadata
  isometric?: IsometricMetadata
  physiological?: PhysiologicalMetadata

  // Generic fields for any equipment
  custom?: Record<string, unknown>

  // AI parsing metadata
  ai_parsed?: {
    source_image_url?: string
    parsed_at?: string // ISO timestamp
    confidence_score?: number // 0-1 confidence in parsing accuracy
    requires_verification?: boolean
    parsing_notes?: string
  }

  // Notes
  notes?: string
}

/**
 * Validate that metadata conforms to expected structure
 * Used when saving data (especially from AI parsing)
 */
export function validateSetMetadata(metadata: unknown): metadata is SetMetadata {
  if (!metadata || typeof metadata !== 'object') return false

  const m = metadata as Record<string, unknown>

  // Check equipment_type is valid if present
  if (m.equipment_type !== undefined) {
    const validTypes = ['sprint', 'plyometric', 'vbt', 'keiser', 'isometric', 'physiological', 'custom']
    if (!validTypes.includes(m.equipment_type as string)) return false
  }

  return true
}

/**
 * Helper to extract key analytics metrics from metadata
 * Useful for quick summaries and comparisons
 */
export function extractKeyMetrics(metadata: SetMetadata): Record<string, number | undefined> {
  const metrics: Record<string, number | undefined> = {}

  if (metadata.sprint) {
    metrics.stride_frequency = metadata.sprint.stride_frequency_hz
    metrics.stride_length = metadata.sprint.stride_length_m
    metrics.peak_velocity = metadata.sprint.peak_velocity_ms
    metrics.peak_power = metadata.sprint.peak_power_w
  }

  if (metadata.plyometric) {
    metrics.jump_height = metadata.plyometric.jump_height_cm
    metrics.rsi = metadata.plyometric.rsi
    metrics.contact_time = metadata.plyometric.contact_time_ms
    metrics.air_time = metadata.plyometric.air_time_ms
    metrics.peak_force = metadata.plyometric.peak_force_n
  }

  if (metadata.vbt) {
    metrics.mean_velocity = metadata.vbt.mean_velocity_ms
    metrics.peak_velocity = metadata.vbt.peak_velocity_ms
    metrics.mean_power = metadata.vbt.mean_power_w
    metrics.peak_power = metadata.vbt.peak_power_w
  }

  if (metadata.keiser) {
    metrics.peak_power = metadata.keiser.peak_power_w
    metrics.asymmetry = metadata.keiser.asymmetry_percent
  }

  if (metadata.isometric) {
    metrics.peak_force = metadata.isometric.peak_force_n
    metrics.rfd = metadata.isometric.rate_of_force_development
  }

  return metrics
}

export default {
  validateSetMetadata,
  extractKeyMetrics,
}
