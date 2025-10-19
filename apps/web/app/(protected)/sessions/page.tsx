"use server"

import { Suspense } from "react"
import { SprintSessionDashboard } from "@/components/features/sessions"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function SessionsPage() {
  // Protect this page - only coaches and admins can access
  await serverProtectRoute({ allowedRoles: ['coach', 'admin'] })

  return (
    <PageLayout
      title="Sprint Sessions"
      description="Manage sprint training sessions across multiple athlete groups"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Sprint Sessions" variant="dashboard" />}>
        <SprintSessionDashboard />
      </Suspense>
    </PageLayout>
  )
} 