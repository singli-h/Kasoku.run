"use client"

import { Suspense } from "react"
import { ActionCardsSection } from "./action-cards-section"
import { RecentTasksSection } from "./recent-tasks-section"
import { AICopilotActivitySection } from "./ai-copilot-activity-section"
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
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Action Cards Section */}
      <Suspense fallback={<DashboardSkeleton section="actions" />}>
        <ActionCardsSection />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Suspense fallback={<DashboardSkeleton section="tasks" />}>
          <RecentTasksSection tasks={data.recentTasks} />
        </Suspense>

        {/* AI Copilot Activity */}
        <Suspense fallback={<DashboardSkeleton section="activity" />}>
          <AICopilotActivitySection activities={data.aiActivity} />
        </Suspense>
      </div>
    </div>
  )
} 