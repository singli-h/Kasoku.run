"use client"

import { Suspense } from "react"
import { SprintSessionDashboard } from "@/components/features/sessions"

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sprint Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage sprint training sessions across multiple athlete groups
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<SessionsPageSkeleton />}>
        <SprintSessionDashboard />
      </Suspense>
    </div>
  )
}

function SessionsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
      </div>
      
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  )
} 