"use server"

import { Suspense } from "react"
import {
  getCurrentUserAction,
  checkUserNeedsOnboardingAction
} from "@/actions/auth/user-actions"
import { getDashboardDataAction } from "@/actions/dashboard/dashboard-actions"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/features/dashboard/components"
import { DashboardSkeleton } from "@/components/features/dashboard/components/dashboard-skeleton"

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  // Check if user needs onboarding
  const needsOnboarding = await checkUserNeedsOnboardingAction()
  if (needsOnboarding.isSuccess && needsOnboarding.data) {
    redirect("/onboarding")
  }

  // Get current user and dashboard data in parallel
  const [userResult, dashboardDataResult] = await Promise.all([
    getCurrentUserAction(),
    getDashboardDataAction()
  ])

  if (!userResult.isSuccess || !userResult.data) {
    // This will be caught by the (protected) layout which handles auth state
    redirect("/")
  }

  if (!dashboardDataResult.isSuccess || !dashboardDataResult.data) {
    // Handle case where dashboard data fails to load
    // For now, we can show a message or a simplified dashboard
    // This could be a more robust error component
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your training overview and quick actions
          </p>
        </div>
        
        {/* Error Content */}
        <div>
          <h2>Error loading dashboard data</h2>
          <p>{dashboardDataResult.message}</p>
        </div>
      </div>
    )
  }

  const user = userResult.data
  const displayName = user.first_name || user.email.split("@")[0]
  const dashboardData = dashboardDataResult.data

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your training overview for today.
        </p>
      </div>

      {/* Main Content */}
      <DashboardLayout data={dashboardData} displayName={displayName} />
    </div>
  )
} 