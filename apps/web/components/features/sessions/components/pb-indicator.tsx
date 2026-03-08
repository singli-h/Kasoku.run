/*
<ai_context>
PBIndicator - Badge component showing new personal best achievement.
Displays trophy icon with optional animation.
Sizes: sm (small, for table cells), md (medium, default), lg (large, for celebrations).
</ai_context>
*/

"use client"

import { Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PBIndicatorProps {
  size?: "sm" | "md" | "lg"
  animate?: boolean
  showText?: boolean
  className?: string
}

export function PBIndicator({
  size = "md",
  animate = false,
  showText = false,
  className
}: PBIndicatorProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <Badge
      variant="default"
      className={cn(
        "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
        sizeClasses[size],
        "flex items-center justify-center rounded-full p-0",
        animate && "animate-bounce",
        className
      )}
      title="New Personal Best!"
    >
      <Trophy className={cn(iconSizes[size])} />
      {showText && size !== "sm" && (
        <span className="ml-1 text-xs font-bold">PB</span>
      )}
    </Badge>
  )
}
