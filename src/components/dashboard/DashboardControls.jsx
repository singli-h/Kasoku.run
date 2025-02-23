/**
 * DashboardControls Component
 * 
 * A control panel component for the dashboard that allows users to select
 * their training program, week, and day. Provides a responsive grid layout
 * with dropdown selectors and program display.
 * 
 * Features:
 * - Program name display
 * - Week selection dropdown
 * - Day selection dropdown (disabled until week is selected)
 * - Responsive 3-column grid layout
 * - Consistent styling with the dashboard theme
 * 
 * @component
 */

'use client'

import PropTypes from 'prop-types';

/**
 * @typedef {Object} DashboardControlsProps
 * @property {number|null} selectedWeek - Currently selected week number
 * @property {number|null} selectedDay - Currently selected day number
 * @property {Object|null} selectedGroup - Selected program group object
 * @property {Function} handleWeekChange - Handler for week selection changes
 * @property {Function} handleDayChange - Handler for day selection changes
 * @property {Function} getUniqueWeeks - Function to get available weeks
 * @property {Function} getAvailableDays - Function to get available days for selected week
 */

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
      {/* Program Display Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Program</h2>
        <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-zinc-900">
          {selectedGroup ? selectedGroup.name : "No group selected"}
        </div>
      </div>

      {/* Week Selection Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Week</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
          value={selectedWeek || ""}
          onChange={handleWeekChange}
          aria-label="Select training week"
        >
          <option value="">Select a week</option>
          {getUniqueWeeks().map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </select>
      </div>

      {/* Day Selection Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Day</h2>
        <select
          className="w-full p-2 border border-gray-300 rounded-md text-zinc-900"
          value={selectedDay || ""}
          onChange={handleDayChange}
          disabled={!selectedWeek}
          aria-label="Select training day"
          aria-disabled={!selectedWeek}
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

// PropTypes validation
DashboardControls.propTypes = {
  selectedWeek: PropTypes.number,
  selectedDay: PropTypes.number,
  selectedGroup: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  handleWeekChange: PropTypes.func.isRequired,
  handleDayChange: PropTypes.func.isRequired,
  getUniqueWeeks: PropTypes.func.isRequired,
  getAvailableDays: PropTypes.func.isRequired,
}; 