"use client"

import { Sparkles, Check, X, RefreshCw, Undo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ApprovalBannerProps {
  changeCount: number
  onApproveAll: () => void
  onRegenerate: () => void
  onDismiss: () => void
  isApplied?: boolean
  onUndo?: () => void
}

export function ApprovalBanner({
  changeCount,
  onApproveAll,
  onRegenerate,
  onDismiss,
  isApplied,
  onUndo,
}: ApprovalBannerProps) {
  if (isApplied) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-green-700">
              {changeCount} changes applied
            </span>
          </div>
          {onUndo && (
            <Button variant="ghost" size="sm" onClick={onUndo} className="text-green-600">
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            AI suggested {changeCount} {changeCount === 1 ? 'change' : 'changes'}
          </p>
          <p className="text-xs text-muted-foreground">
            Review below, then approve or regenerate
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onApproveAll} className="flex-1" size="sm">
          <Check className="h-4 w-4 mr-1" />
          Approve All
        </Button>
        <Button onClick={onRegenerate} variant="outline" size="sm" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-1" />
          Regenerate
        </Button>
        <Button onClick={onDismiss} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
