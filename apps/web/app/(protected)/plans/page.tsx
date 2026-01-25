import { Suspense } from "react"
import { PlansHome, IndividualPlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function PlansPage() {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
  const isIndividual = role === 'individual'

  // Individual users: streamlined view without PageLayout wrapper
  // Active block content is shown directly (no extra navigation needed)
  if (isIndividual) {
    return (
      <Suspense fallback={<UnifiedPageSkeleton title="Training" variant="plans" />}>
        <IndividualPlansHome />
      </Suspense>
    )
  }

  // Coach users: full PageLayout with title/description
  return (
    <PageLayout
      title="Training Plans"
      description="View and manage your macrocycles with race-anchored timelines"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plans" variant="plans" />}>
        <PlansHome />
      </Suspense>
    </PageLayout>
  )
}
