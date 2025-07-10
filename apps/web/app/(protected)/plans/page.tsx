"use server"

import { Suspense } from "react"
import { MesoWizard } from "@/components/features/plans"

export default async function PlansPage() {
  return (
    <div className="flex-1">
      <Suspense fallback={<PlansPageSkeleton />}>
        <MesoWizard />
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
      
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  )
} 