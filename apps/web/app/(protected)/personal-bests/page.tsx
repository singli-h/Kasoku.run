"use server"

import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { PersonalBestsManagement } from "@/components/features/personal-bests"

export default async function PersonalBestsPage() {
  // Protect this page - athletes and coaches can access
  await serverProtectRoute({ allowedRoles: ['athlete', 'coach', 'admin'] })

  return (
    <PageLayout
      title="Personal Bests"
      description="View and manage your personal best performances"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Personal Bests" variant="grid" />}>
        <PersonalBestsManagement />
      </Suspense>
    </PageLayout>
  )
}
