/**
 * Shared Event Group Badge Component
 * Unified visual treatment for event group tags across athlete pages
 */

import { cn } from "@/lib/utils"

interface EventGroupBadgeProps {
  value: string | null | undefined
  emptyLabel?: string
  interactive?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function EventGroupBadge({
  value,
  emptyLabel = "+group",
  interactive = false,
  className,
  onClick,
}: EventGroupBadgeProps) {
  const Tag = interactive ? "button" : "span"

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded px-1.5 py-px text-[10px] leading-tight font-mono font-medium shrink-0 transition-colors",
        value
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50",
        interactive && "cursor-pointer",
        className
      )}
    >
      {value || emptyLabel}
    </Tag>
  )
}
