"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EmptyStateProps } from "@/types/composed"

export function ListEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50">
          {icon}
        </div>
      )}
      <p className="text-muted-foreground mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button>{actionLabel}</Button>
            </Link>
          ) : (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  )
} 