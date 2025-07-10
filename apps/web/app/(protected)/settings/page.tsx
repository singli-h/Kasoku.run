"use server"

import { Suspense } from "react"
import { ProfileSettingsPage } from "@/components/features/settings"

export default async function SettingsPage() {
  return (
    <div className="flex-1">
      <Suspense fallback={<SettingsPageSkeleton />}>
        <ProfileSettingsPage />
      </Suspense>
    </div>
  )
}

function SettingsPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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