"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, max = 100, ...props }, ref) => {
  const percentage = value != null ? Math.min(Math.max(0, value), max) : 0
  const calculatedValue = (percentage / max) * 100
  
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={percentage}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - calculatedValue}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress } 