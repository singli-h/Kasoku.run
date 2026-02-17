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

  // Fetch user first to determine role
  const userResult = await getCurrentUserAction()

  if (!userResult.isSuccess || !userResult.data) {
    redirect("/")
  }

  const user = userResult.data
  const displayName = user.first_name || user.email.split("@")[0]

  // Coach role → fetch coach data only
  if (user.role === 'coach') {
    const coachDataResult = await getCoachDashboardDataAction()
    if (coachDataResult.isSuccess && coachDataResult.data) {
      return (
        <PageLayout
          title={`Welcome back, ${displayName}!`}
          description="Here's your coaching overview for today."
        >
          <CoachDashboardView data={coachDataResult.data} />
        </PageLayout>
      )
    }
  }

  // Athlete / individual role → fetch athlete data only
  const dashboardDataResult = await getDashboardDataAction()

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
