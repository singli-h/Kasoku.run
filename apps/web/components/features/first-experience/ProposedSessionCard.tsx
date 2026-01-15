'use client'

/**
 * ProposedSessionCard
 *
 * Expandable session card with clean, minimal design.
 * Framer Motion for smooth expand/collapse.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, Dumbbell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProposedSession, ProposedExercise } from './types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ProposedSessionCardProps {
  session: ProposedSession
  defaultExpanded?: boolean
  index?: number
  className?: string
}

export function ProposedSessionCard({
  session,
  defaultExpanded = false,
  index = 0,
  className,
}: ProposedSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const dayLabel = DAY_LABELS[session.dayOfWeek]
  const exerciseCount = session.exercises.length
  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-stretch">
            {/* Day indicator */}
            <div className="w-14 flex flex-col items-center justify-center bg-primary/10 border-r">
              <span className="text-xs font-semibold text-primary py-4">
                {dayLabel}
              </span>
            </div>

            {/* Session info */}
            <div className="flex-1 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-semibold">{session.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {exerciseCount} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ~{session.estimatedDuration} min
                  </span>
                </div>
              </div>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t p-4 space-y-2">
                {session.exercises.map((exercise, idx) => (
                  <ExerciseRow
                    key={`${session.id}-${exercise.exerciseId}-${idx}`}
                    exercise={exercise}
                    index={idx}
                  />
                ))}

                {/* Summary */}
                <div className="pt-2 mt-2 border-t flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{totalSets} sets</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

interface ExerciseRowProps {
  exercise: ProposedExercise
  index: number
}

function ExerciseRow({ exercise, index }: ExerciseRowProps) {
  const setCount = exercise.sets.length
  const reps = exercise.sets[0]?.reps || 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-5">
          {index + 1}.
        </span>
        <span className="text-sm font-medium">{exercise.exerciseName}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        {setCount} × {reps}
      </span>
    </motion.div>
  )
}
