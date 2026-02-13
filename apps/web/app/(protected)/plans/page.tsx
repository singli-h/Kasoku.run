import { Suspense } from "react"
import { PlansHome, IndividualPlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { ActiveBlockBanner } from "@/components/features/plans/home/ActiveBlockBanner"

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
  const isIndividual = role === 'individual'
  const params = await searchParams
  const showActiveBlockError = params.error === 'active-block-exists'

  // Individual users: streamlined view without PageLayout wrapper
  // Active block content is shown directly (no extra navigation needed)
  if (isIndividual) {
    return (
      <>
        {showActiveBlockError && <ActiveBlockBanner />}
        <Suspense fallback={<UnifiedPageSkeleton title="Training" variant="plans" />}>
          <IndividualPlansHome />
        </Suspense>
      </>
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
