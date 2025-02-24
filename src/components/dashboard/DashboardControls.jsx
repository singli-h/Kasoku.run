/**
 * DashboardControls Component
 * 
 * A control panel component for the dashboard that displays session information
 * and provides controls based on the session status.
 * 
 * Features:
 * - Session status display
 * - Start session button for assigned sessions
 * - Save progress button for ongoing sessions
 * - Complete session button for ongoing sessions
 * - View completed session details
 * 
 * @component
 */

'use client'

import PropTypes from 'prop-types';

export default function DashboardControls({
  session,
  onStartSession,
  onSaveSession,
  onCompleteSession,
  isLoading
}) {
  if (!session) {
    return (
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No session available</p>
      </div>
    );
  }

  const { details } = session;
  const { exercise_preset_groups: group } = details;

  return (
    <div className="mb-6 space-y-4">
      {/* Session Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <h2 className="text-xl font-semibold mb-2">Program</h2>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="font-medium">{group.name}</p>
            <p className="text-sm text-gray-600">
              Week {group.week}, Day {group.day}
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <div className="p-3 bg-gray-50 rounded-md">
            <div className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
              ${details.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : 
                details.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'}
            `}>
              {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {details.status === 'assigned' && (
          <button
            onClick={onStartSession}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        )}
        {details.status === 'ongoing' && (
          <>
            <button
              onClick={onSaveSession}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={onCompleteSession}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700
                       disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completing...' : 'Complete Session'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

DashboardControls.propTypes = {
  session: PropTypes.shape({
    type: PropTypes.string.isRequired,
    details: PropTypes.shape({
      status: PropTypes.oneOf(['ongoing', 'assigned', 'completed']).isRequired,
      exercise_preset_groups: PropTypes.shape({
        name: PropTypes.string.isRequired,
        week: PropTypes.number.isRequired,
        day: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  onStartSession: PropTypes.func.isRequired,
  onSaveSession: PropTypes.func.isRequired,
  onCompleteSession: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
}; 