"use server"

import { Suspense } from "react"
import { WorkoutHistoryPage } from "@/components/features/workout/components/pages/workout-history-page"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function WorkoutHistoryPageRoute() {
  return (
    <PageLayout
      title="Workout History"
      description="Review your completed training sessions and track your progress"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Workout History" variant="list" />}>
        <WorkoutHistoryPage />
      </Suspense>
    </PageLayout>
  )
}
