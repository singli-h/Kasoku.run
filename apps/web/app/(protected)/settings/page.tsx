"use server"

import { Suspense } from "react"
import { ProfileSettingsPage } from "@/components/features/settings"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Manage your profile, preferences, and account settings"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Settings" variant="form" />}>
        <ProfileSettingsPage />
      </Suspense>
    </PageLayout>
  )
} 