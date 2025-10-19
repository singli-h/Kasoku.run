"use server"

import { Suspense } from "react"
import { PlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function PlansPage() {
  // Protect this page - only coaches and admins can access
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })

  return (
    <PageLayout
      title="Training Plans"
      description="View and manage your macrocycles with race-anchored timelines"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plans" variant="grid" />}>
        <PlansHome />
      </Suspense>
    </PageLayout>
  )
} 