"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SetParameter } from "../types"

interface BatchEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onApply: (field: keyof SetParameter, operation: string, value: number | string) => void
  selectionCount: number
}

export function BatchEditDialog({ isOpen, onClose, onApply, selectionCount }: BatchEditDialogProps) {
  const [field, setField] = useState<keyof SetParameter>("reps")
  const [operation, setOperation] = useState<"set" | "add" | "multiply">("set")
  const [value, setValue] = useState<string>("")

  const handleApply = () => {
    if (!value) return

    const numValue = ["reps", "weight", "rest_time", "rpe", "distance", "performing_time"].includes(field)
      ? parseFloat(value)
      : value

    onApply(field, operation, numValue)
    handleClose()
  }

  const handleClose = () => {
    setField("reps")
    setOperation("set")
    setValue("")
    onClose()
  }

  // Determine if operation selector should be shown (only for numeric fields)
  const isNumericField = ["reps", "weight", "rest_time", "rpe", "distance", "performing_time"].includes(
    field,
  )

  // Get placeholder and input type based on field
  const getFieldConfig = () => {
    switch (field) {
      case "reps":
        return { placeholder: "10", type: "number", label: "Reps" }
      case "weight":
        return { placeholder: "20.5", type: "number", label: "Weight (kg)", step: "0.5" }
      case "rest_time":
        return { placeholder: "90", type: "number", label: "Rest Time (seconds)" }
      case "rpe":
        return { placeholder: "7", type: "number", label: "RPE (1-10)", min: "1", max: "10" }
      case "tempo":
        return { placeholder: "2-0-2-0", type: "text", label: "Tempo" }
      case "distance":
        return { placeholder: "100", type: "number", label: "Distance (meters)" }
      case "performing_time":
        return { placeholder: "30", type: "number", label: "Time (seconds)" }
      default:
        return { placeholder: "", type: "text", label: field }
    }
  }

  const fieldConfig = getFieldConfig()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Edit Sets</DialogTitle>
          <DialogDescription>
            Apply changes to all sets in {selectionCount} selected exercise{selectionCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label htmlFor="field">Parameter</Label>
            <Select value={field} onValueChange={(value) => setField(value as keyof SetParameter)}>
              <SelectTrigger id="field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reps">Reps</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="rest_time">Rest Time</SelectItem>
                <SelectItem value="rpe">RPE</SelectItem>
                <SelectItem value="tempo">Tempo</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="performing_time">Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation Selection (only for numeric fields) */}
          {isNumericField && (
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={operation}
                onValueChange={(value) => setOperation(value as "set" | "add" | "multiply")}
              >
                <SelectTrigger id="operation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to</SelectItem>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="multiply">Multiply by</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="value">{fieldConfig.label}</Label>
            <Input
              id="value"
              type={fieldConfig.type}
              placeholder={fieldConfig.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step={fieldConfig.step}
              min={fieldConfig.min}
              max={fieldConfig.max}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply()
                if (e.key === "Escape") handleClose()
              }}
            />
          </div>

          {/* Example Preview */}
          {isNumericField && value && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Example:</strong>{" "}
              {operation === "set" && `All sets will have ${field} = ${value}`}
              {operation === "add" && `All sets will have ${field} increased by ${value}`}
              {operation === "multiply" && `All sets will have ${field} multiplied by ${value}`}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!value}>
            Apply to {selectionCount} Exercise{selectionCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
