import { Suspense } from "react"
import { TemplatesPage } from "@/components/features/plans/components/templates-page"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { getTemplatesAction } from "@/actions/plans/session-plan-actions"
import type { SessionPlanWithDetails } from "@/types/training"

export default async function TemplatesPageRoute() {
  // Protect this page - coach only
  await serverProtectRoute({ allowedRoles: ['coach'] })

  // Server-side data fetch for templates
  // getTemplatesAction returns SessionPlan[] but the Supabase query includes
  // nested session_plan_exercises, so the runtime data matches SessionPlanWithDetails
  const templatesResult = await getTemplatesAction()
  const templates = (templatesResult.isSuccess ? templatesResult.data : []) as SessionPlanWithDetails[]

  return (
    <PageLayout
      title="Training Templates"
      description="Manage your saved session templates"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Templates" variant="grid" />}>
        <TemplatesPage initialTemplates={templates} />
      </Suspense>
    </PageLayout>
  )
}
