"use client"

import { memo } from "react"
import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Progression Model Selector Component
 * 
 * Allows users to select a progression model for a training session
 * and configure its parameters.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.session - Current session data
 * @param {Array} props.progressionModels - Available progression models
 * @param {Function} props.handleProgressionModelChange - Function to handle model changes
 * @param {Function} props.handleProgressionValueChange - Function to handle value changes
 * @param {Object} props.errors - Validation errors
 */
const ProgressionModelSelector = memo(({
  session,
  progressionModels,
  handleProgressionModelChange,
  handleProgressionValueChange,
  errors = {}
}) => {
  return (
    <Card className="mt-4 overflow-visible">
      <CardContent className="pt-6 overflow-visible">
        <div className="space-y-4 overflow-visible">
          <div className="flex items-center gap-2 overflow-visible">
            <h3 className="text-base font-medium">Progression Model</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="w-80 max-w-sm">
                  <p>
                    Select a progression model to determine how your training will advance over the mesocycle. Different models are suited for different goals.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <RadioGroup
            value={session.progressionModel}
            onValueChange={(value) => handleProgressionModelChange(session.id, value)}
            className="space-y-3"
          >
            {progressionModels.map((model) => (
              <div key={model.id} className="flex items-start space-x-2">
                <RadioGroupItem value={model.id} id={`model-${model.id}-${session.id}`} className="mt-1" />
                <div className="grid gap-1.5">
                  <Label
                    htmlFor={`model-${model.id}-${session.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {model.name}
                  </Label>
                  <p className="text-sm text-gray-500">{model.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          {session.progressionModel && (
            <div className="mt-4">
              <Label htmlFor={`progression-value-${session.id}`} className="font-medium">
                Progression Details
              </Label>
              <Textarea
                id={`progression-value-${session.id}`}
                value={session.progressionValue || ""}
                onChange={(e) => 
                  handleProgressionValueChange(session.id, session.progressionModel, e.target.value)
                }
                placeholder={
                  progressionModels.find((m) => m.id === session.progressionModel)?.placeholder ||
                  "Describe how this progression will work..."
                }
                className={`mt-2 ${
                  errors[`session-${session.id}-progressionValue`] ? "border-red-500" : ""
                }`}
              />
              {errors[`session-${session.id}-progressionValue`] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors[`session-${session.id}-progressionValue`]}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ProgressionModelSelector.displayName = "ProgressionModelSelector"

export default ProgressionModelSelector 