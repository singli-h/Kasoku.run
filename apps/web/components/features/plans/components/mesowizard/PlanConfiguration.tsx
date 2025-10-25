/**
 * MesoWizard - Step 2: Plan Configuration
 * Collects plan metadata and parent linking for mesocycle/microcycle
 */

"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import type { PlanType } from "./plan-type-selection"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Server Actions
import { getMacrocyclesAction } from "@/actions/plans/plan-actions"
import { getMesocyclesByMacrocycleAction } from "@/actions/plans/plan-actions"
import { getCoachAthleteGroupsAction } from "@/actions/athletes/athlete-actions"

const configSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  macrocycleId: z.number().optional(),
  mesocycleId: z.number().optional(),
  athleteGroupId: z.number().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type ConfigFormData = z.infer<typeof configSchema>

interface PlanConfigurationProps {
  planType: PlanType
  onComplete: (data: ConfigFormData) => void
  onBack: () => void
}

export function PlanConfiguration({ planType, onComplete, onBack }: PlanConfigurationProps) {
  const { toast } = useToast()
  const [macrocycles, setMacrocycles] = useState<any[]>([])
  const [mesocycles, setMesocycles] = useState<any[]>([])
  const [athleteGroups, setAthleteGroups] = useState<any[]>([])
  const [selectedMacrocycleId, setSelectedMacrocycleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")

  // Load parent options based on plan type
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load athlete groups for all plan types
        const groupsResult = await getCoachAthleteGroupsAction()
        if (groupsResult.isSuccess && groupsResult.data) {
          setAthleteGroups(groupsResult.data)
        }

        // Load macrocycles if creating mesocycle or microcycle
        if (planType === 'mesocycle' || planType === 'microcycle') {
          const macrosResult = await getMacrocyclesAction()
          if (macrosResult.isSuccess && macrosResult.data) {
            setMacrocycles(macrosResult.data)
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [planType, toast])

  // Load mesocycles when macrocycle selected (for microcycle creation)
  useEffect(() => {
    async function loadMesocycles() {
      if (planType === 'microcycle' && selectedMacrocycleId) {
        try {
          const result = await getMesocyclesByMacrocycleAction(selectedMacrocycleId)
          if (result.isSuccess && result.data) {
            setMesocycles(result.data)
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load mesocycles. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    loadMesocycles()
  }, [planType, selectedMacrocycleId, toast])

  const onSubmit = (data: ConfigFormData) => {
    onComplete(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure {planType.charAt(0).toUpperCase() + planType.slice(1)}</CardTitle>
        <CardDescription>
          Set up the basic details for your training plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Parent Macrocycle Selection (for Mesocycle) */}
          {planType === 'mesocycle' && (
            <div className="space-y-2">
              <Label htmlFor="macrocycleId">
                Parent Macrocycle <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("macrocycleId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a macrocycle" />
                </SelectTrigger>
                <SelectContent>
                  {macrocycles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No macrocycles found. Create one first.
                    </div>
                  ) : (
                    macrocycles.map((macro) => (
                      <SelectItem key={macro.id} value={macro.id.toString()}>
                        {macro.name} ({format(new Date(macro.start_date), 'MMM d')} - {format(new Date(macro.end_date), 'MMM d, yyyy')})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.macrocycleId && (
                <p className="text-sm text-destructive">{errors.macrocycleId.message}</p>
              )}
            </div>
          )}

          {/* Parent Mesocycle Selection (for Microcycle) */}
          {planType === 'microcycle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="macrocycleId">
                  Parent Macrocycle <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => {
                    const id = parseInt(value)
                    setSelectedMacrocycleId(id)
                    setValue("macrocycleId", id)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a macrocycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {macrocycles.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No macrocycles found. Create one first.
                      </div>
                    ) : (
                      macrocycles.map((macro) => (
                        <SelectItem key={macro.id} value={macro.id.toString()}>
                          {macro.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mesocycleId">
                  Parent Mesocycle <span className="text-destructive">*</span>
                </Label>
                <Select
                  disabled={!selectedMacrocycleId}
                  onValueChange={(value) => setValue("mesocycleId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedMacrocycleId ? "Select a mesocycle" : "Select macrocycle first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {mesocycles.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No mesocycles found in this macrocycle.
                      </div>
                    ) : (
                      mesocycles.map((meso) => (
                        <SelectItem key={meso.id} value={meso.id.toString()}>
                          {meso.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.mesocycleId && (
                  <p className="text-sm text-destructive">{errors.mesocycleId.message}</p>
                )}
              </div>
            </>
          )}

          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Plan Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={`e.g., Fall ${planType.charAt(0).toUpperCase() + planType.slice(1)}`}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the goals and focus of this training plan..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setValue("startDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && (
              <p className="text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>
              End Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setValue("endDate", date)}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            )}
          </div>

          {/* Athlete Group (Optional for all types) */}
          <div className="space-y-2">
            <Label htmlFor="athleteGroupId">Assign to Athlete Group (Optional)</Label>
            <Select
              onValueChange={(value) => setValue("athleteGroupId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="None - assign later" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None - assign later</SelectItem>
                {athleteGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.group_name} ({group.athlete_count || 0} athletes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to Sessions'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
