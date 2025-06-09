"use client"

import { useState, useCallback } from 'react'
import type { 
  OrganizationWizardData, 
  OrganizationWizardState, 
  WizardStepId,
  TeamMemberInvite 
} from '../types'
import { WIZARD_STEPS, DEFAULT_WIZARD_DATA } from '../constants'

export function useOrganizationWizard() {
  const [state, setState] = useState<OrganizationWizardState>({
    currentStep: 1,
    data: DEFAULT_WIZARD_DATA,
    isSubmitting: false,
    steps: WIZARD_STEPS
  })

  const updateSteps = useCallback((currentStep: WizardStepId) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step => ({
        ...step,
        isActive: step.id === currentStep,
        isCompleted: step.id < currentStep
      }))
    }))
  }, [])

  const goToStep = useCallback((stepId: WizardStepId) => {
    setState(prev => ({
      ...prev,
      currentStep: stepId
    }))
    updateSteps(stepId)
  }, [updateSteps])

  const nextStep = useCallback(() => {
    setState(prev => {
      const nextStepId = Math.min(prev.currentStep + 1, 3) as WizardStepId
      return {
        ...prev,
        currentStep: nextStepId
      }
    })
    updateSteps(state.currentStep < 3 ? (state.currentStep + 1) as WizardStepId : 3)
  }, [state.currentStep, updateSteps])

  const previousStep = useCallback(() => {
    setState(prev => {
      const prevStepId = Math.max(prev.currentStep - 1, 1) as WizardStepId
      return {
        ...prev,
        currentStep: prevStepId
      }
    })
    updateSteps(state.currentStep > 1 ? (state.currentStep - 1) as WizardStepId : 1)
  }, [state.currentStep, updateSteps])

  const updateData = useCallback((updates: Partial<OrganizationWizardData>) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates
      }
    }))
  }, [])

  const addTeamMember = useCallback((member: TeamMemberInvite) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        teamMembers: [...prev.data.teamMembers, member]
      }
    }))
  }, [])

  const removeTeamMember = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        teamMembers: prev.data.teamMembers.filter((_, i) => i !== index)
      }
    }))
  }, [])

  const updateTeamMember = useCallback((index: number, updates: Partial<TeamMemberInvite>) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        teamMembers: prev.data.teamMembers.map((member, i) => 
          i === index ? { ...member, ...updates } : member
        )
      }
    }))
  }, [])

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting
    }))
  }, [])

  const canGoNext = () => {
    switch (state.currentStep) {
      case 1:
        return !!(state.data.companyName.trim() && state.data.industry && state.data.teamSize)
      case 2:
        return true // Team members are optional
      case 3:
        return true
      default:
        return false
    }
  }

  const canGoPrevious = () => {
    return state.currentStep > 1
  }

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    setSubmitting,
    canGoNext,
    canGoPrevious
  }
} 