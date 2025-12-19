"use client"

import { Bell, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PendingChangesBannerProps {
  count: number
  onReview: () => void
}

export function PendingChangesBanner({ count, onReview }: PendingChangesBannerProps) {
  return (
    <button
      onClick={onReview}
      className={cn(
        "w-full rounded-xl border border-primary/30 bg-primary/5 p-4",
        "flex items-center justify-between",
        "transition-colors hover:bg-primary/10",
        "animate-in fade-in slide-in-from-top-2 duration-300"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell className="h-5 w-5 text-primary" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">
            {count} pending {count === 1 ? "change" : "changes"} from AI Assistant
          </p>
          <p className="text-xs text-muted-foreground">
            Tap to review and apply
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  )
}
