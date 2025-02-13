// @ts-check
'use client';
import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useInView } from 'react-intersection-observer';

/**
 * @typedef {import('../../types/exercise').GymExercise | import('../../types/exercise').WarmupCircuitExercise} Exercise
 */

/**
 * @typedef {import('../../types/exercise').ExerciseSet} ExerciseSet
 */

/**
 * @param {{
 *   exercise: Exercise
 *   exerciseType: 'gym' | 'warmup' | 'circuit'
 *   onInputChange: (field: string, value: string) => void
 *   onToggleComplete: () => void
 * }} props
 */
export default function ExerciseCard({ 
  exercise, 
  exerciseType,
  onInputChange,
  onToggleComplete 
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if video is loaded
  const isGymExercise = exerciseType === 'gym';

  const { ref, inView } = useInView({
    triggerOnce: false, // Allow multiple triggers
    threshold: 0.1, // Trigger when 10% of the video is visible
  });

  useEffect(() => {
    if (inView && !videoLoaded) {
      setVideoLoaded(true); // Mark video as loaded when it first comes into view
    }
  }, [inView, videoLoaded]);

  const handleInputChange = (field, value) => {
    onInputChange(field, value);
  };

  return (
    <div ref={ref} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Video Section */}
      <div className="relative aspect-video bg-gray-100">
        {videoLoaded && exercise.video_url ? ( // Load video only if it hasn't been loaded before
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

      {/* Exercise Content */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">
            {exercise.name}
          </h3>
          <input
            type="checkbox"
            checked={exercise.completed}
            onChange={onToggleComplete}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            aria-label={`Mark ${exercise.name} as completed`}
          />
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-4">
          {isGymExercise ? (
            /** @type {ExerciseSet[]} */ (exercise.sets).map((set, index) => (
              <div key={set.id} className="border-t pt-4 space-y-4">
                <div className="text-sm font-medium text-gray-600">Set {index + 1}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sets</label>
                <input
                  type="number"
                  value={typeof exercise.sets === 'number' ? exercise.sets : 0}
                  onChange={(e) => handleInputChange('sets', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Weight</label>
                <input
                  type="number"
                  value={exercise.weight || 0}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  min="0"
                  step="1"
                />
              </div>
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