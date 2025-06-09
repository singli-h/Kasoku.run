"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useOrganizationWizard } from '../hooks/use-organization-wizard'
import { 
  createOrganizationFromWizardAction,
  sendTeamInvitationsAction
} from '@/actions/auth/organization-wizard-actions'
import { WizardProgress } from './wizard-progress'
import { BusinessDetailsStep } from './business-details-step'
import { TeamPlanningStep } from './team-planning-step'
import { ReviewStep } from './review-step'

export function OrganizationWizard() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    canGoNext,
    canGoPrevious
  } = useOrganizationWizard()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Create organization
      const organizationResult = await createOrganizationFromWizardAction(state.data)
      
      if (!organizationResult.isSuccess) {
        toast({
          title: "Failed to create organization",
          description: organizationResult.message,
          variant: "destructive"
        })
        return
      }

      // Send team invitations if any team members were added
      if (state.data.teamMembers.length > 0) {
        const invitationResult = await sendTeamInvitationsAction(
          organizationResult.data.id,
          state.data.teamMembers
        )

        if (!invitationResult.isSuccess) {
          // Organization was created but invitations failed
          toast({
            title: "Organization created",
            description: `${organizationResult.message}, but some invitations failed to send.`,
            variant: "default"
          })
        } else {
          toast({
            title: "Organization created successfully",
            description: `${organizationResult.message}. ${invitationResult.message}.`,
            variant: "default"
          })
        }
      } else {
        toast({
          title: "Organization created successfully",
          description: organizationResult.message,
          variant: "default"
        })
      }

      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Error creating organization:', error)
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <BusinessDetailsStep
            data={state.data}
            onUpdate={updateData}
            onNext={nextStep}
            canGoNext={canGoNext()}
          />
        )
      case 2:
        return (
          <TeamPlanningStep
            data={state.data}
            onAddTeamMember={addTeamMember}
            onRemoveTeamMember={removeTeamMember}
            onUpdateTeamMember={updateTeamMember}
            onNext={nextStep}
            onPrevious={previousStep}
            canGoNext={canGoNext()}
            canGoPrevious={canGoPrevious()}
          />
        )
      case 3:
        return (
          <ReviewStep
            data={state.data}
            onPrevious={previousStep}
            onSubmit={handleSubmit}
            canGoPrevious={canGoPrevious()}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Your Organization</h1>
          <p className="text-muted-foreground mt-2">
            Set up your team and start collaborating with GuideLayer AI
          </p>
        </div>

        <WizardProgress 
          steps={state.steps} 
          onStepClick={(stepId) => {
            // Allow navigation to completed steps or current step
            const targetStep = state.steps.find(s => s.id === stepId)
            if (targetStep && (targetStep.isCompleted || targetStep.isActive)) {
              goToStep(stepId as 1 | 2 | 3)
            }
          }}
        />

        {renderCurrentStep()}
      </div>
    </div>
  )
} 