/**
 * MesoWizard - Step 1: Plan Type Selection
 * Allows users to select between Macrocycle, Mesocycle, and Microcycle plans
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Calendar, 
  CalendarRange, 
  CalendarDays,
  Info,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  TrendingUp
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type PlanType = 'macrocycle' | 'mesocycle' | 'microcycle'

interface PlanTypeOption {
  type: PlanType
  title: string
  description: string
  duration: string
  icon: React.ComponentType<any>
  features: string[]
  bestFor: string[]
  complexity: 'Beginner' | 'Intermediate' | 'Advanced'
  timeCommitment: string
  color: string
}

const planTypeOptions: PlanTypeOption[] = [
  {
    type: 'macrocycle',
    title: 'Macrocycle',
    description: 'Long-term training periodization spanning multiple months to a full year',
    duration: '3-12 months',
    icon: CalendarRange,
    features: [
      'Complete periodization structure',
      'Multiple training phases',
      'Peak performance targeting',
      'Progressive overload planning',
      'Competition scheduling'
    ],
    bestFor: [
      'Competitive athletes',
      'Long-term goal achievement',
      'Comprehensive training plans',
      'Coaches managing teams'
    ],
    complexity: 'Advanced',
    timeCommitment: 'High',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    type: 'mesocycle',
    title: 'Mesocycle',
    description: 'Medium-term training blocks focused on specific adaptations and goals',
    duration: '2-8 weeks',
    icon: Calendar,
    features: [
      'Targeted training adaptations',
      'Progressive difficulty',
      'Phase-specific goals',
      'Structured progressions',
      'Recovery planning'
    ],
    bestFor: [
      'Skill development',
      'Strength building phases',
      'Endurance improvement',
      'Specific adaptations'
    ],
    complexity: 'Intermediate',
    timeCommitment: 'Medium',
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    type: 'microcycle',
    title: 'Microcycle',
    description: 'Short-term weekly training plans with specific daily sessions',
    duration: '1 week',
    icon: CalendarDays,
    features: [
      'Daily session planning',
      'Weekly structure',
      'Quick implementation',
      'Flexible scheduling',
      'Immediate feedback'
    ],
    bestFor: [
      'Weekly planning',
      'Quick starts',
      'Trial programs',
      'Beginner athletes'
    ],
    complexity: 'Beginner',
    timeCommitment: 'Low',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  }
]

interface PlanTypeSelectionProps {
  onSelect: (planType: PlanType) => void
  onCancel?: () => void
  className?: string
}

export function PlanTypeSelection({
  onSelect,
  onCancel,
  className
}: PlanTypeSelectionProps) {
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null)
  const [hoveredType, setHoveredType] = useState<PlanType | null>(null)

  const handleCardClick = (planType: PlanType) => {
    setSelectedPlanType(planType)
    onSelect(planType)
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeCommitmentIcon = (timeCommitment: string) => {
    switch (timeCommitment) {
      case 'Low': return <Clock className="h-4 w-4 text-green-600" />
      case 'Medium': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'High': return <Clock className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h2 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Choose Your Training Plan Type
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Select the type of training plan that best fits your goals and experience level. 
          Each plan type offers different levels of detail and time commitment.
        </motion.p>
      </div>

      {/* Plan Type Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {planTypeOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = selectedPlanType === option.type
          const isHovered = hoveredType === option.type

          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              onHoverStart={() => setHoveredType(option.type)}
              onHoverEnd={() => setHoveredType(null)}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-300 h-full",
                  option.color,
                  isSelected && "ring-2 ring-primary ring-offset-2 shadow-lg",
                  isHovered && !isSelected && "shadow-md transform scale-[1.02]"
                )}
                onClick={() => handleCardClick(option.type)}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Icon className={cn(
                      "h-8 w-8 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {option.description}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getComplexityColor(option.complexity)}>
                      {option.complexity}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getTimeCommitmentIcon(option.timeCommitment)}
                      <span className="text-sm text-muted-foreground">{option.timeCommitment}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration: {option.duration}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Key Features
                      </h4>
                      <ul className="text-xs space-y-1">
                        {option.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                            {feature}
                          </li>
                        ))}
                        {option.features.length > 3 && (
                          <li className="text-muted-foreground">
                            +{option.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Best For
                      </h4>
                      <ul className="text-xs space-y-1">
                        {option.bestFor.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Selection Info */}
      {selectedPlanType && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="bg-muted/50 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold">
                You've selected: {planTypeOptions.find(opt => opt.type === selectedPlanType)?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {planTypeOptions.find(opt => opt.type === selectedPlanType)?.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {planTypeOptions.find(opt => opt.type === selectedPlanType)?.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getComplexityColor(
                    planTypeOptions.find(opt => opt.type === selectedPlanType)?.complexity || 'Beginner'
                  )}>
                    {planTypeOptions.find(opt => opt.type === selectedPlanType)?.complexity}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 