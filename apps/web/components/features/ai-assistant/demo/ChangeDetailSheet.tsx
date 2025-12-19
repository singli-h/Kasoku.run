"use client"

import { ArrowLeft, ArrowDown, ArrowRight, Plus, Minus, RefreshCw, Sparkles, Edit2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SessionChange, ChangeType } from "./types"

// Legacy component - prefer inline changes with ApprovalBanner
interface ChangeDetailSheetProps {
  change: SessionChange | null
  onClose: () => void
}

const changeTypeConfig: Record<
  ChangeType,
  { icon: typeof Plus; label: string; color: string; bgColor: string }
> = {
  swap: {
    icon: RefreshCw,
    label: "Exercise Swap",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  add: {
    icon: Plus,
    label: "Add Exercise",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  remove: {
    icon: Minus,
    label: "Remove Exercise",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  update: {
    icon: Edit2,
    label: "Update Sets",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
}

export function ChangeDetailSheet({
  change,
  onClose,
}: ChangeDetailSheetProps) {
  if (!change) return null

  const config = changeTypeConfig[change.type]
  const Icon = config.icon

  return (
    <Drawer open={!!change} onOpenChange={() => onClose()}>
      <DrawerContent className="h-[85dvh] max-h-[85dvh]">
        {/* Header */}
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DrawerTitle className="text-base">Change Details</DrawerTitle>
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Change Type Badge */}
          <div className="flex items-center gap-2">
            <div className={cn("rounded-full p-2", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <span className={cn("font-medium", config.color)}>
              {config.label}
            </span>
          </div>

          {/* Change Description */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Exercise
            </p>
            <div className="rounded-xl border p-4">
              {change.type === 'swap' ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium line-through text-muted-foreground">
                    {change.exerciseName}
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600">
                    {change.newExerciseName}
                  </span>
                </div>
              ) : (
                <p className="font-medium">{change.exerciseName}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {change.description}
              </p>
            </div>
          </div>

          {/* Set Changes (for update type) */}
          {change.type === 'update' && change.setChanges && change.setChanges.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Set Changes
              </p>
              <div className="space-y-2">
                {change.setChanges.map((sc, idx) => (
                  <div key={idx} className="rounded-lg border bg-amber-50/30 p-3 text-sm">
                    <span className="text-muted-foreground">Set {sc.setIndex}: </span>
                    <span className="font-medium">{String(sc.field)} </span>
                    <span className="line-through text-muted-foreground">{String(sc.oldValue)}</span>
                    <ArrowRight className="inline h-3 w-3 mx-1 text-amber-500" />
                    <span className="font-medium text-amber-600">{String(sc.newValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Exercise (for add type) */}
          {change.type === 'add' && change.newExercise && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                New Exercise Sets
              </p>
              <div className="rounded-xl border border-green-200 bg-green-50/30 p-4">
                {change.newExercise.sets.map((set) => (
                  <div key={set.setIndex} className="text-sm text-muted-foreground">
                    Set {set.setIndex}: {set.reps ?? '-'} reps
                    {set.weight && ` @ ${set.weight}kg`}
                    {set.restTime && ` (${set.restTime >= 60 ? `${Math.floor(set.restTime / 60)}m` : `${set.restTime}s`} rest)`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Reasoning</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {change.aiReasoning}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-background p-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
