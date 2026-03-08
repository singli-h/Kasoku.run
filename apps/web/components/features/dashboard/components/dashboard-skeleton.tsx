"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DASHBOARD_CONFIG } from "../constants/dashboard-config"

interface DashboardSkeletonProps {
  section?: 'actions' | 'tasks' | 'activity' | 'full'
}

export function DashboardSkeleton({ section = 'full' }: DashboardSkeletonProps) {
  if (section === 'actions') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 p-4 rounded-lg">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (section === 'tasks') {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: DASHBOARD_CONFIG.skeletonCount }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3 flex-1">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full max-w-xs" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (section === 'activity') {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: DASHBOARD_CONFIG.skeletonCount }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="ml-3 h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full dashboard skeleton
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 mt-3" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Action cards skeleton */}
      <DashboardSkeleton section="actions" />

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSkeleton section="tasks" />
        <DashboardSkeleton section="activity" />
      </div>
    </div>
  )
} 