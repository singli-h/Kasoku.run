"use server"

import { Suspense } from "react"
import { ExerciseLibraryPage } from "@/components/features/exercise"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function LibraryPage() {
  return (
    <PageLayout
      title="Exercise Library"
      description="Browse and manage your exercise database with detailed instructions and videos"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Exercise Library" variant="library" showActions={true} />}>
        <ExerciseLibraryPage />
      </Suspense>
    </PageLayout>
  )
} 