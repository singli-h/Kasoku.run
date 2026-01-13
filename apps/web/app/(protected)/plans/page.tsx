import { Suspense } from "react"
import { PlansHome, IndividualPlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function PlansPage() {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
  const isIndividual = role === 'individual'

  // Role-based terminology is handled inline
  // Note: Keep "Plans" to avoid confusion with "Training" nav group
  const pageTitle = isIndividual ? "Plans" : "Training Plans"
  const pageDescription = isIndividual
    ? "Manage your training blocks and workouts"
    : "View and manage your macrocycles with race-anchored timelines"

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
    >
      <Suspense fallback={<UnifiedPageSkeleton title={pageTitle} variant="plans" />}>
        {isIndividual ? <IndividualPlansHome /> : <PlansHome />}
      </Suspense>
    </PageLayout>
  )
} 