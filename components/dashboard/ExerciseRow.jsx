import React from 'react';

// ExerciseRow component (shared for Warm-up and Circuit sections)
const ExerciseRow = ({ exercise }) => {
    return (
        <div className="grid grid-cols-3 border-t border-stroke py-4.5 px-4 dark:border-strokedark md:px-6 2xl:px-7.5">
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{exercise.name}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{exercise.reps}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            {/* Replace with actual video embedding or linking */}
            <a href={exercise.videoUrl} target="_blank" className="text-sm text-black dark:text-white">
              Watch Demo
            </a>
          </div>
        </div>
    );
};

export default ExerciseRow