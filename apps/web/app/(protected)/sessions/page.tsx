"use server"

import { Suspense } from "react"
import { SprintSessionDashboard } from "@/components/features/sessions"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function SessionsPage() {
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