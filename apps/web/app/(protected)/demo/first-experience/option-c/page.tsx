'use client'

import { useRouter } from 'next/navigation'
import { PlanReviewOptionC, MOCK_PROPOSED_PLAN } from '@/components/features/first-experience'

export default function FirstExperienceOptionCDemo() {
  const router = useRouter()

  return (
    <PlanReviewOptionC
      plan={MOCK_PROPOSED_PLAN}
      onBack={() => router.push('/demo/first-experience')}
      onStartWorkout={(sessionId) => {
        console.log('Start workout:', sessionId)
        alert(`Starting workout: ${sessionId}`)
      }}
      onViewBlock={(blockId) => {
        console.log('View block:', blockId)
        alert(`Viewing block: ${blockId}`)
      }}
    />
  )
}
