'use client'

/**
 * WeekStepper (Option D)
 *
 * Vertical stepper with expandable weeks.
 * Locked weeks are dimmed with tooltip.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProposedSessionCard } from './ProposedSessionCard'
import type { ProposedWeek } from './types'

interface WeekStepperProps {
  weeks: ProposedWeek[]
  selectedIndex: number
  approvedWeeks: number
  onSelectWeek: (index: number) => void
  className?: string
}

export function WeekStepper({
  weeks,
  selectedIndex,
  approvedWeeks,
  onSelectWeek,
  className,
}: WeekStepperProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('space-y-2', className)}>
        {weeks.map((week, index) => {
          const isLocked = index >= approvedWeeks
          const isSelected = index === selectedIndex
          const isApproved = index < approvedWeeks - 1 || (index < approvedWeeks && approvedWeeks > 1)

          return (
            <WeekStepItem
              key={week.weekNumber}
              week={week}
              index={index}
              isSelected={isSelected}
              isLocked={isLocked}
              isApproved={isApproved && index < selectedIndex}
              approvedWeeks={approvedWeeks}
              onSelect={() => !isLocked && onSelectWeek(index)}
            />
          )
        })}
      </div>
    </TooltipProvider>
  )
}

interface WeekStepItemProps {
  week: ProposedWeek
  index: number
  isSelected: boolean
  isLocked: boolean
  isApproved: boolean
  approvedWeeks: number
  onSelect: () => void
}

function WeekStepItem({
  week,
  index,
  isSelected,
  isLocked,
  isApproved,
  approvedWeeks,
  onSelect,
}: WeekStepItemProps) {
  const stepButton = (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={cn(
        'w-full text-left transition-colors rounded-lg border',
        isSelected && 'border-primary bg-primary/5',
        !isSelected && !isLocked && 'border-border hover:border-primary/50 hover:bg-muted/50',
        isLocked && 'border-border/50 cursor-not-allowed opacity-50'
      )}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Step indicator */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
            isSelected && 'bg-primary text-primary-foreground',
            isApproved && !isSelected && 'bg-primary/20 text-primary',
            !isSelected && !isApproved && !isLocked && 'bg-muted text-muted-foreground',
            isLocked && 'bg-muted/50 text-muted-foreground/50'
          )}
        >
          {isApproved && !isSelected ? (
            <Check className="h-4 w-4" />
          ) : isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            index + 1
          )}
        </div>

        {/* Week info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-semibold',
              isLocked && 'text-muted-foreground/50'
            )}>
              Week {week.weekNumber}
            </span>
            {week.isDeload && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Deload
              </span>
            )}
          </div>
          <p className={cn(
            'text-sm',
            isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground'
          )}>
            {week.name} · {week.sessions.length} sessions
          </p>
        </div>

        {/* Expand indicator for selected */}
        {isSelected && (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 180 }}
            className="text-muted-foreground"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        )}
      </div>

      {/* Expanded sessions */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {week.sessions.map((session, sessionIndex) => (
                <ProposedSessionCard
                  key={session.id}
                  session={session}
                  defaultExpanded={sessionIndex === 0}
                  index={sessionIndex}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{stepButton}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p>Approve Week {approvedWeeks} first</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return stepButton
}
