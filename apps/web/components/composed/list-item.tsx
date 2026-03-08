"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ListItemProps } from "@/types/composed"

export function ListItem({
  children,
  onClick,
  href,
  className,
  variant = 'default',
  showActions = false,
  actions
}: ListItemProps) {
  const cardClassName = cn(
    "border-border hover:border-primary/20 transition-colors",
    className
  )

  const contentClassName = cn(
    "p-4",
    variant === 'compact' && "p-3",
    (onClick || href) && "cursor-pointer"
  )

  // If we have an href, wrap in Link
  if (href) {
    return (
      <Card className={cardClassName}>
        <div className="flex">
          <Link href={href} className="flex-1">
            <CardContent className={contentClassName}>
              {children}
            </CardContent>
          </Link>
          {showActions && actions && (
            <div className="flex items-center pr-4">
              {actions}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Otherwise, just a clickable card
  return (
    <Card className={cardClassName}>
      <div className="flex">
        <CardContent 
          className={cn(contentClassName, "flex-1")}
          onClick={onClick}
        >
          {children}
        </CardContent>
        {showActions && actions && (
          <div className="flex items-center pr-4">
            {actions}
          </div>
        )}
      </div>
    </Card>
  )
} 