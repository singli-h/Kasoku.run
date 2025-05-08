'use client'

import { LoadingAnimation } from './LoadingAnimation';
import { motion } from 'framer-motion';

/**
 * ErrorAndLoadingOverlay component
 * Shows loading animation or error message with a non-blocking design
 * Features a clean lightning/speed-inspired design with blue and purple theme
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether content is loading 
 * @param {Error} props.error - Error object if there's an error
 * @param {boolean} [props.blocking=false] - Whether the overlay should block user interaction
 * @param {string} [props.position="top-right"] - Position of the loading indicator (top-right, top-left, bottom-right, bottom-left, center)
 * @param {string} [props.loadingMessage="Loading..."] - Message to display when loading
 */
const ErrorAndLoadingOverlay = ({ 
  isLoading, 
  error, 
  blocking = false, 
  position = "top-right",
  loadingMessage = "Loading..." 
}) => {
  // Handle error display - now also respects the non-blocking flag
  if (error) {
    if (blocking) {
      // Blocking error modal
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900/70 p-5 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-4 border border-red-500/30 backdrop-blur-sm"
          >
            <div className="relative mb-4">
              <LoadingAnimation size="sm" />
              <motion.div 
                className="absolute inset-0 border-2 border-red-500/70 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-red-400 font-medium mb-1">Error</p>
              <p className="text-gray-300 text-sm">
                {error.message || "An unknown error occurred"}
              </p>
            </motion.div>
          </motion.div>
        </div>
      );
    } else {
      // Non-blocking error notification - fixed size issues
      return (
        <motion.div 
          className={`fixed ${positionMap[position] || positionMap["top-right"]} z-40`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center p-3 bg-gray-900/70 rounded-lg shadow-lg border border-red-500/40 backdrop-blur-sm max-w-xs">
            {/* Custom error indicator icon */}
            <div className="relative flex-shrink-0 mr-3 w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/20"></div>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path 
                  d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="text-red-400"
                />
              </svg>
              <motion.div 
                className="absolute inset-0 border border-red-500/70 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            </div>
            
            <div>
              <p className="text-red-400 text-sm font-medium">Error</p>
              <p className="text-gray-300 text-xs">
                {error.message || "An unknown error occurred"}
              </p>
            </div>
          </div>
        </motion.div>
      );
    }
  }

  // Handle loading state
  if (isLoading) {
    return (
      <LoadingAnimation 
        fullScreen 
        blocking={blocking}
        position={position}
        message={loadingMessage}
        size="md"
      />
    );
  }

  // Return null if neither loading nor error
  return null;
};

// Position mapping for consistency with LoadingAnimation
const positionMap = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
};

export default ErrorAndLoadingOverlay;