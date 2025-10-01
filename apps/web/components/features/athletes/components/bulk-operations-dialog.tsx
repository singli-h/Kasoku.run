/**
 * Bulk Operations Dialog Component
 * Handles bulk operations for athletes (assign, move, remove)
 */

"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
} from "@/actions/training/athlete-actions"
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

  const handleBulkOperation = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "Error",
        description: "No athletes selected",
        variant: "destructive"
      })
      return
    }

    try {
      let result

      switch (bulkOperation.type) {
        case 'assign':
          if (!targetGroupId) return
          result = await bulkAssignAthletesAction(selectedAthletes, targetGroupId)
          break
        case 'move':
          if (!targetGroupId) return
          result = await bulkMoveAthletesAction(selectedAthletes, targetGroupId)
          break
        case 'remove':
          result = await bulkRemoveAthletesAction(selectedAthletes)
          break
        default:
          return
      }

      if (result?.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result?.message || "Operation failed",
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Bulk operation failed",
        variant: "destructive"
      })
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
    if (bulkOperation.type === 'remove') {
      return `Remove ${selectedAthletes.length} selected athletes from their current groups?`
    }
    return `Select the target group for ${selectedAthletes.length} selected athletes.`
  }

  const getButtonText = () => {
    switch (bulkOperation.type) {
      case 'assign': return 'Add to Group'
      case 'move': return 'Move to Group'
      case 'remove': return 'Remove from Groups'
      default: return 'Execute'
    }
  }

  return (
    <Dialog open={bulkOperation.isOpen} onOpenChange={onClose}>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkOperation}
            disabled={bulkOperation.type !== 'remove' && !targetGroupId}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
