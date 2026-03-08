"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import {
  getAssignmentCountForMacrocycle,
  bulkCancelAssignmentsForMacrocycle,
  deleteMacrocycleAction,
} from "@/actions/plans/plan-actions"

interface DeletePlanDialogProps {
  macrocycleId: number
  planName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeletePlanDialog({
  macrocycleId,
  planName,
  open,
  onOpenChange,
  onDeleted,
}: DeletePlanDialogProps) {
  const [assignmentCount, setAssignmentCount] = useState<number | null>(null)
  const [athleteNames, setAthleteNames] = useState<string[]>([])
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setAssignmentCount(null)
      setAthleteNames([])
      setError(null)
      setIsRemoving(false)
      setIsDeleting(false)
      return
    }

    async function fetchCount() {
      setIsLoadingCount(true)
      setError(null)
      const result = await getAssignmentCountForMacrocycle(macrocycleId)
      if (result.isSuccess && result.data) {
        setAssignmentCount(result.data.count)
        setAthleteNames(result.data.athleteNames)
      } else {
        setError(result.message)
      }
      setIsLoadingCount(false)
    }

    fetchCount()
  }, [open, macrocycleId])

  const hasAssignments = assignmentCount !== null && assignmentCount > 0

  const handleRemoveAssignments = async () => {
    setIsRemoving(true)
    setError(null)
    const result = await bulkCancelAssignmentsForMacrocycle(macrocycleId)
    if (result.isSuccess) {
      setAssignmentCount(0)
      setAthleteNames([])
    } else {
      setError(result.message)
    }
    setIsRemoving(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteMacrocycleAction(macrocycleId)
    if (result.isSuccess) {
      onOpenChange(false)
      onDeleted()
    } else {
      setError(result.message)
      setIsDeleting(false)
    }
  }

  const isLoading = isLoadingCount || isRemoving || isDeleting

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{planName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isLoadingCount ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking assignments...
                </div>
              ) : hasAssignments ? (
                <>
                  <div className="flex items-start gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      This plan is currently assigned to {assignmentCount} athlete(s).
                      Remove assignments before deleting.
                    </span>
                  </div>
                  {athleteNames.length > 0 && (
                    <p className="text-sm text-muted-foreground pl-6">
                      {athleteNames.join(", ")}
                    </p>
                  )}
                </>
              ) : (
                <p>This action is permanent and cannot be undone.</p>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          {hasAssignments ? (
            <Button
              variant="outline"
              onClick={handleRemoveAssignments}
              disabled={isLoading}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove All Assignments"
              )}
            </Button>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading || assignmentCount === null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
