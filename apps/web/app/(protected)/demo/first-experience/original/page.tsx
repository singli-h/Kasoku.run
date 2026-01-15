'use client'

import { useRouter } from 'next/navigation'
import { PlanReviewScreen, MOCK_PROPOSED_PLAN } from '@/components/features/first-experience'
import { useToast } from '@/hooks/use-toast'

export default function FirstExperienceOriginalDemo() {
  const router = useRouter()
  const { toast } = useToast()

  const handleBack = () => {
    router.push('/demo/first-experience')
  }

  const handleSkipToManual = () => {
    toast({
      title: 'Skip to Manual',
      description: 'This would open the QuickStartWizard.',
    })
  }

  const handleStartWorkout = (sessionId: string) => {
    toast({
      title: 'Start Workout',
      description: `Starting session: ${sessionId}`,
    })
  }

  const handleViewBlock = (blockId: string) => {
    toast({
      title: 'View Training Block',
      description: `Viewing block: ${blockId}`,
    })
  }

  return (
    <PlanReviewScreen
      plan={MOCK_PROPOSED_PLAN}
      onBack={handleBack}
      onSkipToManual={handleSkipToManual}
      onStartWorkout={handleStartWorkout}
      onViewBlock={handleViewBlock}
    />
  )
}
