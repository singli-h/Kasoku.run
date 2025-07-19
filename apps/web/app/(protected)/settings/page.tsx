"use server"

import { Suspense } from "react"
import { ProfileSettingsPage } from "@/components/features/settings"

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, preferences, and account settings
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<SettingsPageSkeleton />}>
        <ProfileSettingsPage />
      </Suspense>
    </div>
  )
}

function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-64 bg-gray-200 rounded w-full animate-pulse" />
      </div>
    </div>
  )
} 