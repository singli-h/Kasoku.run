"use server"

import { Suspense } from "react"
import { TrainingPlansPage } from "@/components/features/plans/components/training-plans-page"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function PlansPage() {
  return (
    <PageLayout
      title="Training Plans"
      description="Manage your training plans, discover templates, and create new programs"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Plans" variant="grid" />}>
        <TrainingPlansPage />
      </Suspense>
    </PageLayout>
  )
} 