"use client"

import { motion } from "framer-motion"
import { Info, Target, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  STRENGTH_LEVELS,
  STRENGTH_STANDARDS,
  getStrengthLevel,
  getNextTarget,
  formatWeight,
  type StrengthLevel,
} from "../../data/gym-benchmarks"

export interface LiftStats {
  exercise: string
  oneRM: number
  previousOneRM?: number
}

interface StrengthBenchmarkCardProps {
  lifts: LiftStats[]
  bodyweight: number
  gender?: 'male' | 'female'
  unit?: 'kg' | 'lbs'
  className?: string
}

export function StrengthBenchmarkCard({
  lifts,
  bodyweight,
  gender = 'male',
  unit = 'kg',
  className,
}: StrengthBenchmarkCardProps) {
  // Calculate overall strength level (based on average of main lifts)
  const calculateOverallLevel = (): StrengthLevel => {
    const mainLifts = ['Bench Press', 'Squat', 'Deadlift']
    const relevantLifts = lifts.filter(l => mainLifts.includes(l.exercise))

    if (relevantLifts.length === 0) return 'beginner'

    const levelScores: Record<StrengthLevel, number> = {
      beginner: 0,
      novice: 1,
      intermediate: 2,
      advanced: 3,
      elite: 4,
    }

    const avgScore = relevantLifts.reduce((acc, lift) => {
      const level = getStrengthLevel(lift.oneRM, bodyweight, lift.exercise, gender)
      return acc + levelScores[level]
    }, 0) / relevantLifts.length

    if (avgScore >= 3.5) return 'elite'
    if (avgScore >= 2.5) return 'advanced'
    if (avgScore >= 1.5) return 'intermediate'
    if (avgScore >= 0.5) return 'novice'
    return 'beginner'
  }

  const overallLevel = calculateOverallLevel()
  const levelConfig = STRENGTH_LEVELS[overallLevel]

  // Calculate progress to next level for each lift
  const getLiftProgress = (lift: LiftStats): {
    level: StrengthLevel
    progress: number
    nextTarget: number | null
    ratio: number
  } => {
    const level = getStrengthLevel(lift.oneRM, bodyweight, lift.exercise, gender)
    const standard = STRENGTH_STANDARDS.find(s => s.exercise === lift.exercise)
    if (!standard) return { level, progress: 0, nextTarget: null, ratio: 0 }

    const genderStandards = standard[gender]
    const currentRange = genderStandards[level]
    const ratio = lift.oneRM / bodyweight

    // Calculate progress within current level
    const rangeSize = currentRange.max - currentRange.min
    const position = ratio - currentRange.min
    const progress = rangeSize > 0 ? Math.min(100, Math.max(0, (position / rangeSize) * 100)) : 50

    const next = getNextTarget(lift.oneRM, bodyweight, lift.exercise, gender)

    return {
      level,
      progress,
      nextTarget: next?.target || null,
      ratio,
    }
  }

  const hasAnyData = lifts.length > 0

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Strength Standards</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  Compare your lifts against strength standards based on bodyweight ratios.
                  Standards based on Strength Level and NSCA guidelines.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasAnyData ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No lift data available
          </div>
        ) : (
          <div className="space-y-5">
            {/* Overall Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Overall Level
                </span>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    color: levelConfig.color,
                    borderColor: `${levelConfig.color}40`,
                    backgroundColor: `${levelConfig.color}10`,
                  }}
                >
                  {levelConfig.label}
                </Badge>
              </div>

              {/* Level Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div className="flex-1 bg-orange-500/30" />
                  <div className="flex-1 bg-yellow-500/30" />
                  <div className="flex-1 bg-blue-500/30" />
                  <div className="flex-1 bg-green-500/30" />
                  <div className="flex-1 bg-purple-500/30" />
                </div>
              </div>

              {/* Level Labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Beginner</span>
                <span>Novice</span>
                <span>Intermediate</span>
                <span>Advanced</span>
                <span>Elite</span>
              </div>
            </div>

            {/* Individual Lifts */}
            <div className="space-y-3">
              {lifts.map((lift, index) => {
                const liftProgress = getLiftProgress(lift)
                const liftLevelConfig = STRENGTH_LEVELS[liftProgress.level]

                return (
                  <motion.div
                    key={lift.exercise}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{lift.exercise}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                          style={{ color: liftLevelConfig.color }}
                        >
                          {liftLevelConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold tabular-nums">
                          {formatWeight(lift.oneRM, unit)}
                        </span>
                        <span className="text-muted-foreground">
                          ({liftProgress.ratio.toFixed(2)}x BW)
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <Progress
                        value={liftProgress.progress}
                        className="h-1.5"
                        style={{
                          // @ts-ignore -- Custom CSS variable
                          '--progress-background': liftLevelConfig.color,
                        }}
                      />
                    </div>

                    {liftProgress.nextTarget && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>Next:</span>
                        <span className="font-medium text-foreground">
                          {formatWeight(liftProgress.nextTarget, unit)}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span style={{ color: STRENGTH_LEVELS[
                          getNextTarget(lift.oneRM, bodyweight, lift.exercise, gender)?.level || 'novice'
                        ].color }}>
                          {getNextTarget(lift.oneRM, bodyweight, lift.exercise, gender)?.level}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Bodyweight Reference */}
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Bodyweight</span>
                <span className="font-medium tabular-nums">{formatWeight(bodyweight, unit)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
