export function getUniqueWeeks(exercisePresetGroups) {
  return Array.from(new Set(exercisePresetGroups.map(group => group.week))).sort((a, b) => a - b)
}

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