/**
 * UI constants for AI-generated changesets
 *
 * Shared styling constants used across components that display AI change indicators.
 * These map to CSS classes defined in globals.css for consistent light/dark mode support.
 */

import type { UIDisplayType } from './types'

/**
 * Background color classes for AI change type indicators.
 * Uses CSS classes from globals.css for dark mode support.
 */
export const AI_BG_COLORS: Record<UIDisplayType, string> = {
  swap: 'ai-swap-bg',
  add: 'ai-add-bg',
  update: 'ai-update-bg',
  remove: 'ai-remove-bg',
} as const

/**
 * Text color classes for AI change type indicators.
 */
export const AI_TEXT_COLORS: Record<UIDisplayType, string> = {
  swap: 'text-amber-900 dark:text-amber-100',
  add: 'text-emerald-900 dark:text-emerald-100',
  update: 'text-blue-900 dark:text-blue-100',
  remove: 'text-red-900 dark:text-red-100',
} as const

/**
 * Border color classes for AI change type indicators.
 */
export const AI_BORDER_COLORS: Record<UIDisplayType, string> = {
  swap: 'border-amber-200 dark:border-amber-800',
  add: 'border-emerald-200 dark:border-emerald-800',
  update: 'border-blue-200 dark:border-blue-800',
  remove: 'border-red-200 dark:border-red-800',
} as const
