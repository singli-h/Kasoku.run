import { Suspense } from "react"
import { redirect } from "next/navigation"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { QuickStartWizard } from "@/components/features/plans/components/mesowizard/QuickStartWizard"
import { CoachSeasonWizard } from "@/components/features/plans/coach-wizard/CoachSeasonWizard"
import { hasActiveTrainingBlockAction } from "@/actions/plans/plan-actions"
import { getCoachAthleteGroupsAction } from "@/actions/athletes/athlete-actions"

export default async function NewPlanPage() {
  // Protect this page and get user role in a single call
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
  const isIndividual = role === 'individual'

  // FR-007: Block individual users who already have an active training block
  // Check at wizard entry so they don't waste time configuring + generating AI plans
  if (isIndividual) {
    const activeCheck = await hasActiveTrainingBlockAction()
    if (activeCheck.isSuccess && activeCheck.data === true) {
      redirect("/plans?error=active-block-exists")
    }
  }

  // For coaches, fetch groups for the wizard
  let coachGroups: Array<{ id: number; name: string }> = []
  if (!isIndividual) {
    const groupsResult = await getCoachAthleteGroupsAction()
    coachGroups = (groupsResult.isSuccess ? groupsResult.data ?? [] : [])
      .map(g => ({ id: g.id, name: g.group_name ?? `Group ${g.id}` }))
  }

  // Terminology based on role
  const pageTitle = isIndividual ? "Create Training Block" : "Create New Season Plan"
  const pageDescription = isIndividual
    ? "Set up your personalized training block"
    : "Create a new training season plan with AI-assisted setup"

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Create Plan" variant="form" />}>
        {isIndividual ? <QuickStartWizard /> : <CoachSeasonWizard coachGroups={coachGroups} />}
      </Suspense>
    </PageLayout>
  )
}
