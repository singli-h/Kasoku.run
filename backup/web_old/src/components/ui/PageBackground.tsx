"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {}

const PageBackground = React.forwardRef<HTMLDivElement, PageBackgroundProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("min-h-screen w-full bg-background text-foreground", className)} // Basic background styling
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageBackground.displayName = "PageBackground"

export { PageBackground } 