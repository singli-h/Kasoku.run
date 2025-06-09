"use client"

import { cn } from "@/lib/utils"
import type { ListHeaderProps } from "@/types/composed"

export function ListHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className
}: ListHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mt-3", className)}>
      <div>
        {breadcrumbs && (
          <div className="mb-2">
            {breadcrumbs}
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  )
} 