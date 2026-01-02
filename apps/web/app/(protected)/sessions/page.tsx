"use server"

import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { SessionsListView } from "@/components/features/sessions"

export default async function SessionsPage() {
  // Protect this page - only coaches and individuals can access
  await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })

  return (
    <PageLayout
      title="Sprint Sessions"
      description="Manage sprint training sessions across multiple athlete groups"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Sprint Sessions" variant="dashboard" />}>
        <SessionsListView />
      </Suspense>
    </PageLayout>
  )
} 