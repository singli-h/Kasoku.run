"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"

/** Preset phase options with descriptions coaches can understand */
const PHASE_PRESETS = [
  { value: "GPP", label: "GPP - General Preparation", hint: "Build general fitness foundation — strength, endurance, flexibility" },
  { value: "SPP", label: "SPP - Specific Preparation", hint: "Train race-specific skills — starts, speed endurance, technique" },
  { value: "Taper", label: "Taper", hint: "Reduce volume to peak for competition" },
  { value: "Competition", label: "Competition", hint: "Race period — maintain fitness, compete" },
] as const

export interface MesocycleFormData {
  id?: number
  macrocycle_id?: number | null
  user_id?: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  metadata: {
    phase?: string
    color?: string
    deload?: boolean
  } | null
}

interface EditMesocycleDialogProps {
  mesocycle: MesocycleFormData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (mesocycle: MesocycleFormData) => void
  onDelete?: (id: number) => void
}

export function EditMesocycleDialog({ mesocycle, open, onOpenChange, onSave, onDelete }: EditMesocycleDialogProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [showPhasePresets, setShowPhasePresets] = useState(false)
  const phaseInputRef = useRef<HTMLInputElement>(null)
  const presetsRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<MesocycleFormData>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    metadata: {
      phase: "GPP",
      color: "#10b981",
      deload: false
    }
  })

  useEffect(() => {
    if (mesocycle) {
      setFormData(mesocycle)
    } else {
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        metadata: {
          phase: "GPP",
          color: "#10b981",
          deload: false
        }
      })
    }
  }, [mesocycle, open])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (mesocycle?.id && onDelete) {
      setDeleteConfirmOpen(true)
    }
  }

  const confirmDelete = () => {
    if (mesocycle?.id && onDelete) {
      onDelete(mesocycle.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mesocycle ? "Edit Mesocycle" : "Add Mesocycle"}</DialogTitle>
            <DialogDescription>
              {mesocycle
                ? "Update the mesocycle details for this training phase."
                : "Create a new mesocycle to organize your training phases."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name and Phase Type - stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Mesocycle Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., General Preparation Phase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase">Phase Type</Label>
                <div className="relative">
                  <Input
                    ref={phaseInputRef}
                    id="phase"
                    value={formData.metadata?.phase || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, phase: e.target.value }
                    })}
                    onFocus={() => setShowPhasePresets(true)}
                    onBlur={(e) => {
                      // Delay hide so preset clicks register
                      if (!presetsRef.current?.contains(e.relatedTarget as Node)) {
                        setTimeout(() => setShowPhasePresets(false), 150)
                      }
                    }}
                    placeholder="e.g., GPP, Indoor, Recovery"
                  />
                  {showPhasePresets && (
                    <div
                      ref={presetsRef}
                      className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md"
                    >
                      <div className="p-1.5">
                        <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Presets</p>
                        {PHASE_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
                              formData.metadata?.phase === preset.value && "bg-accent"
                            )}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                metadata: { ...formData.metadata, phase: preset.value }
                              })
                              setShowPhasePresets(false)
                            }}
                          >
                            <span className="font-medium">{preset.label}</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5">{preset.hint}</span>
                          </button>
                        ))}
                        <p className="px-2 pt-1.5 pb-0.5 text-[10px] text-muted-foreground">
                          Or type your own phase name above
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the focus and goals of this mesocycle"
                rows={3}
              />
            </div>

            {/* Dates and Color - stack on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.metadata?.color || "#10b981"}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, color: e.target.value }
                    })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{formData.metadata?.color || "#10b981"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - mobile-friendly button layout */}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {mesocycle?.id && onDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-full sm:w-auto order-last sm:order-first"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="w-full sm:w-auto"
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete mesocycle?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this mesocycle? This will also delete all associated microcycles and sessions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
