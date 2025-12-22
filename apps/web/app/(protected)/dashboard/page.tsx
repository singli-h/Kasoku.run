import { Suspense } from "react"
import {
  getCurrentUserAction,
  checkUserNeedsOnboardingAction
} from "@/actions/auth/user-actions"
import { getDashboardDataAction } from "@/actions/dashboard/dashboard-actions"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/features/dashboard/components"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function DashboardPage() {
  return (
    <Suspense fallback={<UnifiedPageSkeleton title="Dashboard" variant="dashboard" />}>
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
    // Use unified error handling (no onRetry - can't pass functions from Server to Client)
    return (
      <PageLayout
        title="Dashboard"
        description="Your training overview and quick actions"
        error={dashboardDataResult.message}
      >
        <div>Error loading dashboard data</div>
      </PageLayout>
    )
  }

  const user = userResult.data
  const displayName = user.first_name || user.email.split("@")[0]
  const dashboardData = dashboardDataResult.data

  return (
    <PageLayout
      title={`Welcome back, ${displayName}!`}
      description="Here's your training overview for today."
    >
      <DashboardLayout data={dashboardData} displayName={displayName} />
    </PageLayout>
  )
} 