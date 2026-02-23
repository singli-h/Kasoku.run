/**
 * Set Configuration Modal - Detailed parameter editing for exercise sets
 * Allows configuration of all available database fields with proper validation
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Plus, 
  Minus, 
  Copy, 
  RotateCcw,
  Calculator,
  Clock,
  Zap,
  Gauge,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Trash2
} from "lucide-react"

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

// Types
import type { SetData, ExerciseInSession } from "./session-planning"
import type { ExerciseWithDetails } from "@/types/training"

interface SetConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: ExerciseInSession
  onSetsUpdate: (sets: SetData[]) => void
  className?: string
}

// Common unit options
const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
  { value: '%1rm', label: '% 1RM' }
]

const DISTANCE_UNITS = [
  { value: 'm', label: 'meters' },
  { value: 'km', label: 'kilometers' },
  { value: 'ft', label: 'feet' },
  { value: 'mi', label: 'miles' }
]

const TIME_UNITS = [
  { value: 's', label: 'seconds' },
  { value: 'min', label: 'minutes' },
  { value: 'h', label: 'hours' }
]

// Preset templates for common exercise types
const SET_TEMPLATES = {
  strength: { reps: 5, rpe: 8, restTime: 180 },
  hypertrophy: { reps: 10, rpe: 7, restTime: 90 },
  endurance: { reps: 15, rpe: 6, restTime: 60 },
  power: { reps: 3, rpe: 9, restTime: 240 },
  cardio: { duration: 300, distance: 1000, effort: 70, restTime: 120 }
}

export function SetConfigurationModal({ 
  open, 
  onOpenChange, 
  exercise, 
  onSetsUpdate,
  className 
}: SetConfigurationModalProps) {
  const [sets, setSets] = useState<SetData[]>(exercise.sets)
  const [activeTab, setActiveTab] = useState("basic")
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof SET_TEMPLATES | null>(null)

  // Add new set
  const addSet = () => {
    const newSet: SetData = {
      setIndex: sets.length + 1,
      reps: sets[sets.length - 1]?.reps || 10,
      weight: sets[sets.length - 1]?.weight || undefined, // Leave weight empty instead of defaulting to 0
      rpe: sets[sets.length - 1]?.rpe || 7,
      restTime: sets[sets.length - 1]?.restTime || 90
    }
    setSets([...sets, newSet])
  }

  // Remove set
  const removeSet = (setIndex: number) => {
    if (sets.length > 1) {
      setSets(sets.filter(set => set.setIndex !== setIndex).map((set, index) => ({
        ...set,
        setIndex: index + 1
      })))
    }
  }

  // Update set parameter
  const updateSetParameter = (setIndex: number, field: keyof SetData, value: any) => {
    setSets(sets.map(set => 
      set.setIndex === setIndex 
        ? { ...set, [field]: value }
        : set
    ))
  }

  // Copy set parameters
  const copySet = (fromIndex: number, toIndex: number) => {
    const sourceSet = sets.find(set => set.setIndex === fromIndex)
    if (sourceSet) {
      setSets(sets.map(set => 
        set.setIndex === toIndex 
          ? { ...sourceSet, setIndex: toIndex }
          : set
      ))
    }
  }

  // Apply template to all sets
  const applyTemplate = (templateKey: keyof typeof SET_TEMPLATES) => {
    const template = SET_TEMPLATES[templateKey]
    setSets(sets.map(set => ({
      ...set,
      ...template
    })))
    setSelectedTemplate(templateKey)
  }

  // Apply progressive overload
  const applyProgressiveOverload = (type: 'weight' | 'reps' | 'rpe', increment: number) => {
    setSets(sets.map((set, index) => ({
      ...set,
      [type]: (set[type] || 0) + (increment * index)
    })))
  }

  // Save and close
  const handleSave = () => {
    onSetsUpdate(sets)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configure Sets: {exercise.exercise.name}
          </DialogTitle>
          <DialogDescription>
            Set detailed parameters for each set including reps, weight, RPE, and advanced metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Templates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Templates</CardTitle>
              <CardDescription>Apply common training protocols to all sets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SET_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant={selectedTemplate === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyTemplate(key as keyof typeof SET_TEMPLATES)}
                    className="capitalize"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progressive Overload Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progressive Overload</CardTitle>
              <CardDescription>Apply automatic progression across sets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyProgressiveOverload('weight', 2.5)}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  +2.5kg per set
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyProgressiveOverload('reps', 1)}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  +1 rep per set
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyProgressiveOverload('rpe', 0.5)}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  +0.5 RPE per set
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sets Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Set Configuration ({sets.length} sets)</h3>
              <Button onClick={addSet} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Set
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="cardio">Cardio</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {sets.map((set) => (
                  <Card key={set.setIndex}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="min-w-[60px]">
                          Set {set.setIndex}
                        </Badge>
                        
                        <div className="grid grid-cols-4 gap-4 flex-1">
                          <div className="space-y-1">
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              min={1}
                              max={999}
                              step={1}
                              value={set.reps || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="1-20"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Weight</Label>
                            <Input
                              type="number"
                              min={0}
                              max={9999}
                              step={0.5}
                              value={set.weight || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="kg/lbs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">RPE</Label>
                            <Input
                              type="number"
                              step={0.5}
                              min={1}
                              max={10}
                              value={set.rpe || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'rpe', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Rest (s)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={600}
                              step={5}
                              value={set.restTime || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'restTime', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {set.setIndex > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySet(set.setIndex - 1, set.setIndex)}
                              title="Copy from previous set"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {sets.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSet(set.setIndex)}
                              className="text-red-600"
                              title="Remove set"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                {sets.map((set) => (
                  <Card key={set.setIndex}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Set {set.setIndex}</Badge>
                          <span className="text-sm text-muted-foreground">Advanced Parameters</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Power
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={9999}
                              value={set.power || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'power', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="Watts"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              Velocity
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={set.velocity || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'velocity', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="m/s"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Effort %
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={set.effort || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'effort', parseInt(e.target.value) || 0)}
                              className="h-8"
                              placeholder="0-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Resistance</Label>
                            <Input
                              type="number"
                              min={0}
                              max={999}
                              step={0.5}
                              value={set.resistance || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'resistance', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="Band/Cable"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Height</Label>
                            <Input
                              type="number"
                              min={0}
                              max={999}
                              value={set.height || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'height', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="cm/inches"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Tempo</Label>
                            <Input
                              type="text"
                              value={set.tempo || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'tempo', e.target.value)}
                              className="h-8"
                              placeholder="3-1-2-0"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="cardio" className="space-y-4">
                {sets.map((set) => (
                  <Card key={set.setIndex}>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Set {set.setIndex}</Badge>
                          <span className="text-sm text-muted-foreground">Cardio Parameters</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Duration
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={86400}
                              step={1}
                              value={set.duration || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'duration', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="Seconds"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Distance</Label>
                            <Input
                              type="number"
                              min={0}
                              max={99999}
                              value={set.distance || ''}
                              onChange={(e) => updateSetParameter(set.setIndex, 'distance', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="h-8"
                              placeholder="Meters"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                {sets.map((set) => (
                  <Card key={set.setIndex}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Set {set.setIndex}</Badge>
                          <Label className="text-sm">Notes & Instructions</Label>
                        </div>
                        <Textarea
                          value={set.notes || ''}
                          onChange={(e) => updateSetParameter(set.setIndex, 'notes', e.target.value)}
                          placeholder="Add specific instructions, form cues, or notes for this set..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSets(exercise.sets)}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button onClick={handleSave}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 