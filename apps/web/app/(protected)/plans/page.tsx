"use server"

import { Suspense } from "react"
import { PlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function PlansPage() {
  return (
    <PageLayout
      title="Training Plans"
      description="View and manage your macrocycles with race-anchored timelines"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plans" variant="grid" />}>
        <PlansHome />
      </Suspense>
    </PageLayout>
  )
} 