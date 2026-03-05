'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Step1Import } from './steps/Step1Import'
import { Step2PhaseReview } from './steps/Step2PhaseReview'
import { Step3Groups } from './steps/Step3Groups'
import { createMacrocycleAction } from '@/actions/plans/plan-actions'
import { saveMacroPlanningContextAction } from '@/actions/plans/plan-actions'

type WizardStep = 'import' | 'phase-review' | 'groups'

interface PhaseConfig {
  name: string
  phase: 'GPP' | 'SPP' | 'Taper' | 'Competition'
  weeks: number
}

interface WizardState {
  macrocycleName: string
  startDate: string
  endDate: string
  planningContext: string
  phases: PhaseConfig[]
  selectedGroupIds: number[]
}

interface CoachSeasonWizardProps {
  coachGroups: Array<{ id: number; name: string }>
}

export function CoachSeasonWizard({ coachGroups }: CoachSeasonWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('import')
  const [state, setState] = useState<WizardState>({
    macrocycleName: '', startDate: '', endDate: '',
    planningContext: '', phases: [], selectedGroupIds: [],
  })
  const [isCreating, setIsCreating] = useState(false)

  async function handleComplete(groupIds: number[]) {
    setIsCreating(true)
    try {
      const result = await createMacrocycleAction({
        name: state.macrocycleName,
        start_date: state.startDate,
        end_date: state.endDate,
      })
      if (!result.isSuccess || !result.data) throw new Error(result.message)
      const macrocycleId = result.data.id

      await saveMacroPlanningContextAction(macrocycleId, {
        text: state.planningContext,
        groups: groupIds,
        phases: state.phases,
      })

      router.push(`/plans/${macrocycleId}`)
    } catch (e) {
      console.error('[CoachSeasonWizard] Failed:', e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(['import', 'phase-review', 'groups'] as WizardStep[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">&rarr;</span>}
            <span className={step === s ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {i + 1}. {s === 'import' ? 'Describe' : s === 'phase-review' ? 'Structure' : 'Groups'}
            </span>
          </span>
        ))}
      </div>

      {step === 'import' && (
        <Step1Import
          onComplete={(planningContext, name, startDate, endDate) => {
            setState(s => ({ ...s, planningContext, macrocycleName: name, startDate, endDate }))
            setStep('phase-review')
          }}
        />
      )}
      {step === 'phase-review' && (
        <Step2PhaseReview
          planningContext={state.planningContext}
          onComplete={(phases) => {
            setState(s => ({ ...s, phases }))
            setStep('groups')
          }}
          onBack={() => setStep('import')}
        />
      )}
      {step === 'groups' && (
        <Step3Groups
          coachGroups={coachGroups}
          onComplete={handleComplete}
          onBack={() => setStep('phase-review')}
          isCreating={isCreating}
        />
      )}
    </div>
  )
}
