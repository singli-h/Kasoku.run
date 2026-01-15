'use client'

/**
 * WeekCarousel
 *
 * Full-width week selector with swipe support.
 * Clean, minimal design matching existing app style.
 */

import { useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProposedWeek } from './types'

interface WeekCarouselProps {
  weeks: ProposedWeek[]
  selectedIndex: number
  onSelectWeek: (index: number) => void
  className?: string
}

export function WeekCarousel({
  weeks,
  selectedIndex,
  onSelectWeek,
  className,
}: WeekCarouselProps) {
  const [isDragging, setIsDragging] = useState(false)

  const canGoLeft = selectedIndex > 0
  const canGoRight = selectedIndex < weeks.length - 1

  const handlePrev = () => {
    if (canGoLeft) onSelectWeek(selectedIndex - 1)
  }

  const handleNext = () => {
    if (canGoRight) onSelectWeek(selectedIndex + 1)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 50
    if (info.offset.x > threshold && canGoLeft) {
      onSelectWeek(selectedIndex - 1)
    } else if (info.offset.x < -threshold && canGoRight) {
      onSelectWeek(selectedIndex + 1)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={!canGoLeft}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dots */}
        <div className="flex gap-1.5">
          {weeks.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelectWeek(index)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === selectedIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={!canGoRight}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <WeekCard
              week={weeks[selectedIndex]}
              index={selectedIndex}
              total={weeks.length}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

interface WeekCardProps {
  week: ProposedWeek
  index: number
  total: number
}

function WeekCard({ week, index, total }: WeekCardProps) {
  const sessionCount = week.sessions.length
  const totalExercises = week.sessions.reduce((sum, s) => sum + s.exercises.length, 0)
  const totalSets = week.sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((eSum, e) => eSum + e.sets.length, 0), 0
  )

  return (
    <Card>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                Week {week.weekNumber} of {total}
              </span>
              {week.isDeload && (
                <Badge variant="secondary" className="text-xs">Deload</Badge>
              )}
            </div>
            <h2 className="text-xl font-bold">{week.name}</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-lg font-bold text-primary">{week.weekNumber}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{sessionCount}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{totalExercises}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{totalSets}</div>
            <div className="text-xs text-muted-foreground">Total Sets</div>
          </div>
        </div>

        {/* Session pills */}
        <div className="flex flex-wrap gap-2">
          {week.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm"
            >
              <Dumbbell className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{getDayLabel(session.dayOfWeek)}</span>
              <span className="font-medium">{session.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getDayLabel(dayOfWeek: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[dayOfWeek] || ''
}
