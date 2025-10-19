/**
 * Exercise Form
 * Comprehensive form for creating and editing exercises
 */

"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

import {
  createExerciseAction,
  updateExerciseAction,
  getExerciseTypesAction,
  getUnitsAction
} from "@/actions/library/exercise-actions"

import type {
  ExerciseInsert,
  ExerciseUpdate,
  ExerciseWithDetails,
  ExerciseType,
  Unit
} from "@/types/training"

// Form validation schema
const exerciseFormSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  exercise_type_id: z.number({ required_error: "Exercise type is required" }),
  unit_id: z.number({ required_error: "Unit is required" }),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal(""))
})

type ExerciseFormData = z.infer<typeof exerciseFormSchema>

interface ExerciseFormProps {
  isOpen: boolean
  onClose: () => void
  exercise?: ExerciseWithDetails | null
  onSave: (exercise: ExerciseWithDetails) => void
}

export function ExerciseForm({ isOpen, onClose, exercise, onSave }: ExerciseFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  
  const isEditing = !!exercise

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercise_type_id: undefined,
      unit_id: undefined,
      video_url: ""
    }
  })

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [typesResult, unitsResult] = await Promise.all([
          getExerciseTypesAction(),
          getUnitsAction()
        ])
        
        if (typesResult.isSuccess) {
          setExerciseTypes(typesResult.data)
        }
        
        if (unitsResult.isSuccess) {
          setUnits(unitsResult.data)
        }
      } catch (error) {
        console.error('Error loading reference data:', error)
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive"
        })
      }
    }

    if (isOpen) {
      loadReferenceData()
    }
  }, [isOpen, toast])

  // Reset form when exercise changes
  useEffect(() => {
    if (exercise) {
      form.reset({
        name: exercise.name || "",
        description: exercise.description || "",
        exercise_type_id: exercise.exercise_type_id || undefined,
        unit_id: exercise.unit_id || undefined,
        video_url: exercise.video_url || ""
      })
    } else {
      form.reset({
        name: "",
        description: "",
        exercise_type_id: undefined,
        unit_id: undefined,
        video_url: ""
      })
    }
  }, [exercise, form])


  // Form submission
  const onSubmit = async (data: ExerciseFormData) => {
    try {
      setIsLoading(true)

      const exerciseData = {
        name: data.name,
        description: data.description || null,
        exercise_type_id: data.exercise_type_id,
        unit_id: data.unit_id,
        video_url: data.video_url || null
      }

      let result
      if (isEditing && exercise) {
        result = await updateExerciseAction(exercise.id, exerciseData as ExerciseUpdate)
      } else {
        result = await createExerciseAction(exerciseData as ExerciseInsert)
      }

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: `Exercise ${isEditing ? 'updated' : 'created'} successfully`
        })

        onSave(result.data)
        onClose()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} exercise`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Exercise' : 'Create New Exercise'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Make changes to the exercise details below'
              : 'Fill in the details to create a new exercise'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bench Press" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the exercise..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief overview of what this exercise involves
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="exercise_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Type *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exerciseTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Media and Resources */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media & Resources</h3>
              
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Video className="h-4 w-4 inline mr-2" />
                      Video URL
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://youtube.com/watch?v=..."
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      YouTube, Vimeo, or other video demonstration link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Update Exercise' : 'Create Exercise'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 