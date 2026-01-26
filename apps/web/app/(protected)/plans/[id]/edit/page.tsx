import { redirect } from "next/navigation"

/**
 * Plan Edit Page - DEPRECATED
 *
 * This route has been deprecated in favor of the unified plan page at /plans/[id].
 * AI editing is now integrated directly into the main plan view.
 *
 * Implements T067 from tasks.md (Phase 13: Route Deprecation)
 *
 * @see docs/features/plans/individual/tasks.md
 */
export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const planId = resolvedParams.id

  // Redirect to the unified plan page
  // T067: All edit functionality is now available on the main plan page
  redirect(`/plans/${planId}`)
}

// Preserve original implementation below for reference (T068)
// ============================================================
// import { Suspense } from "react"
// import { notFound, redirect } from "next/navigation"
// import { UnifiedPageSkeleton } from "@/components/layout"
// import { getMesocycleByIdAction } from "@/actions/plans/plan-actions"
// import { serverProtectRoute } from "@/components/auth/server-protect-route"
// import { FeatureErrorBoundary } from "@/components/error-boundary"
// import { PlanEditClient } from "./PlanEditClient"
// import type { MesocycleWithDetails } from "@/types/training"
//
// /**
//  * Plan Edit Page
//  *
//  * AI-powered editing interface for training blocks.
//  * Allows users to refine their plan with natural language requests.
//  */
// export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
//   // Protect this page - only individual users can edit their plans with AI
//   const role = await serverProtectRoute({ allowedRoles: ['individual'] })
//
//   if (role !== 'individual') {
//     redirect('/plans')
//   }
//
//   const resolvedParams = await params
//   const planId = Number(resolvedParams.id)
//
//   // Fetch the training block
//   const mesocycleResult = await getMesocycleByIdAction(planId)
//
//   if (!mesocycleResult.isSuccess || !mesocycleResult.data) {
//     console.error('Failed to fetch training block:', mesocycleResult.message)
//     notFound()
//   }
//
//   return (
//     <FeatureErrorBoundary
//       featureName="Plan Editor"
//       customMessage="Something went wrong while loading the plan editor. Please try again."
//     >
//       <Suspense fallback={<UnifiedPageSkeleton title="Edit Plan" variant="grid" />}>
//         <PlanEditClient trainingBlock={mesocycleResult.data as MesocycleWithDetails} />
//       </Suspense>
//     </FeatureErrorBoundary>
//   )
// }
