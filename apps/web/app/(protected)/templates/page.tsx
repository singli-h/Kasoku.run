"use server"

import { Suspense } from "react"
import { TemplatesPage } from "@/components/features/plans/components/templates-page"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function TemplatesPageRoute() {
  return (
    <PageLayout
      title="Training Templates"
      description="Browse and use pre-built training programs and workout templates"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Training Templates" variant="grid" />}>
        <TemplatesPage />
      </Suspense>
    </PageLayout>
  )
} 