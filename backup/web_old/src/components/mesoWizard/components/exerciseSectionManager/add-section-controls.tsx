"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus } from "lucide-react"

interface AddSectionControlsProps {
  availableSectionTypes: string[]
  onAddSection: (sectionType: string) => void
}

export function AddSectionControls({ availableSectionTypes, onAddSection }: AddSectionControlsProps) {
  const sectionTypeLabels: Record<string, string> = {
    warmup: "🔥 Warmup",
    gym: "🏋️ Gym",
    plyometric: "⚡ Plyometric",
    isometric: "💪 Isometric",
    circuit: "🔄 Circuit",
    sprint: "🏃 Sprint",
    drill: "🎯 Drill",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableSectionTypes.map((type) => (
          <DropdownMenuItem key={type} onClick={() => onAddSection(type)}>
            {sectionTypeLabels[type] || type}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
