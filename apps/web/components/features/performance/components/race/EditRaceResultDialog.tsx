"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  updateRaceResultAction,
  type RaceResult,
  type RaceResultMetadata,
} from "@/actions/performance/race-result-actions"
import { RaceResultForm, type RaceResultFormData } from "./RaceResultForm"

interface EditRaceResultDialogProps {
  result: RaceResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditRaceResultDialog({
  result,
  open,
  onOpenChange,
  onSuccess,
}: EditRaceResultDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<RaceResultFormData>({
    eventId: null,
    value: null,
    date: "",
    indoor: false,
    wind: null,
  })
  const { toast } = useToast()

  // Populate form when result changes
  useEffect(() => {
    if (result) {
      const metadata = result.metadata as RaceResultMetadata | null
      setFormData({
        eventId: result.event_id,
        value: result.value,
        date: result.achieved_date,
        indoor: metadata?.indoor ?? false,
        wind: metadata?.wind ?? null,
      })
    }
  }, [result])

  async function handleSubmit() {
    if (!result) return

    // Validation
    if (!formData.eventId) {
      toast({ title: "Please select an event", variant: "destructive" })
      return
    }
    if (formData.value === null || isNaN(formData.value)) {
      toast({ title: "Please enter a valid result", variant: "destructive" })
      return
    }
    if (!formData.date) {
      toast({ title: "Please select a date", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await updateRaceResultAction({
        id: result.id,
        eventId: formData.eventId,
        value: formData.value,
        date: formData.date,
        indoor: formData.indoor,
        wind: formData.wind,
      })

      if (response.isSuccess) {
        toast({
          title: response.message,
          description: response.message.includes("personal best")
            ? "Congratulations!"
            : undefined,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({ title: response.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to update result", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Race Result</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RaceResultForm
            data={formData}
            onChange={setFormData}
            disabled={loading}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
