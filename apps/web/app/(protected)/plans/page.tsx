"use server"

import { Suspense } from "react"
import { TrainingPlansPage } from "@/components/features/plans/components/training-plans-page"

export default async function PlansPage() {
  return (
    <div className="flex-1">
      <Suspense fallback={<PlansPageSkeleton />}>
        <TrainingPlansPage />
      </Suspense>
    </div>
  )
}

function PlansPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
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