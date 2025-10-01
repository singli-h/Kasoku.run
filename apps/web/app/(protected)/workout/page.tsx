"use server"

import { Suspense } from "react"
import { WorkoutPageContent } from "@/components/features/workout/components/pages/workout-page-content"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function WorkoutPage() {
  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<UnifiedPageSkeleton title="" variant="grid" />}>
        <WorkoutPageContent />
      </Suspense>
    </div>
  )
} 