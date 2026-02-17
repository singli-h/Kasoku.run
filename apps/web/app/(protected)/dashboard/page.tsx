import { Suspense } from "react"
import {
  getCurrentUserAction,
  checkUserNeedsOnboardingAction
} from "@/actions/auth/user-actions"
import { getDashboardDataAction, getCoachDashboardDataAction } from "@/actions/dashboard/dashboard-actions"
import { redirect } from "next/navigation"
import { DashboardLayout, CoachDashboardView } from "@/components/features/dashboard/components"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

// Dashboard needs real-time data - disable caching for this page
export const dynamic = 'force-dynamic'

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

  // Fetch user + both dashboard datasets in parallel (only one will be used based on role)
  const [userResult, dashboardDataResult, coachDataResult] = await Promise.all([
    getCurrentUserAction(),
    getDashboardDataAction(),
    getCoachDashboardDataAction()
  ])

  if (!userResult.isSuccess || !userResult.data) {
    redirect("/")
  }

  const user = userResult.data
  const displayName = user.first_name || user.email.split("@")[0]

  // Coach role → coach dashboard
  if (user.role === 'coach' && coachDataResult.isSuccess && coachDataResult.data) {
    return (
      <PageLayout
        title={`Welcome back, ${displayName}!`}
        description="Here's your coaching overview for today."
      >
        <CoachDashboardView data={coachDataResult.data} />
      </PageLayout>
    )
  }

  // Athlete / individual role → athlete dashboard
  if (!dashboardDataResult.isSuccess || !dashboardDataResult.data) {
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

  return (
    <PageLayout
      title={`Welcome back, ${displayName}!`}
      description="Here's your training overview for today."
    >
      <DashboardLayout data={dashboardDataResult.data} displayName={displayName} />
    </PageLayout>
  )
}
