import {
  getCurrentUserAction,
  checkUserNeedsOnboardingAction
} from "@/actions/auth/user-actions"
import { getDashboardDataAction, getCoachWeekDashboardDataAction } from "@/actions/dashboard/dashboard-actions"
import { redirect } from "next/navigation"
import { DashboardLayout, CoachDashboardView } from "@/components/features/dashboard/components"
import { PageLayout } from "@/components/layout"

// Dashboard needs real-time data - disable caching for this page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return <DashboardContent />
}

async function DashboardContent() {
  // Fetch onboarding status and user data in parallel (independent calls)
  const [needsOnboarding, userResult] = await Promise.all([
    checkUserNeedsOnboardingAction(),
    getCurrentUserAction(),
  ])

  if (needsOnboarding.isSuccess && needsOnboarding.data) {
    redirect("/onboarding")
  }

  if (!userResult.isSuccess || !userResult.data) {
    redirect("/")
  }

  const user = userResult.data
  const displayName = user.first_name || user.email.split("@")[0]

  // Coach role → fetch coach data only
  if (user.role === 'coach') {
    const coachDataResult = await getCoachWeekDashboardDataAction()
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
