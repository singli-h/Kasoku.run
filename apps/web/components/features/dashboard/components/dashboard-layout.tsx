"use client"

import { Suspense } from "react"
import { ActionCardsSection } from "./action-cards-section"
import { RecentSessionsSection } from "./recent-tasks-section"
import { ComponentSkeleton } from "@/components/layout"
import type { DashboardData } from "../types/dashboard-types"

interface DashboardLayoutProps {
  data: DashboardData
  displayName: string
}

export function DashboardLayout({ data, displayName }: DashboardLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Action Cards Section */}
      <Suspense fallback={<ComponentSkeleton type="card" className="h-32" />}>
        <ActionCardsSection />
      </Suspense>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Sessions */}
        <Suspense fallback={<ComponentSkeleton type="table" />}>
          <RecentSessionsSection sessions={data.recentSessions} />
        </Suspense>
      </div>
    </div>
  )
} 