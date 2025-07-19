"use server"

import { Suspense } from "react"
import { TrainingPlansPage } from "@/components/features/plans/components/training-plans-page"

export default async function PlansPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training Plans</h1>
        <p className="text-muted-foreground mt-2">
          Manage your training plans, discover templates, and create new programs
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<PlansPageSkeleton />}>
        <TrainingPlansPage />
      </Suspense>
    </div>
  )
}

function PlansPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
      </div>
      
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
} 