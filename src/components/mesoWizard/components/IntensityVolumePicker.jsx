"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const IntensityVolumePicker = ({ label, value, onChange, description }) => {
  const handleChange = (newValue) => {
    onChange(newValue[0])
  }

  // Determine if this is intensity or volume
  const variant = label.toLowerCase().includes('intensity') ? 'intensity' : 'volume';

  // Get color based on value and variant
  const getColorClass = () => {
    if (variant === 'intensity') {
      if (value <= 3) return "text-orange-500"
      if (value <= 7) return "text-orange-600" 
      return "text-red-600"
    } else {
      if (value <= 3) return "text-blue-500"
      if (value <= 7) return "text-indigo-600" 
      return "text-purple-700"
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <Label className="text-base font-medium">{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="ml-2 h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1 mt-1 sm:mt-0">
          <span className={`font-semibold text-lg ${getColorClass()}`}>{value}</span>
          <span className="text-lg text-gray-500">/10</span>
        </div>
      </div>

      <div className="px-1">
        <div className="flex items-center gap-2">
          <div className="min-w-4 h-4 rounded-sm" style={
            variant === 'intensity' 
              ? { background: "linear-gradient(to right, hsla(25, 70%, 62%, 0.7), hsla(0, 90%, 40%, 0.9))" }
              : { background: "linear-gradient(to right, hsla(210, 65%, 65%, 0.7), hsla(270, 85%, 40%, 0.9))" }
          }></div>
          <div className="flex-1">
            <Slider 
              value={[value]} 
              min={1} 
              max={10} 
              step={1} 
              onValueChange={handleChange} 
              className="py-4"
              variant={variant}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 px-1">
        {variant === 'intensity' ? (
          <>
            <span className="font-medium text-orange-500">Low</span>
            <span className="font-medium text-orange-600">Moderate</span>
            <span className="font-medium text-red-600">High</span>
          </>
        ) : (
          <>
            <span className="font-medium text-blue-500">Low</span>
            <span className="font-medium text-indigo-600">Moderate</span>
            <span className="font-medium text-purple-700">High</span>
          </>
        )}
      </div>
    </div>
  )
}

export default IntensityVolumePicker

