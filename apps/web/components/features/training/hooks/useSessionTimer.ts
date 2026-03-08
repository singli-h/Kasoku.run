"use client"

import { useState, useEffect, useCallback } from "react"

interface UseSessionTimerOptions {
  initialSeconds?: number
  autoStart?: boolean
}

interface UseSessionTimerReturn {
  seconds: number
  isRunning: boolean
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  setSeconds: (seconds: number) => void
  formattedTime: string
}

/**
 * useSessionTimer - Hook for managing workout session timer
 *
 * Features:
 * - Start/pause/reset controls
 * - Formatted time display
 * - Persistence ready (can be extended to save to localStorage/DB)
 */
export function useSessionTimer({
  initialSeconds = 0,
  autoStart = false
}: UseSessionTimerOptions = {}): UseSessionTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const toggle = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const reset = useCallback(() => {
    setSeconds(0)
    setIsRunning(false)
  }, [])

  const formattedTime = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  return {
    seconds,
    isRunning,
    start,
    pause,
    toggle,
    reset,
    setSeconds,
    formattedTime
  }
}
