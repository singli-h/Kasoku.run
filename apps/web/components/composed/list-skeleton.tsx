"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ListSkeletonProps } from "@/types/composed"

export function ListSkeleton({
  count = 6,
  variant = 'default',
  showFilters = true,
  className
}: ListSkeletonProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}>
      {showFilters && (
        <>
          {/* Header section */}
          <div className="flex items-center justify-between mt-3">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          
          {/* Filter section */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </>
      )}
      
      {/* List items */}
      <div className={cn("space-y-3", !showFilters && "pt-4")}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className={cn(
              "p-4",
              variant === 'compact' && "p-3"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 