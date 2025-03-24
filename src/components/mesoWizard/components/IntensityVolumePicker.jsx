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

  const getLabel = () => {
    if (value <= 3) return "Low"
    if (value <= 7) return "Moderate" 
    return "High"
  }

  // Get gradient style for the badge
  const getBadgeStyle = () => {
    if (variant === 'intensity') {
      return "bg-gradient-to-r from-orange-50 to-red-50 text-red-600";
    } else {
      return "bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-1">
          <span className={`font-semibold text-lg ${getColorClass()}`}>{value}</span>
          <span className="text-lg text-gray-500">/10</span>
          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getBadgeStyle()}`}>
            {getLabel()}
          </span>
        </div>
      </div>

      <Slider 
        value={[value]} 
        min={1} 
        max={10} 
        step={1} 
        onValueChange={handleChange} 
        className="py-4"
        variant={variant}
      />

      <div className="flex justify-between text-xs text-gray-500">
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

