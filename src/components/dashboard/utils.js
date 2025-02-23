/**
 * Dashboard Utility Functions
 * 
 * Helper functions for managing exercise preset groups and their organization
 * by weeks and days. These functions help with filtering and organizing
 * exercise data for display in the dashboard.
 * 
 * @module dashboard/utils
 */

/**
 * Extracts unique week numbers from exercise preset groups
 * 
 * @param {Array<{week: number}>} exercisePresetGroups - Array of exercise preset groups
 * @returns {Array<number>} Sorted array of unique week numbers
 * 
 * @example
 * const groups = [
 *   { week: 1, day: 1 },
 *   { week: 1, day: 2 },
 *   { week: 2, day: 1 }
 * ];
 * getUniqueWeeks(groups); // Returns [1, 2]
 */
export function getUniqueWeeks(exercisePresetGroups) {
  return Array.from(new Set(exercisePresetGroups.map(group => group.week))).sort((a, b) => a - b)
}

/**
 * Gets available days for a selected week from exercise preset groups
 * 
 * @param {Array<{week: number, day: number}>} exercisePresetGroups - Array of exercise preset groups
 * @param {number|string|null} selectedWeek - The selected week number
 * @returns {Array<number>} Sorted array of available days for the selected week
 * 
 * @example
 * const groups = [
 *   { week: 1, day: 1 },
 *   { week: 1, day: 2 },
 *   { week: 2, day: 1 }
 * ];
 * getAvailableDays(groups, 1); // Returns [1, 2]
 */
export function getAvailableDays(exercisePresetGroups, selectedWeek) {
  if (!selectedWeek) return []
  return Array.from(
    new Set(
      exercisePresetGroups
        .filter(group => group.week === Number(selectedWeek))
        .map(group => group.day)
    )
  ).sort((a, b) => a - b)
} 