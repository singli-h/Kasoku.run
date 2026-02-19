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

