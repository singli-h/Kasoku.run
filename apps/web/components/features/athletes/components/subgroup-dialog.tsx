/**
 * Subgroup Dialog Component
 * Dialog overlay for editing athlete subgroups (multi-select)
 */

"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { updateAthleteProfileAction } from "@/actions/athletes/athlete-actions"
import type { Subgroup } from "../types"

interface SubgroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  athleteName: string
  userId: number | null
  currentValues: string[]
  subgroups: Subgroup[]
  onSaved: (userId: number, newGroups: string[] | null) => void
  onError?: () => void
}

export function SubgroupDialog({
  open,
  onOpenChange,
  athleteName,
  userId,
  currentValues,
  subgroups,
  onSaved,
  onError,
}: SubgroupDialogProps) {
  const [selected, setSelected] = useState<string[]>(currentValues)
  const { toast } = useToast()

  // Reset selection when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelected(currentValues)
    }
    onOpenChange(isOpen)
  }

  const handleToggle = (abbreviation: string) => {
    setSelected(prev =>
      prev.includes(abbreviation)
        ? prev.filter(g => g !== abbreviation)
        : [...prev, abbreviation]
    )
  }

  const handleSave = async () => {
    if (!userId) return
    const newGroups = selected.length > 0 ? selected : null

    // Optimistic: update parent state and close immediately
    onSaved(userId, newGroups)
    onOpenChange(false)

    // Background: persist to server
    const result = await updateAthleteProfileAction(userId, {
      subgroups: newGroups,
    })

    if (!result.isSuccess) {
      toast({ title: "Error", description: result.message, variant: "destructive" })
      onError?.()
    }
  }

  const hasChanges =
    selected.length !== currentValues.length ||
    selected.some(g => !currentValues.includes(g))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subgroups</DialogTitle>
          <DialogDescription>
            Select subgroups for {athleteName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-1">
          {subgroups.length > 0 ? (
            subgroups.map((sg) => {
              const isChecked = selected.includes(sg.abbreviation)
              return (
                <div
                  key={sg.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggle(sg.abbreviation)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleToggle(sg.abbreviation)
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left cursor-pointer",
                    isChecked
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(sg.abbreviation)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{sg.abbreviation}</span>
                    <span className="text-muted-foreground"> — {sg.name}</span>
                  </div>
                  {isChecked && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No subgroups defined. Create subgroups first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
