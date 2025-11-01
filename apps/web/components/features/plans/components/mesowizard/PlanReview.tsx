/**
 * MesoWizard - Step 4: Review and Submit
 * Final review before creating the plan
 */

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Loader2, CheckCircle2, Calendar, Users, FileText } from "lucide-react"
import type { PlanData } from "./types"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

// Server Actions
import {
  createMacrocycleAction,
  createMesocycleAction,
  createMicrocycleAction,
} from "@/actions/plans/plan-actions"
import { saveSessionPlanAction } from "@/actions/plans/session-plan-actions"

interface PlanReviewProps {
  planData: PlanData
  onBack: () => void
  onComplete: () => void
}

export function PlanReview({ planData, onBack, onComplete }: PlanReviewProps) {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      let result

      // Create based on plan type
      if (planData.type === 'macrocycle') {
        result = await createMacrocycleAction({
          name: planData.name,
          description: planData.description || '',
          start_date: format(planData.startDate, 'yyyy-MM-dd'),
          end_date: format(planData.endDate, 'yyyy-MM-dd'),
          athlete_group_id: planData.athleteGroupId || undefined,
        })
      } else if (planData.type === 'mesocycle') {
        if (!planData.macrocycleId) {
          throw new Error('Macrocycle ID is required for mesocycle')
        }
        result = await createMesocycleAction({
          macrocycle_id: planData.macrocycleId,
          name: planData.name,
          description: planData.description || '',
          start_date: format(planData.startDate, 'yyyy-MM-dd'),
          end_date: format(planData.endDate, 'yyyy-MM-dd'),
        })
      } else if (planData.type === 'microcycle') {
        if (!planData.mesocycleId) {
          throw new Error('Mesocycle ID is required for microcycle')
        }

        // Create microcycle first
        result = await createMicrocycleAction({
          mesocycle_id: planData.mesocycleId,
          name: planData.name,
          description: planData.description || '',
          start_date: format(planData.startDate, 'yyyy-MM-dd'),
          end_date: format(planData.endDate, 'yyyy-MM-dd'),
        })

        // If sessions exist, save them in parallel
        if (planData.sessions && planData.sessions.length > 0 && result.isSuccess && result.data) {
          const microcycleId = result.data.id

          // Execute all session saves in parallel for better performance
          await Promise.all(
            planData.sessions.map(session =>
              saveSessionPlanAction({
                ...session,
                microcycle_id: microcycleId,
                athlete_group_id: planData.athleteGroupId || undefined,
              })
            )
          )
        }
      }

      if (result && result.isSuccess) {
        toast({
          title: "Success!",
          description: `${planData.type.charAt(0).toUpperCase() + planData.type.slice(1)} created successfully`,
        })
        onComplete()
      } else {
        throw new Error(result?.message || 'Failed to create plan')
      }
    } catch (error) {
      console.error('[PlanReview] Error creating plan:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const duration = planData.endDate && planData.startDate
    ? Math.ceil((planData.endDate.getTime() - planData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Plan</CardTitle>
        <CardDescription>
          Review the details before creating your {planData.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Type Badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Plan Type</h3>
          <Badge variant="secondary" className="text-sm">
            {planData.type.charAt(0).toUpperCase() + planData.type.slice(1)}
          </Badge>
        </div>

        <Separator />

        {/* Plan Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base font-semibold">{planData.name}</p>
            </div>
          </div>

          {planData.description && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base">{planData.description}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="text-base">
                {format(planData.startDate, 'MMM d, yyyy')} - {format(planData.endDate, 'MMM d, yyyy')}
                <span className="text-muted-foreground ml-2">({duration} days)</span>
              </p>
            </div>
          </div>

          {planData.athleteGroupId && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Athlete Group</p>
                <p className="text-base">Group #{planData.athleteGroupId}</p>
              </div>
            </div>
          )}

          {planData.sessions && planData.sessions.length > 0 && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-base">{planData.sessions.length} training sessions configured</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Hierarchy Info */}
        {(planData.macrocycleId || planData.mesocycleId) && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Plan Hierarchy</p>
            <div className="text-sm text-muted-foreground space-y-1">
              {planData.macrocycleId && (
                <p>↳ Part of Macrocycle #{planData.macrocycleId}</p>
              )}
              {planData.mesocycleId && (
                <p>  ↳ Part of Mesocycle #{planData.mesocycleId}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isCreating}
          >
            Back
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Plan'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
