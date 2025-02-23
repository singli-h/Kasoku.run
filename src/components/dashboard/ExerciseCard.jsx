/**
 * ExerciseCard Component
 * 
 * A card component that displays and manages an individual exercise.
 * Features video playback, completion tracking, and exercise-specific input fields.
 * Supports both gym exercises (with multiple sets) and circuit/warmup exercises.
 * 
 * Features:
 * - Lazy-loaded video playback using react-player
 * - Intersection observer for optimized video loading
 * - Responsive layout with grid system
 * - Exercise completion tracking
 * - Dynamic input fields based on exercise type
 * - Real-time data updates
 * 
 * @component
 */

// @ts-check
'use client';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import { useInView } from 'react-intersection-observer';

/**
 * @typedef {import('../../types/exercise').GymExercise | import('../../types/exercise').WarmupCircuitExercise} Exercise
 */

/**
 * @typedef {import('../../types/exercise').ExerciseSet} ExerciseSet
 */

/**
 * @typedef {Object} ExerciseCardProps
 * @property {Exercise} exercise - The exercise data to display
 * @property {(field: string, value: string) => void} onInputChange - Callback for input field changes
 * @property {() => void} onToggleComplete - Callback for toggling exercise completion
 */

/**
 * @param {{
 *   exercise: Exercise
 *   onInputChange: (field: string, value: string) => void
 *   onToggleComplete: () => void
 * }} props
 */
export default function ExerciseCard({ 
  exercise, 
  onInputChange,
  onToggleComplete 
}) {
  // State for video loading and playback
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Determine exercise type for conditional rendering
  const isGymExercise = 'sets' in exercise && Array.isArray(exercise.sets);

  /**
   * Intersection Observer setup for lazy loading
   * Only loads video when card comes into view
   */
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  /**
   * Effect to handle video loading when card comes into view
   */
  useEffect(() => {
    if (inView && !videoLoaded) {
      setVideoLoaded(true);
    }
  }, [inView, videoLoaded]);

  /**
   * Handles changes to exercise input fields
   * @param {string} field - The field to update
   * @param {string} value - The new value
   */
  const handleInputChange = (field, value) => {
    onInputChange(field, value);
  };

  return (
    <div ref={ref} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Video Section with lazy loading */}
      <div className="relative aspect-video bg-gray-100">
        {videoLoaded && exercise.video_url ? (
          <>
            {/* Loading indicator while video initializes */}
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse">Loading video...</div>
              </div>
            )}
            {/* Video player with YouTube optimizations */}
            <ReactPlayer
              url={exercise.video_url}
              width="100%"
              height="100%"
              controls
              onReady={() => setVideoReady(true)}
              config={{
                youtube: {
                  playerVars: { 
                    modestbranding: 1, // Minimal YouTube branding
                    rel: 0  // Don't show related videos
                  }
                }
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No video available
          </div>
        )}
      </div>

      {/* Exercise Information and Controls */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">
            {exercise.name || `Exercise #${exercise.id}`}
          </h3>
          {/* Completion toggle */}
          <input
            type="checkbox"
            checked={exercise.completed}
            onChange={onToggleComplete}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            aria-label={`Mark ${exercise.name} as completed`}
          />
        </div>

        {/* Dynamic Input Fields Section */}
        <div className="grid grid-cols-1 gap-4">
          {isGymExercise ? (
            // Gym Exercise: Multiple sets with reps, weight, power, velocity
            /** @type {ExerciseSet[]} */ (exercise.sets).map((set, index) => (
              <div key={`${exercise.id}-${set.id}`} className="border-t pt-4 space-y-4">
                <div className="text-sm font-medium text-gray-600">Set {index + 1}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Reps Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Reps</label>
                    <input
                      type="number"
                      value={set.reps || 0}
                      onChange={(e) => handleInputChange(`sets.${index}.reps`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="1"
                    />
                  </div>
                  {/* Weight Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="number"
                      value={set.weight || 0}
                      onChange={(e) => handleInputChange(`sets.${index}.weight`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="1"
                    />
                  </div>
                  {/* Power Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Power</label>
                    <input
                      type="number"
                      value={set.power || 0}
                      onChange={(e) => handleInputChange(`sets.${index}.power`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="10"
                    />
                  </div>
                  {/* Velocity Input */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Velocity</label>
                    <input
                      type="number"
                      value={set.velocity || 0}
                      onChange={(e) => handleInputChange(`sets.${index}.velocity`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Circuit/Warmup Exercise: Single set of inputs
            <div className="grid grid-cols-3 gap-4">
              {/* Sets Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sets</label>
                <input
                  type="number"
                  value={exercise.sets || 0}
                  onChange={(e) => handleInputChange('sets', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
              {/* Reps Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Reps</label>
                <input
                  type="number"
                  value={exercise.reps || 0}
                  onChange={(e) => handleInputChange('reps', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
              {/* Rest Period Input */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Rest (s)</label>
                <input
                  type="number"
                  value={exercise.rest || 0}
                  onChange={(e) => handleInputChange('rest', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PropTypes validation
ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    completed: PropTypes.bool.isRequired,
    video_url: PropTypes.string,
    sets: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        reps: PropTypes.number,
        weight: PropTypes.number,
        power: PropTypes.number,
        velocity: PropTypes.number,
      })),
    ]),
    reps: PropTypes.number,
    rest: PropTypes.number,
  }).isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
}; 