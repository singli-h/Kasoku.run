import type { WizardStep } from '../types'

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Business Details',
    description: 'Tell us about your company',
    isCompleted: false,
    isActive: true
  },
  {
    id: 2,
    title: 'Team Planning',
    description: 'Invite your team members',
    isCompleted: false,
    isActive: false
  },
  {
    id: 3,
    title: 'Review & Create',
    description: 'Review and create your organization',
    isCompleted: false,
    isActive: false
  }
]

export const MAX_TEAM_INVITES = 5
export const MIN_COMPANY_NAME_LENGTH = 2
export const MAX_COMPANY_NAME_LENGTH = 100

// Industry options for the dropdown
export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' }
] as const

// Team size options
export const TEAM_SIZE_OPTIONS = [
  { value: '1-5', label: '1-5 people' },
  { value: '6-15', label: '6-15 people' },
  { value: '16-50', label: '16-50 people' },
  { value: '51+', label: '51+ people' }
] as const

// Default form values
export const DEFAULT_WIZARD_DATA = {
  companyName: '',
  industry: '',
  teamSize: '',
  teamMembers: []
} 