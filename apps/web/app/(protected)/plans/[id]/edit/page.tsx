import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { UnifiedPageSkeleton } from "@/components/layout"
import { getMesocycleByIdAction } from "@/actions/plans/plan-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { FeatureErrorBoundary } from "@/components/error-boundary"
import { PlanEditClient } from "./PlanEditClient"
import type { MesocycleWithDetails } from "@/types/training"

/**
 * Plan Edit Page
 *
 * AI-powered editing interface for training blocks.
 * Allows users to refine their plan with natural language requests.
 */
export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  // Protect this page - only individual users can edit their plans with AI
  const role = await serverProtectRoute({ allowedRoles: ['individual'] })

  if (role !== 'individual') {
    redirect('/plans')
  }

  const resolvedParams = await params
  const planId = Number(resolvedParams.id)

  // Fetch the training block
  const mesocycleResult = await getMesocycleByIdAction(planId)

  if (!mesocycleResult.isSuccess || !mesocycleResult.data) {
    console.error('Failed to fetch training block:', mesocycleResult.message)
    notFound()
  }

  return (
    <FeatureErrorBoundary
      featureName="Plan Editor"
      customMessage="Something went wrong while loading the plan editor. Please try again."
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Edit Plan" variant="grid" />}>
        <PlanEditClient trainingBlock={mesocycleResult.data as MesocycleWithDetails} />
      </Suspense>
    </FeatureErrorBoundary>
  )
}
