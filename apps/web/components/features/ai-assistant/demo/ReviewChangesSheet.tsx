"use client"

import { ArrowRight, Plus, Minus, RefreshCw, ChevronRight, Check, Edit2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { SessionChange, ChangeType } from "./types"

// Legacy component - prefer inline changes with ApprovalBanner
interface ReviewChangesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  changes: SessionChange[]
  onApply: () => void
  onViewDetail: (change: SessionChange) => void
}

const changeTypeConfig: Record<
  ChangeType,
  { icon: typeof Plus; label: string; color: string }
> = {
  swap: { icon: RefreshCw, label: "Swap", color: "text-blue-500" },
  add: { icon: Plus, label: "Add", color: "text-green-500" },
  remove: { icon: Minus, label: "Remove", color: "text-red-500" },
  update: { icon: Edit2, label: "Update", color: "text-amber-500" },
}

export function ReviewChangesSheet({
  open,
  onOpenChange,
  changes,
  onApply,
  onViewDetail,
}: ReviewChangesSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80dvh] max-h-[80dvh]">
        {/* Header */}
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base">
              Review Changes ({changes.length})
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                Close
              </Button>
            </DrawerClose>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap any change to see details
          </p>
        </DrawerHeader>

        {/* Changes List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {changes.map((change) => (
              <ChangeCard
                key={change.id}
                change={change}
                onViewDetail={() => onViewDetail(change)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DrawerFooter className="border-t bg-background px-4 py-4">
          {/* Apply Button */}
          <Button
            onClick={onApply}
            className="w-full"
            size="lg"
          >
            Apply All {changes.length} Changes
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function ChangeCard({
  change,
  onViewDetail,
}: {
  change: SessionChange
  onViewDetail: () => void
}) {
  const config = changeTypeConfig[change.type]
  const Icon = config.icon

  return (
    <div className="rounded-xl border bg-card border-border">
      <div className="flex items-start gap-3 p-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>

          <p className="mt-1 font-medium text-sm">{change.description}</p>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {change.aiReasoning}
          </p>
        </div>

        {/* Detail Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail()
          }}
          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
