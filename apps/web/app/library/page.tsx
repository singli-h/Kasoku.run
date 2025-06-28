"use server"

import { Suspense } from "react"
import { ExerciseLibraryPage } from "@/components/features/exercise"

export default async function LibraryPage() {
  return (
    <div className="flex-1">
      <Suspense fallback={<LibraryPageSkeleton />}>
        <ExerciseLibraryPage />
      </Suspense>
    </div>
  )
}

function LibraryPageSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
      
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
} 