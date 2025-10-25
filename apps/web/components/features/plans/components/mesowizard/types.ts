/**
 * MesoWizard Shared Types
 * Type definitions shared across the plan creation wizard components
 */

import type { PlanType } from "./plan-type-selection"

/**
 * Plan data collected throughout the wizard steps
 * Used to pass configuration between wizard steps and final submission
 */
export interface PlanData {
  type: PlanType
  name: string
  description?: string
  startDate: Date
  endDate: Date
  macrocycleId?: number  // Parent macrocycle for mesocycle
  mesocycleId?: number   // Parent mesocycle for microcycle
  athleteGroupId?: number
  sessions?: any[]       // Session data collected in SessionBuilder step
}
