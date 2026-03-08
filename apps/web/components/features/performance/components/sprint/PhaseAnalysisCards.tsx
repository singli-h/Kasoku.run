"use client"

import { motion } from "framer-motion"
import { Zap, Gauge, Battery, Rocket, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  SPRINT_PHASES,
  SHORT_SPRINT_PHASES,
  PERFORMANCE_PARAMETERS,
  calculatePhaseScore,
  formatSprintTime,
} from "../../data/sprint-benchmarks"

export interface PhaseData {
  phaseId: string
  time: number
  targetTime?: number
  score?: number
}

interface PhaseAnalysisCardsProps {
  phases: PhaseData[]
  targetStandard?: '10.00' | '11.00'
  className?: string
}

// Icons for all phase types
const phaseIcons: Record<string, React.ElementType> = {
  // Short sprint phases
  initialAccel: Rocket,
  mainAccel: TrendingUp,
  // Long sprint phases
  acceleration: Zap,
  maxVelocity: Gauge,
  deceleration: Battery,
}

// Colors for all phase types
const phaseColors: Record<string, { bg: string; text: string; progress: string }> = {
  // Short sprint phases
  initialAccel: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    progress: 'bg-blue-500',
  },
  mainAccel: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    progress: 'bg-purple-500',
  },
  // Long sprint phases
  acceleration: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    progress: 'bg-blue-500',
  },
  maxVelocity: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    progress: 'bg-purple-500',
  },
  deceleration: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    progress: 'bg-orange-500',
  },
}

// Map phase IDs to parameter keys for benchmark comparison
const phaseParameterMap: Record<string, string> = {
  // Short sprint phases
  initialAccel: 'phase0_20',
  mainAccel: 'phase20_40',
  // Long sprint phases
  acceleration: 'phase0_40',
  maxVelocity: 'phase40_80',
  deceleration: 'phase80_100',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

export function PhaseAnalysisCards({
  phases,
  targetStandard = '11.00',
  className,
}: PhaseAnalysisCardsProps) {
  // Determine which phase set to use based on available data
  const isShortSprint = phases.some(p => p.phaseId === 'initialAccel' || p.phaseId === 'mainAccel')
  const phaseConfigs = isShortSprint ? SHORT_SPRINT_PHASES : SPRINT_PHASES

  const getPhaseConfig = (phaseId: string) => {
    return [...SPRINT_PHASES, ...SHORT_SPRINT_PHASES].find(p => p.id === phaseId)
  }

  const getParameterKey = (phaseId: string): string => {
    return phaseParameterMap[phaseId] || 'phase0_40'
  }

  const getTargetTime = (phaseId: string): { min: number; max: number } | null => {
    const paramKey = getParameterKey(phaseId)
    const param = PERFORMANCE_PARAMETERS[paramKey]
    if (!param) return null
    return param.standards[targetStandard]
  }

  const getScoreLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-500' }
    if (score >= 75) return { label: 'Good', color: 'text-blue-500' }
    if (score >= 60) return { label: 'Developing', color: 'text-orange-500' }
    return { label: 'Needs Work', color: 'text-red-500' }
  }

  const getFocusAdvice = (phaseId: string, score: number): string => {
    const config = getPhaseConfig(phaseId)
    if (!config) return ''

    if (score >= 85) return 'Maintain current performance'
    if (score >= 70) return config.focusAreas[0]
    return config.focusAreas.slice(0, 2).join(', ')
  }

  // Only show phases that have data
  const phasesWithData = phases.filter(p => p.time > 0)

  if (phasesWithData.length === 0) {
    return null // Don't render if no phase data
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid gap-3",
        phasesWithData.length === 1 ? "grid-cols-1" :
        phasesWithData.length === 2 ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1 md:grid-cols-3",
        className
      )}
    >
      {phasesWithData.map((phaseData) => {
        const config = getPhaseConfig(phaseData.phaseId)
        if (!config) return null

        const Icon = phaseIcons[phaseData.phaseId] || Zap
        const colors = phaseColors[phaseData.phaseId] || phaseColors.acceleration
        const target = getTargetTime(phaseData.phaseId)

        // Calculate score
        const paramKey = getParameterKey(phaseData.phaseId)
        const score = calculatePhaseScore(phaseData.time, paramKey, targetStandard)

        const scoreInfo = getScoreLabel(score)
        const advice = getFocusAdvice(phaseData.phaseId, score)

        return (
          <motion.div key={phaseData.phaseId} variants={cardVariants}>
            <Card className="h-full border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", colors.bg)}>
                      <Icon className={cn("h-4 w-4", colors.text)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{config.shortLabel}</h3>
                      <p className="text-xs text-muted-foreground">
                        {config.label.replace(config.shortLabel + ' ', '')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Display */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {formatSprintTime(phaseData.time)}
                    </span>
                    {target && (
                      <span className="text-xs text-muted-foreground">
                        target: {formatSprintTime((target.min + target.max) / 2)}
                        <span className="text-[9px] opacity-60 ml-0.5" title="Includes reaction time">(+RT)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-medium", scoreInfo.color)}>
                      {scoreInfo.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {Math.round(score)}%
                    </span>
                  </div>

                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", colors.progress)}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(score, 100)}%` }}
                      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Advice */}
                {advice && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    Focus: {advice}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
