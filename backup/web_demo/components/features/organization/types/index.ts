export interface OrganizationWizardData {
  // Step 1: Business Details
  companyName: string
  industry: string
  teamSize: string
  
  // Step 2: Team Planning
  teamMembers: TeamMemberInvite[]
  
  // Step 3: Review (computed from above)
}

export interface TeamMemberInvite {
  email: string
  role: 'client_admin' | 'client_team'
  name?: string
}

export interface WizardStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
}

export type WizardStepId = 1 | 2 | 3

export interface OrganizationWizardState {
  currentStep: WizardStepId
  data: OrganizationWizardData
  isSubmitting: boolean
  steps: WizardStep[]
}

import { INDUSTRY_OPTIONS, TEAM_SIZE_OPTIONS } from '../constants'

export type IndustryType = typeof INDUSTRY_OPTIONS[number]['value']
export type TeamSizeType = typeof TEAM_SIZE_OPTIONS[number]['value'] 