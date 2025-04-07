"use client"

import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

/**
 * Modern speed/lightning-inspired loading animation component
 * Features a clean, minimal design with blue and purple theme
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional classes to apply to the container
 * @param {string} [props.size="md"] - Size of the loading animation (sm, md, lg)
 * @param {boolean} [props.fullScreen=false] - Whether to display the animation fullscreen
 * @param {string} [props.message] - Optional loading message to display
 * @param {string} [props.position="top-right"] - Position when not fullscreen (top-right, top-left, bottom-right, bottom-left, center)
 * @param {boolean} [props.blocking=false] - Whether the loading overlay should block user interaction
 */
export const LoadingAnimation = ({
  className,
  size = "md",
  fullScreen = false,
  message,
  position = "top-right",
  blocking = false,
  ...props
}) => {
  // Size mapping
  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  }

  // Position mapping (when not fullscreen)
  const positionMap = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  }

  // Selected size
  const dimensions = sizeMap[size] || sizeMap.md
  
  // Position class
  const positionClass = positionMap[position] || positionMap["top-right"]

  // The actual loading animation - simplified lightning bolt design
  const loadingAnimation = (
    <div className={cn("relative flex items-center justify-center", dimensions)}>
      {/* Background circle with gradient */}
      <motion.div
        className="absolute w-full h-full rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20"
        animate={{
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      {/* Spinning lightning bolt */}
      <motion.div
        className="w-3/4 h-3/4"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          ease: "linear",
          repeat: Infinity
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.path
            d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            stroke="url(#blue-purple-lightning)"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{ 
              duration: 1.5, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
          />
          <defs>
            <linearGradient id="blue-purple-lightning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )

  // Display loading message with fade-in effect
  const loadingText = message && (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="whitespace-nowrap text-center font-medium text-sm bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
    >
      {message}
    </motion.p>
  )

  // If fullScreen is true but not blocking
  if (fullScreen && !blocking) {
    return (
      <motion.div 
        className={`fixed ${positionClass} z-40`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center p-4 bg-white/10 dark:bg-gray-900/50 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
          {loadingAnimation}
          {message && <div className="mt-2">{loadingText}</div>}
        </div>
      </motion.div>
    )
  }
  
  // If fullScreen and blocking
  if (fullScreen && blocking) {
    return (
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center p-4 bg-white/10 dark:bg-gray-900/50 rounded-lg shadow-lg backdrop-blur-sm border border-white/10"
        >
          {loadingAnimation}
          {message && <div className="mt-2">{loadingText}</div>}
        </motion.div>
      </div>
    )
  }

  // Regular loading animation
  return (
    <div className={cn("flex flex-col items-center", className)} {...props}>
      {loadingAnimation}
      {message && <div className="mt-2">{loadingText}</div>}
    </div>
  )
} 