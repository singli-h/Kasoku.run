"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { OnboardingData } from "../onboarding-wizard"

const equipmentOptions = [
  { id: "barbell", label: "Barbell & Plates" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "kettlebells", label: "Kettlebells" },
  { id: "pullup-bar", label: "Pull-up Bar" },
  { id: "resistance-bands", label: "Resistance Bands" },
  { id: "cardio-machines", label: "Cardio Machines" },
  { id: "cable-machines", label: "Cable Machines" },
  { id: "bodyweight", label: "Bodyweight Only" },
] as const

const individualFormSchema = z.object({
  trainingGoals: z
    .string()
    .min(10, "Please describe your training goals (at least 10 characters)")
    .max(500, "Training goals must be less than 500 characters"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"], {
    message: "Please select your experience level",
  }),
  availableEquipment: z
    .array(z.string())
    .min(1, "Please select at least one equipment option"),
})

type IndividualFormValues = z.infer<typeof individualFormSchema>

interface IndividualDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

export function IndividualDetailsStep({
  userData,
  updateUserData,
  onNext,
  onPrev,
}: IndividualDetailsStepProps) {
  const form = useForm<IndividualFormValues>({
    resolver: zodResolver(individualFormSchema),
    defaultValues: {
      trainingGoals: userData.individualTrainingGoals || "",
      experienceLevel: (userData.individualExperienceLevel as "beginner" | "intermediate" | "advanced") || undefined,
      availableEquipment: userData.availableEquipment || [],
    },
  })

  function onSubmit(values: IndividualFormValues) {
    updateUserData({
      individualTrainingGoals: values.trainingGoals,
      individualExperienceLevel: values.experienceLevel,
      availableEquipment: values.availableEquipment,
    })
    onNext()
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Tell us about your training
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This helps us personalize your experience and provide better AI assistance
          for your training plans.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mx-auto">
          {/* Training Goals */}
          <FormField
            control={form.control}
            name="trainingGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What are your training goals?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Build strength, improve endurance, lose weight, train for a 5K..."
                    className="min-h-[100px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe what you want to achieve with your training
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Experience Level */}
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What's your experience level?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Beginner</span>
                        <span className="text-xs text-muted-foreground">
                          New to structured training (0-1 years)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Intermediate</span>
                        <span className="text-xs text-muted-foreground">
                          Consistent training experience (1-3 years)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Advanced</span>
                        <span className="text-xs text-muted-foreground">
                          Extensive training background (3+ years)
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Available Equipment */}
          <FormField
            control={form.control}
            name="availableEquipment"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Available Equipment</FormLabel>
                  <FormDescription>
                    Select all the equipment you have access to
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {equipmentOptions.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="availableEquipment"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button type="submit" className="min-w-[120px]">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
