"use client"

import { motion } from "framer-motion"
import { Timer, Zap, Activity, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SprintStat {
  id: string
  label: string
  value: string
  unit?: string
  change?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
    isPositive: boolean
  }
  subtitle?: string
}

interface SprintQuickStatsProps {
  stats: SprintStat[]
  className?: string
}

const statIcons: Record<string, React.ElementType> = {
  'best-time': Timer,
  'top-speed': Zap,
  'reaction': Activity,
  'sessions': Calendar,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

export function SprintQuickStats({ stats, className }: SprintQuickStatsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3",
        className
      )}
    >
      {stats.map((stat) => {
        const Icon = statIcons[stat.id] || Timer
        const TrendIcon = stat.change?.direction === 'up'
          ? TrendingUp
          : stat.change?.direction === 'down'
            ? TrendingDown
            : Minus

        return (
          <motion.div
            key={stat.id}
            variants={itemVariants}
            className={cn(
              "relative overflow-hidden rounded-lg",
              "bg-card border border-border/50",
              "p-4 transition-all duration-200",
              "hover:border-border hover:shadow-soft"
            )}
          >
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

            <div className="relative flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {stat.label}
                </p>

                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {stat.unit}
                    </span>
                  )}
                </div>

                {stat.change && (
                  <div className={cn(
                    "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                    stat.change.isPositive
                      ? "text-green-500"
                      : stat.change.direction === 'neutral'
                        ? "text-muted-foreground"
                        : "text-red-500"
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{stat.change.value}</span>
                  </div>
                )}

                {stat.subtitle && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                )}
              </div>

              <div className={cn(
                "flex-shrink-0 p-2 rounded-md",
                "bg-muted/50"
              )}>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/**
 * Default stats for demo/empty state
 */
export const defaultSprintStats: SprintStat[] = [
  {
    id: 'best-time',
    label: 'Best 40m',
    value: '--',
    unit: 's',
    subtitle: 'No data yet',
  },
  {
    id: 'top-speed',
    label: 'Top Speed',
    value: '--',
    unit: 'm/s',
    subtitle: 'No data yet',
  },
  {
    id: 'reaction',
    label: 'Avg Reaction',
    value: '--',
    unit: 's',
    subtitle: 'No data yet',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    value: '0',
    subtitle: 'this month',
  },
]
