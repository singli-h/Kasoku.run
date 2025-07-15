"use server"

import { Suspense } from "react"
import { GroupSessionDashboard } from "@/components/features/sessions/components/group-session-dashboard"

export default async function SessionsPage() {
  return (
    <div className="flex-1">
      <Suspense fallback={<SessionsPageSkeleton />}>
        <GroupSessionDashboard />
      </Suspense>
    </div>
  )
}

function SessionsPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
      </div>
      
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  )
} 