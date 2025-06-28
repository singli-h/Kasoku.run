/**
 * Exercise Form
 * Comprehensive form for creating and editing exercises
 */

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { 
  Save, 
  Loader2, 
  X, 
  Plus,
  Video,
  Image,
  FileText
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  FormMessage,
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

// Actions
import { 
  createExerciseAction,
  updateExerciseAction,
  getExerciseTypesAction,
  getTagsAction,
  getUnitsAction,
  addTagsToExerciseAction,
  removeTagsFromExerciseAction
} from "@/actions/training/exercise-actions"

// Types
import type { 
  ExerciseInsert,
  ExerciseUpdate,
  ExerciseWithDetails,
  ExerciseType,
  Tag,
  Unit
} from "@/types/training"
import { cn } from "@/lib/utils"

// Form validation schema
const exerciseFormSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  exercise_type_id: z.number({ required_error: "Exercise type is required" }),
  unit_id: z.number({ required_error: "Unit is required" }),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.number()).optional()
})

type ExerciseFormData = z.infer<typeof exerciseFormSchema>

interface ExerciseFormProps {
  isOpen: boolean
  onClose: () => void
  exercise?: ExerciseWithDetails | null
  onSave: (exercise: any) => void
}

export function ExerciseForm({ isOpen, onClose, exercise, onSave }: ExerciseFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  
  const isEditing = !!exercise

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      exercise_type_id: undefined,
      unit_id: undefined,
      video_url: "",
      tags: []
    }
  })

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [typesResult, tagsResult, unitsResult] = await Promise.all([
          getExerciseTypesAction(),
          getTagsAction(),
          getUnitsAction()
        ])
        
        if (typesResult.isSuccess) {
          setExerciseTypes(typesResult.data)
        }
        
        if (tagsResult.isSuccess) {
          setTags(tagsResult.data)
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
        name: exercise.name,
        description: exercise.description || "",
        exercise_type_id: exercise.exercise_type_id,
        unit_id: exercise.unit_id || undefined,
        video_url: exercise.video_url || ""
      })
      
      setSelectedTags(exercise.tags?.map(tag => tag.id) || [])
    } else {
      form.reset({
        name: "",
        description: "",
        exercise_type_id: undefined,
        unit_id: undefined,
        video_url: ""
      })
      setSelectedTags([])
    }
  }, [exercise, form])

  // Handle tag selection
  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

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
        // Handle tag assignments for new exercises or tag changes for existing ones
        if (selectedTags.length > 0) {
          await addTagsToExerciseAction(result.data.id, selectedTags)
        }

        // Remove tags that were deselected (for existing exercises)
        if (isEditing && exercise?.tags) {
          const currentTagIds = exercise.tags.map(tag => tag.id)
          const tagsToRemove = currentTagIds.filter(tagId => !selectedTags.includes(tagId))
          if (tagsToRemove.length > 0) {
            await removeTagsFromExerciseAction(exercise.id, tagsToRemove)
          }
        }

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

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tags</h3>
              <div className="space-y-2">
                <Label>Select relevant tags</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click tags to add or remove them from this exercise
                </p>
              </div>
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