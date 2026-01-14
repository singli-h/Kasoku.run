'use client'

/**
 * FirstWorkoutSuccess
 *
 * Clean, minimal success screen.
 * Framer Motion for smooth entrance animations.
 */

import { motion } from 'framer-motion'
import { Check, Dumbbell, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface FirstWorkoutSuccessProps {
  blockName: string
  workoutsThisWeek: number
  firstSession: {
    name: string
    dayOfWeek: number
    exerciseCount: number
    estimatedDuration: number
  }
  onStartWorkout: () => void
  onViewBlock: () => void
  className?: string
}

export function FirstWorkoutSuccess({
  blockName,
  workoutsThisWeek,
  firstSession,
  onStartWorkout,
  onViewBlock,
  className,
}: FirstWorkoutSuccessProps) {
  const dayLabel = DAY_LABELS[firstSession.dayOfWeek]

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[80vh] px-4', className)}>
      {/* Animated success checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Check className="h-10 w-10 text-primary" strokeWidth={2.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Your Plan is Ready!
        </h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{blockName}</span> has been created
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {workoutsThisWeek} workouts ready for this week
        </p>
      </motion.div>

      {/* First Workout CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md"
      >
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={onStartWorkout}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold">Start Your First Workout</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{dayLabel}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{firstSession.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {firstSession.exerciseCount} exercises · ~{firstSession.estimatedDuration} min
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>This week</span>
                <span>0 / {workoutsThisWeek} completed</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-primary rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alternative action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewBlock}
          className="text-muted-foreground hover:text-foreground"
        >
          View Training Block
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>
    </div>
  )
}
