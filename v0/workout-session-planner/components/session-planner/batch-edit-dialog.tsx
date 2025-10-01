"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ALL_FIELDS } from "@/types/session"

interface BatchEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onApply: (field: string, operation: string, value: number | string) => void
  selectionCount: number
}

export function BatchEditDialog({ isOpen, onClose, onApply, selectionCount }: BatchEditDialogProps) {
  const [selectedField, setSelectedField] = useState<string>("")
  const [operation, setOperation] = useState<string>("set")
  const [value, setValue] = useState<string>("")

  const handleApply = () => {
    if (!selectedField || !value) return

    const numValue = operation === "set" ? value : Number(value)
    onApply(selectedField, operation, numValue)
    onClose()
    setSelectedField("")
    setValue("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Batch Edit ({selectionCount} exercises)</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {ALL_FIELDS.map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label} {field.unit && `(${field.unit})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Set to</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="multiply">Multiply by</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter value" />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedField || !value}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}
