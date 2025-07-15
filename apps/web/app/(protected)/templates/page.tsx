"use server"

import { Suspense } from "react"
import { TemplatesPage } from "@/components/features/plans/components/templates-page"

export default async function TemplatesPageRoute() {
  return (
    <div className="flex-1">
      <Suspense fallback={<TemplatesPageSkeleton />}>
        <TemplatesPage />
      </Suspense>
    </div>
  )
}

function TemplatesPageSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
} 