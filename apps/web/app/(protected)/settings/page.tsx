"use server"

import { ProfileSettingsPage } from "@/components/features/settings"
import { PageLayout } from "@/components/layout"

export default async function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Manage your profile, preferences, and account settings"
    >
      <ProfileSettingsPage />
    </PageLayout>
  )
} 