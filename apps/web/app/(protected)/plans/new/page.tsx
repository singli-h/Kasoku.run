import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { MesoWizard } from "@/components/features/plans/components/mesowizard/MesoWizard"
import { QuickStartWizard } from "@/components/features/plans/components/mesowizard/QuickStartWizard"

export default async function NewPlanPage() {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
  const isIndividual = role === 'individual'

  // Terminology based on role
  const pageTitle = isIndividual ? "Create Training Block" : "Create New Training Plan"
  const pageDescription = isIndividual
    ? "Set up your personalized training block"
    : "Design a new macrocycle, mesocycle, or microcycle"

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Create Plan" variant="form" />}>
        {isIndividual ? <QuickStartWizard /> : <MesoWizard />}
      </Suspense>
    </PageLayout>
  )
}
