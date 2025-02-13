'use client'

export default function DashboardControls({
  selectedWeek,
  selectedDay,
  selectedGroup,
  handleWeekChange,
  handleDayChange,
  getUniqueWeeks,
  getAvailableDays
}) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Program</h2>
        <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-zinc-900">
          {selectedGroup ? selectedGroup.name : "No group selected"}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Week</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
          value={selectedWeek || ""}
          onChange={handleWeekChange}
        >
          <option value="">Select a week</option>
          {getUniqueWeeks().map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2 text-col">Day</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
          value={selectedDay || ""}
          onChange={handleDayChange}
          disabled={!selectedWeek}
        >
          <option value="">Select a day</option>
          {getAvailableDays().map((day) => (
            <option key={day} value={day}>
              Day {day}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 