/**
 * MesoWizard - Step 4: Plan Review & Finalization
 * Review complete plan details, perform validation, and submit the final training plan
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  Target, 
  Dumbbell, 
  TrendingUp,
  FileText,
  Edit,
  Eye,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  Trophy,
  User,
  Users
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Types
import type { PlanType } from "./plan-type-selection"
import type { PlanConfiguration } from "./plan-configuration"
import type { SessionPlan } from "./session-planning"

interface PlanReviewProps {
  planType: PlanType
  configuration: PlanConfiguration
  sessionPlan: SessionPlan
  onSubmit: () => void
  onPrevious: () => void
  onEdit: (step: number) => void
  className?: string
}

interface ValidationCheck {
  id: string
  title: string
  description: string
  status: 'passed' | 'warning' | 'failed'
  details?: string
}

// Helper function to calculate plan statistics
const calculatePlanStats = (sessionPlan: SessionPlan) => {
  const totalSessions = sessionPlan.sessions.length
  const sessionsWithExercises = sessionPlan.sessions.filter(s => s.exercises.length > 0)
  const totalExercises = sessionsWithExercises.reduce((acc, session) => acc + session.exercises.length, 0)
  const totalDuration = sessionsWithExercises.reduce((acc, session) => acc + session.estimatedDuration, 0)
  const averageDuration = sessionsWithExercises.length > 0 ? Math.round(totalDuration / sessionsWithExercises.length) : 0
  
  // Calculate exercise type distribution
  const exerciseTypes = new Map<string, number>()
  sessionsWithExercises.forEach(session => {
    session.exercises.forEach(exercise => {
      const type = exercise.exercise.exercise_type?.type || 'Unknown'
      exerciseTypes.set(type, (exerciseTypes.get(type) || 0) + 1)
    })
  })

  // Calculate weekly structure
  const weeksWithSessions = new Set(sessionsWithExercises.map(s => s.week)).size
  const avgSessionsPerWeek = weeksWithSessions > 0 ? Math.round(sessionsWithExercises.length / weeksWithSessions) : 0

  return {
    totalSessions,
    activeSessions: sessionsWithExercises.length,
    totalExercises,
    totalDuration,
    averageDuration,
    exerciseTypes: Array.from(exerciseTypes.entries()),
    weeksWithSessions,
    avgSessionsPerWeek
  }
}

// Helper function to validate the complete plan
const validatePlan = (
  planType: PlanType, 
  configuration: PlanConfiguration, 
  sessionPlan: SessionPlan
): ValidationCheck[] => {
  const checks: ValidationCheck[] = []
  const stats = calculatePlanStats(sessionPlan)

  // Basic plan information validation
  checks.push({
    id: 'plan-name',
    title: 'Plan Name',
    description: 'Plan has a descriptive name',
    status: configuration.name.trim().length >= 3 ? 'passed' : 'failed',
    details: configuration.name.trim().length >= 3 
      ? `Plan name: "${configuration.name}"` 
      : 'Plan name must be at least 3 characters long'
  })

  // Duration validation
  const expectedMinDuration = planType === 'macrocycle' ? 12 : planType === 'mesocycle' ? 4 : 1
  checks.push({
    id: 'duration',
    title: 'Plan Duration',
    description: `Duration is appropriate for ${planType}`,
    status: configuration.duration.weeks >= expectedMinDuration ? 'passed' : 'warning',
    details: `${configuration.duration.weeks} weeks (recommended minimum: ${expectedMinDuration})`
  })

  // Session coverage validation
  const expectedMinSessions = configuration.duration.weeks * 2 // Minimum 2 sessions per week
  checks.push({
    id: 'session-coverage',
    title: 'Session Coverage',
    description: 'Adequate number of training sessions',
    status: stats.activeSessions >= expectedMinSessions ? 'passed' : 
           stats.activeSessions >= Math.floor(expectedMinSessions * 0.7) ? 'warning' : 'failed',
    details: `${stats.activeSessions} sessions planned (${stats.avgSessionsPerWeek} per week average)`
  })

  // Exercise variety validation
  checks.push({
    id: 'exercise-variety',
    title: 'Exercise Variety',
    description: 'Diverse exercise selection',
    status: stats.exerciseTypes.length >= 3 ? 'passed' : 
           stats.exerciseTypes.length >= 2 ? 'warning' : 'failed',
    details: `${stats.exerciseTypes.length} different exercise types included`
  })

  // Session duration validation
  const idealMinDuration = 30
  const idealMaxDuration = 120
  const avgInRange = stats.averageDuration >= idealMinDuration && stats.averageDuration <= idealMaxDuration
  checks.push({
    id: 'session-duration',
    title: 'Session Duration',
    description: 'Sessions have appropriate duration',
    status: avgInRange ? 'passed' : 'warning',
    details: `Average session duration: ${stats.averageDuration} minutes (ideal: ${idealMinDuration}-${idealMaxDuration}min)`
  })

  // Goals alignment validation
  checks.push({
    id: 'goals-alignment',
    title: 'Goals Alignment',
    description: 'Plan aligns with stated goals',
    status: configuration.intensity.primaryGoal && configuration.intensity.focusAreas.length > 0 ? 'passed' : 'warning',
    details: `Primary goal: ${configuration.intensity.primaryGoal}, Focus areas: ${configuration.intensity.focusAreas.length}`
  })

  return checks
}

export function PlanReview({ 
  planType, 
  configuration, 
  sessionPlan, 
  onSubmit, 
  onPrevious, 
  onEdit,
  className 
}: PlanReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>([])
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [showValidationDetails, setShowValidationDetails] = useState(false)

  // Calculate plan statistics
  const stats = calculatePlanStats(sessionPlan)

  // Run validation on component mount and when data changes
  useEffect(() => {
    const checks = validatePlan(planType, configuration, sessionPlan)
    setValidationChecks(checks)
  }, [planType, configuration, sessionPlan])

  // Handle final submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate submission process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    onSubmit()
  }

  // Toggle session expansion
  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  // Get validation status summary
  const validationSummary = {
    passed: validationChecks.filter(c => c.status === 'passed').length,
    warnings: validationChecks.filter(c => c.status === 'warning').length,
    failed: validationChecks.filter(c => c.status === 'failed').length,
    total: validationChecks.length
  }

  const canSubmit = validationSummary.failed === 0

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
          Review Your Training Plan
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Review all details, check validation status, and finalize your comprehensive training plan.
        </motion.p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Validation & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Validation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {canSubmit ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                Validation Status
              </CardTitle>
              <CardDescription>
                Plan quality and completeness checks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{validationSummary.passed}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{validationSummary.warnings}</div>
                  <div className="text-xs text-muted-foreground">Warnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{validationSummary.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              <Progress 
                value={(validationSummary.passed / validationSummary.total) * 100} 
                className="h-2"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValidationDetails(!showValidationDetails)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showValidationDetails ? 'Hide' : 'Show'} Details
              </Button>

              {showValidationDetails && (
                <div className="space-y-2">
                  {validationChecks.map((check) => (
                    <div key={check.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      {check.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />}
                      {check.status === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />}
                      {check.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{check.title}</div>
                        <div className="text-xs text-muted-foreground">{check.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Plan Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{configuration.duration.weeks} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{stats.activeSessions} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span>{stats.totalExercises} exercises</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{stats.averageDuration}min avg</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Exercise Types</div>
                {stats.exerciseTypes.slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{type}</span>
                    <span>{count}</span>
                  </div>
                ))}
                {stats.exerciseTypes.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{stats.exerciseTypes.length - 3} more types
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {configuration.name}
                      </CardTitle>
                      <CardDescription>
                        {planType.charAt(0).toUpperCase() + planType.slice(1)} Training Plan
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onEdit(1)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {configuration.description && (
                    <div>
                      <div className="font-medium text-sm mb-1">Description</div>
                      <p className="text-sm text-muted-foreground">{configuration.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-sm mb-2">Duration</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{configuration.duration.weeks} weeks</span>
                      </div>
                      {configuration.duration.startDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Starts: {new Date(configuration.duration.startDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm mb-2">Intensity</div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{configuration.intensity.level}/10</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-sm mb-2">Goals & Focus</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{configuration.intensity.primaryGoal}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {configuration.intensity.focusAreas.map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-sm mb-2">Assignment</div>
                    <div className="flex items-center gap-2">
                      {configuration.assignment.type === 'individual' && <User className="h-4 w-4 text-muted-foreground" />}
                      {configuration.assignment.type === 'group' && <Users className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm capitalize">{configuration.assignment.type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Training Sessions</h3>
                <Button variant="outline" size="sm" onClick={() => onEdit(2)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Sessions
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {sessionPlan.sessions
                    .filter(session => session.exercises.length > 0)
                    .map((session) => (
                      <Card key={session.id}>
                        <Collapsible>
                          <CollapsibleTrigger
                            onClick={() => toggleSessionExpansion(session.id)}
                            className="w-full"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between w-full">
                                <div className="text-left">
                                  <CardTitle className="text-base">{session.name}</CardTitle>
                                  <CardDescription>
                                    Week {session.week}, Day {session.day} • {session.exercises.length} exercises • {session.estimatedDuration}min
                                  </CardDescription>
                                </div>
                                {expandedSessions.has(session.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              {session.description && (
                                <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                              )}
                              <div className="space-y-2">
                                {session.exercises.map((exercise, index) => (
                                  <div key={exercise.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{exercise.exercise.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {exercise.sets.length} sets × {exercise.sets[0]?.reps || 0} reps
                                        {exercise.supersetId && (
                                          <Badge variant="outline" className="ml-2 text-xs">Superset</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {session.notes && (
                                <div className="mt-3 p-2 rounded-lg bg-muted/30">
                                  <div className="text-xs font-medium mb-1">Notes:</div>
                                  <div className="text-xs text-muted-foreground">{session.notes}</div>
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-progression</span>
                      <Badge variant={configuration.advanced.autoProgression ? "default" : "secondary"}>
                        {configuration.advanced.autoProgression ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {planType === 'macrocycle' && configuration.advanced.deloadWeeks && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Deload weeks</span>
                        <span className="text-sm text-muted-foreground">Every {configuration.advanced.deloadWeeks} weeks</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Plan Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Type</span>
                      <span className="capitalize">{planType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sessions</span>
                      <span>{stats.activeSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Training Time</span>
                      <span>{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sessions per Week</span>
                      <span>{stats.avgSessionsPerWeek}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Validation Alerts */}
      {validationSummary.failed > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your plan has {validationSummary.failed} critical issue(s) that must be resolved before submission.
            Please review the validation details above.
          </AlertDescription>
        </Alert>
      )}

      {validationSummary.warnings > 0 && validationSummary.failed === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your plan has {validationSummary.warnings} warning(s). You can still submit, but consider reviewing these items.
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
          <Badge variant="outline">Step 4 of 4</Badge>
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!canSubmit || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Plan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Training Plan
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 