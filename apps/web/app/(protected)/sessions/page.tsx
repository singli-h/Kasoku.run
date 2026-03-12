"use server"

import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { SessionsListView } from "@/components/features/sessions"

// Role-specific descriptions
const ROLE_DESCRIPTIONS: Record<string, string> = {
  coach: "Manage sprint training sessions across your athletes and groups",
  individual: "Manage your sprint training sessions",
}

export default async function SessionsPage() {
  // Protect this page - coach only
  const role = await serverProtectRoute({ allowedRoles: ['coach'] })

  const description = ROLE_DESCRIPTIONS[role] || "Manage your sprint training sessions"

  return (
    <PageLayout
      title="Sprint Sessions"
      description={description}
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Sprint Sessions" variant="dashboard" />}>
        <SessionsListView />
      </Suspense>
    </PageLayout>
  )
} 