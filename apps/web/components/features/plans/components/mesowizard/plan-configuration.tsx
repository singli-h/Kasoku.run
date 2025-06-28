/**
 * MesoWizard - Step 2: Plan Configuration
 * Configure plan details including duration, intensity, goals, and athlete assignments
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Users, 
  ArrowLeft, 
  ArrowRight,
  Clock,
  Activity,
  Trophy,
  User,
  UserPlus,
  AlertCircle,
  Check
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Types
import type { PlanType } from "./plan-type-selection"

export interface PlanConfiguration {
  // Basic Information
  name: string
  description: string
  
  // Duration Settings
  duration: {
    weeks: number
    startDate: string
    endDate: string
  }
  
  // Intensity & Goals
  intensity: {
    level: number // 1-10 scale
    focusAreas: string[]
    primaryGoal: string
    secondaryGoals: string[]
  }
  
  // Athlete Assignment
  assignment: {
    type: 'individual' | 'group' | 'template'
    athleteIds: string[]
    groupIds: string[]
    isTemplate: boolean
  }
  
  // Advanced Settings
  advanced: {
    autoProgression: boolean
    deloadWeeks: boolean
    customizations: Record<string, any>
  }
}

interface PlanConfigurationProps {
  planType: PlanType
  configuration: PlanConfiguration | null
  onConfigurationChange: (config: PlanConfiguration) => void
  onNext: () => void
  onPrevious: () => void
  className?: string
}

// Configuration options based on plan type
const getPlanTypeConfig = (planType: PlanType) => {
  switch (planType) {
    case 'macrocycle':
      return {
        minWeeks: 12,
        maxWeeks: 52,
        defaultWeeks: 24,
        intensityRange: [3, 10],
        focusAreas: [
          'Endurance Base Building',
          'Strength Development',
          'Power Training', 
          'Competition Preparation',
          'Recovery & Maintenance',
          'Skill Development'
        ],
        primaryGoals: [
          'Competition Performance',
          'Long-term Athletic Development',
          'Injury Prevention',
          'Skill Mastery',
          'Physical Conditioning'
        ]
      }
    case 'mesocycle':
      return {
        minWeeks: 2,
        maxWeeks: 8,
        defaultWeeks: 4,
        intensityRange: [4, 9],
        focusAreas: [
          'Strength Building',
          'Endurance Improvement',
          'Speed Development',
          'Technique Refinement',
          'Recovery Block',
          'Peaking Phase'
        ],
        primaryGoals: [
          'Strength Gains',
          'Endurance Improvement',
          'Speed Development',
          'Technique Improvement',
          'Recovery & Regeneration'
        ]
      }
    case 'microcycle':
      return {
        minWeeks: 1,
        maxWeeks: 2,
        defaultWeeks: 1,
        intensityRange: [2, 8],
        focusAreas: [
          'Daily Consistency',
          'Skill Practice',
          'Conditioning Work',
          'Recovery Sessions',
          'Technique Drills',
          'Mobility Work'
        ],
        primaryGoals: [
          'Consistency Building',
          'Skill Practice',
          'Fitness Maintenance',
          'Technique Development',
          'Active Recovery'
        ]
      }
    default:
      return {
        minWeeks: 1,
        maxWeeks: 4,
        defaultWeeks: 2,
        intensityRange: [1, 10],
        focusAreas: [],
        primaryGoals: []
      }
  }
}

export function PlanConfiguration({ 
  planType, 
  configuration, 
  onConfigurationChange, 
  onNext, 
  onPrevious,
  className 
}: PlanConfigurationProps) {
  const planConfig = getPlanTypeConfig(planType)
  
  // Initialize configuration state
  const [config, setConfig] = useState<PlanConfiguration>(() => {
    if (configuration) return configuration
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + (planConfig.defaultWeeks * 7))
    
    return {
      name: '',
      description: '',
      duration: {
        weeks: planConfig.defaultWeeks,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      intensity: {
        level: Math.floor((planConfig.intensityRange[0] + planConfig.intensityRange[1]) / 2),
        focusAreas: [],
        primaryGoal: '',
        secondaryGoals: []
      },
      assignment: {
        type: 'individual',
        athleteIds: [],
        groupIds: [],
        isTemplate: false
      },
      advanced: {
        autoProgression: true,
        deloadWeeks: planType === 'macrocycle',
        customizations: {}
      }
    }
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update parent when config changes
  useEffect(() => {
    onConfigurationChange(config)
  }, [config, onConfigurationChange])

  // Update end date when weeks or start date changes
  useEffect(() => {
    if (config.duration.startDate && config.duration.weeks) {
      const startDate = new Date(config.duration.startDate)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + (config.duration.weeks * 7))
      
      setConfig(prev => ({
        ...prev,
        duration: {
          ...prev.duration,
          endDate: endDate.toISOString().split('T')[0]
        }
      }))
    }
  }, [config.duration.startDate, config.duration.weeks])

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!config.name.trim()) {
      newErrors.name = 'Plan name is required'
    }
    
    if (!config.intensity.primaryGoal) {
      newErrors.primaryGoal = 'Primary goal is required'
    }
    
    if (config.intensity.focusAreas.length === 0) {
      newErrors.focusAreas = 'At least one focus area is required'
    }
    
    if (config.duration.weeks < planConfig.minWeeks || config.duration.weeks > planConfig.maxWeeks) {
      newErrors.weeks = `Duration must be between ${planConfig.minWeeks} and ${planConfig.maxWeeks} weeks`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  // Update config helper
  const updateConfig = (updates: Partial<PlanConfiguration>) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Toggle focus area
  const toggleFocusArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      intensity: {
        ...prev.intensity,
        focusAreas: prev.intensity.focusAreas.includes(area)
          ? prev.intensity.focusAreas.filter(a => a !== area)
          : [...prev.intensity.focusAreas, area]
      }
    }))
  }

  // Toggle secondary goal
  const toggleSecondaryGoal = (goal: string) => {
    setConfig(prev => ({
      ...prev,
      intensity: {
        ...prev.intensity,
        secondaryGoals: prev.intensity.secondaryGoals.includes(goal)
          ? prev.intensity.secondaryGoals.filter(g => g !== goal)
          : [...prev.intensity.secondaryGoals, goal]
      }
    }))
  }

  const getIntensityLabel = (level: number) => {
    if (level <= 3) return 'Low Intensity'
    if (level <= 6) return 'Moderate Intensity'
    if (level <= 8) return 'High Intensity'
    return 'Maximum Intensity'
  }

  const getIntensityColor = (level: number) => {
    if (level <= 3) return 'text-green-600'
    if (level <= 6) return 'text-yellow-600'
    if (level <= 8) return 'text-orange-600'
    return 'text-red-600'
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
          Configure Your {planType.charAt(0).toUpperCase() + planType.slice(1)}
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Set up the details for your training plan including duration, intensity, and goals.
        </motion.p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Name and describe your training plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name *</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., Summer Competition Prep"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-description">Description</Label>
                <Textarea
                  id="plan-description"
                  placeholder="Describe the purpose and approach of this training plan..."
                  rows={3}
                  value={config.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Duration Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Duration & Timeline
              </CardTitle>
              <CardDescription>
                Set the length and schedule for your plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Duration: {config.duration.weeks} weeks</Label>
                <Slider
                  value={[config.duration.weeks]}
                  onValueChange={([weeks]) => 
                    setConfig(prev => ({
                      ...prev,
                      duration: { ...prev.duration, weeks }
                    }))
                  }
                  min={planConfig.minWeeks}
                  max={planConfig.maxWeeks}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{planConfig.minWeeks} weeks</span>
                  <span>{planConfig.maxWeeks} weeks</span>
                </div>
                {errors.weeks && (
                  <p className="text-sm text-red-600">{errors.weeks}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={config.duration.startDate}
                    onChange={(e) => 
                      setConfig(prev => ({
                        ...prev,
                        duration: { ...prev.duration, startDate: e.target.value }
                      }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={config.duration.endDate}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Intensity & Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Intensity & Goals
            </CardTitle>
            <CardDescription>
              Define the intensity level and training objectives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Intensity Level */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Intensity Level</Label>
                <Badge variant="outline" className={getIntensityColor(config.intensity.level)}>
                  {getIntensityLabel(config.intensity.level)} ({config.intensity.level}/10)
                </Badge>
              </div>
              <Slider
                value={[config.intensity.level]}
                onValueChange={([level]) => 
                  setConfig(prev => ({
                    ...prev,
                    intensity: { ...prev.intensity, level }
                  }))
                }
                min={planConfig.intensityRange[0]}
                max={planConfig.intensityRange[1]}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Maximum</span>
              </div>
            </div>

            <Separator />

            {/* Primary Goal */}
            <div className="space-y-2">
              <Label>Primary Goal *</Label>
              <Select
                value={config.intensity.primaryGoal}
                onValueChange={(value) => 
                  setConfig(prev => ({
                    ...prev,
                    intensity: { ...prev.intensity, primaryGoal: value }
                  }))
                }
              >
                <SelectTrigger className={errors.primaryGoal ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your primary training goal" />
                </SelectTrigger>
                <SelectContent>
                  {planConfig.primaryGoals.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryGoal && (
                <p className="text-sm text-red-600">{errors.primaryGoal}</p>
              )}
            </div>

            {/* Focus Areas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Focus Areas *</Label>
                <Badge variant="outline">
                  {config.intensity.focusAreas.length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {planConfig.focusAreas.map((area) => (
                  <Button
                    key={area}
                    variant={config.intensity.focusAreas.includes(area) ? "default" : "outline"}
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => toggleFocusArea(area)}
                  >
                    <div className="flex items-center gap-2">
                      {config.intensity.focusAreas.includes(area) && (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="text-sm">{area}</span>
                    </div>
                  </Button>
                ))}
              </div>
              {errors.focusAreas && (
                <p className="text-sm text-red-600">{errors.focusAreas}</p>
              )}
            </div>

            {/* Secondary Goals */}
            <div className="space-y-3">
              <Label>Secondary Goals (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {planConfig.primaryGoals
                  .filter(goal => goal !== config.intensity.primaryGoal)
                  .map((goal) => (
                    <Button
                      key={goal}
                      variant={config.intensity.secondaryGoals.includes(goal) ? "default" : "outline"}
                      size="sm"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => toggleSecondaryGoal(goal)}
                    >
                      <div className="flex items-center gap-2">
                        {config.intensity.secondaryGoals.includes(goal) && (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="text-sm">{goal}</span>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assignment Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assignment & Usage
            </CardTitle>
            <CardDescription>
              Define how this plan will be used and assigned
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={config.assignment.type === 'individual' ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => 
                  setConfig(prev => ({
                    ...prev,
                    assignment: { ...prev.assignment, type: 'individual' }
                  }))
                }
              >
                <User className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Individual</div>
                  <div className="text-xs text-muted-foreground">Single athlete</div>
                </div>
              </Button>
              
              <Button
                variant={config.assignment.type === 'group' ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => 
                  setConfig(prev => ({
                    ...prev,
                    assignment: { ...prev.assignment, type: 'group' }
                  }))
                }
              >
                <UserPlus className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Group</div>
                  <div className="text-xs text-muted-foreground">Multiple athletes</div>
                </div>
              </Button>
              
              <Button
                variant={config.assignment.type === 'template' ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => 
                  setConfig(prev => ({
                    ...prev,
                    assignment: { ...prev.assignment, type: 'template' }
                  }))
                }
              >
                <Trophy className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Template</div>
                  <div className="text-xs text-muted-foreground">Reusable plan</div>
                </div>
              </Button>
            </div>

            {/* Template Option */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Save as Template</div>
                <div className="text-sm text-muted-foreground">
                  Make this plan reusable for future athletes
                </div>
              </div>
              <Switch
                checked={config.assignment.isTemplate}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    assignment: { ...prev.assignment, isTemplate: checked }
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Configure advanced training features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Auto Progression</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically adjust intensity and volume over time
                  </div>
                </div>
                <Switch
                  checked={config.advanced.autoProgression}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({
                      ...prev,
                      advanced: { ...prev.advanced, autoProgression: checked }
                    }))
                  }
                />
              </div>

              {planType === 'macrocycle' && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Include Deload Weeks</div>
                    <div className="text-sm text-muted-foreground">
                      Add planned recovery weeks throughout the macrocycle
                    </div>
                  </div>
                  <Switch
                    checked={config.advanced.deloadWeeks}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, deloadWeeks: checked }
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above before continuing.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Previous Step
        </Button>
        
        <div className="text-center">
          <Badge variant="outline">Step 2 of 4</Badge>
        </div>
        
        <Button onClick={handleNext} className="flex items-center gap-2">
          Next Step
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}