"use server"

import { Suspense } from "react"
import { WorkoutPageContent } from "@/components/features/workout/components/workout-page-content"

export default async function WorkoutPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Workout Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Track your strength training and conditioning workouts
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<WorkoutPageSkeleton />}>
        <WorkoutPageContent />
      </Suspense>
    </div>
  )
}

function WorkoutPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
} 