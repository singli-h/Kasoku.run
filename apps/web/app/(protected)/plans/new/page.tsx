"use server"

import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { MesoWizard } from "@/components/features/plans/components/mesowizard/MesoWizard"

export default async function NewPlanPage() {
  // Protect this page - only coaches and individuals can access
  await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })

  return (
    <PageLayout
      title="Create New Training Plan"
      description="Design a new macrocycle, mesocycle, or microcycle"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Create Plan" variant="form" />}>
        <MesoWizard />
      </Suspense>
    </PageLayout>
  )
}
