/**
 * Bulk Operations Dialog Component
 * Handles bulk operations for athletes (assign, move, remove)
 */

"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  bulkAssignAthletesAction,
  bulkMoveAthletesAction,
  bulkRemoveAthletesAction
} from "@/actions/athletes/athlete-actions"
import type { BulkOperationState, GroupWithCount } from "../types"

interface BulkOperationsDialogProps {
  bulkOperation: BulkOperationState
  onClose: () => void
  selectedAthletes: number[]
  groups: GroupWithCount[]
  onSuccess: () => void
}

export function BulkOperationsDialog({
  bulkOperation,
  onClose,
  selectedAthletes,
  groups,
  onSuccess
}: BulkOperationsDialogProps) {
  const { toast } = useToast()
  const [targetGroupId, setTargetGroupId] = useState<number | undefined>(bulkOperation.targetGroupId)
  const [removeConfirmed, setRemoveConfirmed] = useState(false)

  // Use athleteIds from bulk operation state if provided (single athlete from dropdown),
  // otherwise use the selectedAthletes prop (bulk selection via checkboxes)
  const effectiveAthleteIds = bulkOperation.athleteIds ?? selectedAthletes

  const handleBulkOperation = async () => {
    if (effectiveAthleteIds.length === 0) {
      toast({
        title: "Error",
        description: "No athletes selected",
        variant: "destructive"
      })
      return
    }

    // Require confirmation for remove operation
    if (bulkOperation.type === 'remove' && !removeConfirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm you understand the consequences",
        variant: "destructive"
      })
      return
    }

    // Capture values before closing (state resets on close)
    const ids = [...effectiveAthleteIds]
    const groupId = targetGroupId
    const opType = bulkOperation.type

    // Close dialog immediately
    handleClose()

    try {
      let result

      switch (opType) {
        case 'assign':
          if (!groupId) return
          result = await bulkAssignAthletesAction(ids, groupId)
          break
        case 'move':
          if (!groupId) return
          result = await bulkMoveAthletesAction(ids, groupId)
          break
        case 'remove':
          result = await bulkRemoveAthletesAction(ids)
          break
        default:
          return
      }

      if (result?.isSuccess) {
        toast({ title: "Success", description: result.message })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: result?.message || "Operation failed",
          variant: "destructive"
        })
      }
    } catch {
      toast({ title: "Error", description: "Bulk operation failed", variant: "destructive" })
    }
  }

  const getTitle = () => {
    switch (bulkOperation.type) {
      case 'assign': return 'Add Athletes to Group'
      case 'move': return 'Move Athletes to Group'
      case 'remove': return 'Remove Athletes from Groups'
      default: return 'Bulk Operation'
    }
  }

  const getDescription = () => {
    const count = effectiveAthleteIds.length
    const athleteText = count === 1 ? 'athlete' : 'athletes'
    if (bulkOperation.type === 'remove') {
      return `Remove ${count} selected ${athleteText} from their current groups?`
    }
    return `Select the target group for ${count} selected ${athleteText}.`
  }

  const getButtonText = () => {
    switch (bulkOperation.type) {
      case 'assign': return 'Add to Group'
      case 'move': return 'Move to Group'
      case 'remove': return 'Remove from Groups'
      default: return 'Execute'
    }
  }

  // Reset confirmation when dialog opens/closes
  const handleClose = () => {
    setRemoveConfirmed(false)
    setTargetGroupId(undefined)
    onClose()
  }

  return (
    <Dialog open={bulkOperation.isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {bulkOperation.type !== 'remove' && (
          <div className="py-4">
            <Label>Target Group</Label>
            <Select
              value={targetGroupId?.toString() || ""}
              onValueChange={(value) => setTargetGroupId(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.group_name} ({group.athlete_count} athletes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Warning and confirmation for remove operation */}
        {bulkOperation.type === 'remove' && (
          <div className="py-4 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: This action has consequences</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  Removing athletes from groups will make them <strong>invisible</strong> in your roster
                  until you re-invite them using their email address.
                </p>
                <p className="text-sm">
                  You can always re-add them later by using the &quot;Invite&quot; feature with their email.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-remove"
                checked={removeConfirmed}
                onCheckedChange={(checked) => setRemoveConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm-remove"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that removed athletes will be hidden from my roster
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkOperation}
            disabled={
              effectiveAthleteIds.length === 0 ||
              (bulkOperation.type !== 'remove' && !targetGroupId) ||
              (bulkOperation.type === 'remove' && !removeConfirmed)
            }
            variant={bulkOperation.type === 'remove' ? 'destructive' : 'default'}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
