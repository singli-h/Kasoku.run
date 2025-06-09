// Force dynamic rendering - dashboard needs real-time user data
export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUserAction, checkUserNeedsOnboardingAction } from "@/actions/auth/user-actions"
import { getDashboardDataAction } from "@/actions/dashboard/dashboard-actions"
import { DashboardLayout } from "@/components/features/dashboard/components/dashboard-layout"
import { DashboardSkeleton } from "@/components/features/dashboard/components/dashboard-skeleton"
import { Card, CardContent } from "@/components/ui/card"

async function DashboardContent() {
  // Check if user needs onboarding first
  const onboardingResult = await checkUserNeedsOnboardingAction()
  
  if (onboardingResult.isSuccess && onboardingResult.data) {
    // User needs onboarding, redirect to onboarding page
    redirect('/onboarding')
  }

  const [userResult, dashboardResult] = await Promise.all([
    getCurrentUserAction(),
    getDashboardDataAction()
  ])
  
  if (!userResult.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading dashboard: {userResult.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardResult.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading dashboard data: {dashboardResult.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const user = userResult.data
  const dashboardData = dashboardResult.data
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.email

  return (
    <DashboardLayout 
      data={dashboardData} 
      displayName={displayName} 
    />
  )
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
} 