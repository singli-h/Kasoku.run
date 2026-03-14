/**
 * Shared Event Group Badge Component
 * Unified visual treatment for event group tags across athlete pages
 */

import { cn } from "@/lib/utils"

interface EventGroupBadgeProps {
  value: string | null | undefined
  emptyLabel?: string
  variant?: "default" | "definition"
  interactive?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function EventGroupBadge({
  value,
  emptyLabel = "+group",
  variant = "default",
  interactive = false,
  className,
  onClick,
}: EventGroupBadgeProps) {
  const Tag = interactive ? "button" : "span"

  if (variant === "definition") {
    return (
      <Tag
        onClick={onClick}
        className={cn(
          "font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0",
          interactive && "cursor-pointer hover:bg-primary/20 transition-colors",
          className
        )}
      >
        {value}
      </Tag>
    )
  }

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono shrink-0 transition-colors",
        value
          ? "bg-muted font-medium text-foreground/80 hover:bg-muted/80"
          : "border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50",
        interactive && "cursor-pointer",
        className
      )}
    >
      {value || emptyLabel}
    </Tag>
  )
}
