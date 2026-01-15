'use client'

/**
 * PlanApprovalBar
 *
 * Clean, minimal approval bar matching existing app style.
 * Framer Motion for subtle interactions.
 */

import { motion } from 'framer-motion'
import { Bot, MessageCircle, Check, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlanApprovalBarProps {
  totalWeeks: number
  workoutsPerWeek: number
  totalExercises: number
  isApplying?: boolean
  onChat: () => void
  onApply: () => void
  className?: string
}

export function PlanApprovalBar({
  totalWeeks,
  workoutsPerWeek,
  totalExercises,
  isApplying = false,
  onChat,
  onApply,
  className,
}: PlanApprovalBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('border-primary/20 bg-primary/5', className)}>
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Your AI Training Plan</h3>
              <p className="text-sm text-muted-foreground">Ready for review</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
            <span className="font-medium text-foreground">{totalWeeks}</span> weeks
            <span className="text-muted-foreground/50">·</span>
            <span className="font-medium text-foreground">{workoutsPerWeek}</span> workouts/week
            <span className="text-muted-foreground/50">·</span>
            <span className="font-medium text-foreground">{totalExercises}</span> exercises
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onChat}
              disabled={isApplying}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>

            <Button
              onClick={onApply}
              disabled={isApplying}
              className="flex-1"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
