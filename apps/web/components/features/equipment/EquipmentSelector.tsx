/**
 * EquipmentSelector - Click-to-select equipment categories
 * Supports quick presets (Bodyweight, Home Gym, Full Gym) and individual category toggles
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dumbbell,
  CircleDot,
  Cable,
  Armchair,
  Weight,
  Cog,
  PersonStanding,
  Check,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Equipment category definitions
export type EquipmentCategory =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "kettlebells"
  | "cables"
  | "machines"
  | "bench"

export interface EquipmentCategoryDef {
  id: EquipmentCategory
  label: string
  description: string
  icon: LucideIcon
  examples: string[]
}

// All available equipment categories
export const EQUIPMENT_CATEGORIES: EquipmentCategoryDef[] = [
  {
    id: "bodyweight",
    label: "Bodyweight",
    description: "No equipment needed",
    icon: PersonStanding,
    examples: ["Pull-up bar", "Dip station", "Resistance bands"],
  },
  {
    id: "dumbbells",
    label: "Dumbbells",
    description: "Free weight essentials",
    icon: Dumbbell,
    examples: ["Fixed dumbbells", "Adjustable dumbbells"],
  },
  {
    id: "barbell",
    label: "Barbell",
    description: "Olympic lifting",
    icon: Weight,
    examples: ["Olympic bar", "Weight plates", "Squat rack"],
  },
  {
    id: "kettlebells",
    label: "Kettlebells",
    description: "Dynamic training",
    icon: CircleDot,
    examples: ["Various weights"],
  },
  {
    id: "cables",
    label: "Cables",
    description: "Cable machines",
    icon: Cable,
    examples: ["Cable machine", "Functional trainer"],
  },
  {
    id: "machines",
    label: "Machines",
    description: "Gym machines",
    icon: Cog,
    examples: ["Leg press", "Chest press", "Lat pulldown"],
  },
  {
    id: "bench",
    label: "Bench",
    description: "Weight bench",
    icon: Armchair,
    examples: ["Flat bench", "Incline bench", "Adjustable"],
  },
]

// Preset definitions
export type EquipmentPreset = "bodyweight-only" | "home-gym" | "full-gym" | "custom"

interface PresetDef {
  id: EquipmentPreset
  label: string
  description: string
  categories: EquipmentCategory[]
}

export const EQUIPMENT_PRESETS: PresetDef[] = [
  {
    id: "bodyweight-only",
    label: "Bodyweight Only",
    description: "No equipment needed",
    categories: ["bodyweight"],
  },
  {
    id: "home-gym",
    label: "Home Gym",
    description: "Dumbbells, bench, basics",
    categories: ["bodyweight", "dumbbells", "bench", "kettlebells"],
  },
  {
    id: "full-gym",
    label: "Full Gym",
    description: "Complete gym access",
    categories: ["bodyweight", "dumbbells", "barbell", "kettlebells", "cables", "machines", "bench"],
  },
]

interface EquipmentSelectorProps {
  value?: EquipmentCategory[]
  onChange?: (categories: EquipmentCategory[]) => void
  defaultValue?: EquipmentCategory[]
  showPresets?: boolean
  showCategories?: boolean
  compact?: boolean
  className?: string
}

export function EquipmentSelector({
  value,
  onChange,
  defaultValue = ["bodyweight", "dumbbells", "bench"],
  showPresets = true,
  showCategories = true,
  compact = false,
  className,
}: EquipmentSelectorProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<EquipmentCategory[]>(defaultValue)

  // Use controlled value if provided, otherwise internal
  const selectedCategories = value ?? internalValue

  // Determine which preset matches current selection
  const currentPreset = useMemo((): EquipmentPreset => {
    for (const preset of EQUIPMENT_PRESETS) {
      const presetSet = new Set(preset.categories)
      const selectedSet = new Set(selectedCategories)
      if (
        presetSet.size === selectedSet.size &&
        [...presetSet].every(cat => selectedSet.has(cat))
      ) {
        return preset.id
      }
    }
    return "custom"
  }, [selectedCategories])

  const handleChange = useCallback((categories: EquipmentCategory[]) => {
    if (onChange) {
      onChange(categories)
    } else {
      setInternalValue(categories)
    }
  }, [onChange])

  const handlePresetSelect = useCallback((presetId: EquipmentPreset) => {
    const preset = EQUIPMENT_PRESETS.find(p => p.id === presetId)
    if (preset) {
      handleChange([...preset.categories])
    }
  }, [handleChange])

  const handleCategoryToggle = useCallback((categoryId: EquipmentCategory) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId]
    handleChange(newCategories)
  }, [selectedCategories, handleChange])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Presets */}
      {showPresets && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Setup</Label>
          <div className={cn(
            "grid gap-2",
            compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"
          )}>
            {EQUIPMENT_PRESETS.map((preset) => {
              const isSelected = currentPreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                    "min-h-[70px] text-center",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="font-semibold text-sm">{preset.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {preset.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Toggles */}
      {showCategories && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {showPresets ? "Or customize:" : "Available Equipment"}
            </Label>
            <span className="text-xs text-muted-foreground">
              {selectedCategories.length} selected
            </span>
          </div>
          <Card>
            <CardContent className="p-2">
              <div className={cn(
                "grid gap-1",
                compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
              )}>
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.id)
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryToggle(category.id)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-md transition-all text-left",
                        "hover:bg-muted/50",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className={cn(
                          "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors flex-shrink-0",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      {/* Icon */}
                      <Icon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />

                      {/* Label and description */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected && "text-primary"
                        )}>
                          {category.label}
                        </div>
                        {!compact && (
                          <div className="text-xs text-muted-foreground truncate">
                            {category.examples.slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Helper to get category labels from IDs
export function getEquipmentLabels(categories: EquipmentCategory[]): string[] {
  return categories.map(id =>
    EQUIPMENT_CATEGORIES.find(c => c.id === id)?.label ?? id
  )
}

// Helper to check if a preset matches
export function matchesPreset(categories: EquipmentCategory[]): EquipmentPreset | null {
  for (const preset of EQUIPMENT_PRESETS) {
    const presetSet = new Set(preset.categories)
    const selectedSet = new Set(categories)
    if (
      presetSet.size === selectedSet.size &&
      [...presetSet].every(cat => selectedSet.has(cat))
    ) {
      return preset.id
    }
  }
  return null
}
