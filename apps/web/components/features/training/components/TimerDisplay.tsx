"use client"

import { cn } from "@/lib/utils"

export interface TimerDisplayProps {
  seconds: number
  size?: "sm" | "lg"
}

/**
 * TimerDisplay - Format and display elapsed time
 */
export function TimerDisplay({ seconds, size = "lg" }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

  return (
    <div className={cn("font-mono font-bold text-primary", size === "lg" ? "text-2xl" : "text-xl")}>
      {formatted}
    </div>
  )
}
