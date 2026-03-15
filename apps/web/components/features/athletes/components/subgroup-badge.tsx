/**
 * Shared Subgroup Badge Component
 * Unified visual treatment for subgroup tags across ALL pages
 */

import { cn } from "@/lib/utils"

type BadgeSize = "xs" | "sm" | "md"
type BadgeVariant = "default" | "filter" | "muted"

interface SubgroupBadgeProps {
  value: string | null | undefined
  emptyLabel?: string
  interactive?: boolean
  /** xs = inline indicators (cards, dots), sm = default display, md = filter pills */
  size?: BadgeSize
  /** default = primary tint, filter = solid active/ghost inactive, muted = subtle for secondary contexts */
  variant?: BadgeVariant
  /** Whether this badge is in an "active/selected" state (used with filter variant) */
  active?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[11px] leading-none min-h-[20px]",
  sm: "px-2 py-0.5 text-xs leading-none min-h-[22px]",
  md: "px-3 py-1.5 text-sm leading-none min-h-[30px]",
}

function getVariantClasses(variant: BadgeVariant, hasValue: boolean, active?: boolean): string {
  if (!hasValue) {
    return "border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
  }

  switch (variant) {
    case "filter":
      return active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    case "muted":
      return "bg-muted text-muted-foreground hover:bg-muted/80"
    case "default":
    default:
      return "bg-primary/80 text-primary-foreground hover:bg-primary/90"
  }
}

export function SubgroupBadge({
  value,
  emptyLabel = "+group",
  interactive = false,
  size = "sm",
  variant = "default",
  active,
  className,
  onClick,
}: SubgroupBadgeProps) {
  const Tag = interactive ? "button" : "span"

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded font-medium shrink-0 transition-colors whitespace-nowrap",
        sizeClasses[size],
        getVariantClasses(variant, !!value, active),
        interactive && "cursor-pointer",
        className
      )}
    >
      {value || emptyLabel}
    </Tag>
  )
}
