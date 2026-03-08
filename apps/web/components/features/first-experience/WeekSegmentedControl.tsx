'use client'

/**
 * WeekSegmentedControl (Option C)
 *
 * Compact pill-style week selector.
 * Disabled weeks show tooltip explaining why.
 */

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WeekSegmentedControlProps {
  totalWeeks: number
  selectedIndex: number
  approvedWeeks: number // How many weeks are approved (unlocked)
  onSelectWeek: (index: number) => void
  className?: string
}

export function WeekSegmentedControl({
  totalWeeks,
  selectedIndex,
  approvedWeeks,
  onSelectWeek,
  className,
}: WeekSegmentedControlProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i)

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('inline-flex rounded-lg bg-muted p-1', className)}>
        {weeks.map((weekIndex) => {
          const isLocked = weekIndex >= approvedWeeks
          const isSelected = weekIndex === selectedIndex

          const button = (
            <motion.button
              key={weekIndex}
              onClick={() => !isLocked && onSelectWeek(weekIndex)}
              disabled={isLocked}
              className={cn(
                'relative px-4 py-2 text-sm font-medium rounded-md transition-colors',
                'flex items-center gap-1.5',
                isSelected && !isLocked && 'text-foreground',
                !isSelected && !isLocked && 'text-muted-foreground hover:text-foreground',
                isLocked && 'text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              {isSelected && !isLocked && (
                <motion.div
                  layoutId="week-segment-active"
                  className="absolute inset-0 bg-background rounded-md shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Wk {weekIndex + 1}</span>
              {isLocked && <Lock className="relative z-10 h-3 w-3" />}
            </motion.button>
          )

          if (isLocked) {
            return (
              <Tooltip key={weekIndex}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Approve Week {approvedWeeks} first</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return button
        })}
      </div>
    </TooltipProvider>
  )
}
