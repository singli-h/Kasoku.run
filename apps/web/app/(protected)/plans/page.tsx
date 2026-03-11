import { Suspense } from "react"
import { PlansHome, IndividualPlansHome } from "@/components/features/plans"
import { PageLayout } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { ActiveBlockBanner } from "@/components/features/plans/home/ActiveBlockBanner"

/** Lightweight inline skeleton for streaming fallback (route-level loading.tsx handles full page) */
function PlansContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

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
        <Suspense fallback={<PlansContentSkeleton />}>
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
      <Suspense fallback={<PlansContentSkeleton />}>
        <PlansHome />
      </Suspense>
    </PageLayout>
  )
}
