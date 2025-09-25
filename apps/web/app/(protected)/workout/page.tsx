"use server"

import { Suspense } from "react"
import { WorkoutPageContent } from "@/components/features/workout/components/pages/workout-page-content"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function WorkoutPage() {
  return (
    <PageLayout
      title="Workout Sessions"
      description="Track your strength training and conditioning workouts"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Workout Sessions" variant="grid" />}>
        <WorkoutPageContent />
      </Suspense>
    </PageLayout>
  )
} 