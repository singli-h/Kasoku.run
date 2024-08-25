import React from 'react';

const GymRow = ({ set }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-7 border-t border-stroke py-4.5 px-4 dark:border-strokedark md:px-6 2xl:px-7.5">
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.exercise.name}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.reps}</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.rest}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.intensity}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.wts}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">{set.targetV}</p> 
          </div>
          <div className="col-span-1 flex items-center">
            {/* Replace with actual video embedding or linking */}
            <a href={set.exercise.videoUrl} target="_blank" className="text-sm text-black dark:text-white">
              Watch Demo
            </a>
          </div>
        </div>
      );
  };

export default GymRow