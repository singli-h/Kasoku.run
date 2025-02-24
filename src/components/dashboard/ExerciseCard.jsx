/**
 * ExerciseCard Component
 * 
 * A card component that displays and manages an individual exercise.
 * Features video playback, completion tracking, and exercise-specific input fields.
 * 
 * Features:
 * - Lazy-loaded video playback
 * - Exercise completion tracking
 * - Dynamic input fields for exercise details
 * - Real-time data updates
 * 
 * @component
 */

'use client';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import { useInView } from 'react-intersection-observer';

export default function ExerciseCard({ 
  exercise,
  onInputChange,
  onToggleComplete,
  isReadOnly
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && !videoLoaded) {
      setVideoLoaded(true);
    }
  }, [inView, videoLoaded]);

  return (
    <div ref={ref} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Video Section */}
      <div className="relative aspect-video bg-gray-100">
        {videoLoaded && exercise.video_url ? (
          <>
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse">Loading video...</div>
              </div>
            )}
            <ReactPlayer
              url={exercise.video_url}
              width="100%"
              height="100%"
              controls
              onReady={() => setVideoReady(true)}
              config={{
                youtube: {
                  playerVars: { 
                    modestbranding: 1,
                    rel: 0
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

      {/* Exercise Information */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">
            {exercise.name}
          </h3>
          {!isReadOnly && (
            <input
              type="checkbox"
              checked={exercise.completed}
              onChange={onToggleComplete}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              aria-label={`Mark ${exercise.name} as completed`}
            />
          )}
        </div>

        {/* Exercise Details */}
        <div className="space-y-4">
          {exercise.details.map((detail, index) => (
            <div key={detail.id} className="border-t pt-4">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Set {index + 1}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Reps Input */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Reps</label>
                  <input
                    type="number"
                    value={detail.reps || 0}
                    onChange={(e) => onInputChange(`details.${index}.reps`, e.target.value)}
                    className="w-full p-2 border rounded-md"
                    min="0"
                    disabled={isReadOnly}
                  />
                </div>

                {/* Weight Input (if applicable) */}
                {detail.weight !== null && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="number"
                      value={detail.weight || 0}
                      onChange={(e) => onInputChange(`details.${index}.weight`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      disabled={isReadOnly}
                    />
                  </div>
                )}

                {/* Power Input (if applicable) */}
                {detail.power !== null && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Power</label>
                    <input
                      type="number"
                      value={detail.power || 0}
                      onChange={(e) => onInputChange(`details.${index}.power`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      disabled={isReadOnly}
                    />
                  </div>
                )}

                {/* Velocity Input (if applicable) */}
                {detail.velocity !== null && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Velocity</label>
                    <input
                      type="number"
                      value={detail.velocity || 0}
                      onChange={(e) => onInputChange(`details.${index}.velocity`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.1"
                      disabled={isReadOnly}
                    />
                  </div>
                )}

                {/* Rest Time Input (if applicable) */}
                {detail.rest_time !== null && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Rest (s)</label>
                    <input
                      type="number"
                      value={detail.rest_time || 0}
                      onChange={(e) => onInputChange(`details.${index}.rest_time`, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      disabled={isReadOnly}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    video_url: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    details: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      reps: PropTypes.number.isRequired,
      weight: PropTypes.number,
      power: PropTypes.number,
      velocity: PropTypes.number,
      rest_time: PropTypes.number,
      completed: PropTypes.bool.isRequired
    })).isRequired
  }).isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool
}; 