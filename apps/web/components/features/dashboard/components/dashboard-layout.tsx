"use client"

import { Suspense } from "react"
import { ActionCardsSection } from "./action-cards-section"
import { RecentSessionsSection } from "./recent-tasks-section"
import { DashboardSkeleton } from "./dashboard-skeleton"
import type { DashboardData } from "../types/dashboard-types"

interface DashboardLayoutProps {
  data: DashboardData
  displayName: string
}

export function DashboardLayout({ data, displayName }: DashboardLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mt-3">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your training overview for today.
        </p>
      </div>

      {/* Action Cards Section */}
      <Suspense fallback={<DashboardSkeleton section="actions" />}>
        <ActionCardsSection />
      </Suspense>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Sessions */}
        <Suspense fallback={<DashboardSkeleton section="tasks" />}>
          <RecentSessionsSection sessions={data.recentSessions} />
        </Suspense>
      </div>
    </div>
  )
} 