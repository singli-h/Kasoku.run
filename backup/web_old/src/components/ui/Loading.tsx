"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton" // Assuming Skeleton is available

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, message = "Loading...", showSkeleton = true, skeletonCount = 3, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center p-4 space-y-2", className)}
        {...props}
      >
        {message && <p className="text-muted-foreground">{message}</p>}
        {showSkeleton && (
          <div className="space-y-2 w-full max-w-sm">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        )}
        {children}
      </div>
    )
  }
)
Loading.displayName = "Loading"

export { Loading } 