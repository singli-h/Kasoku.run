"use client"

import { useEffect, useState } from "react"
import { Info, BarChart3 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const WeeklyProgressionChart = ({ data = [], onChange = () => {}, modelType = null }) => {
  const [localData, setLocalData] = useState(data || [])

  // Update local data when prop data changes
  useEffect(() => {
    setLocalData(data || [])
  }, [data])

  // Handle cell click to update intensity or volume
  const handleCellClick = (week, type, level) => {
    if (!localData) return;
    
    const newData = [...localData]
    const weekIndex = newData.findIndex((w) => w.week === week)

    if (weekIndex !== -1) {
      newData[weekIndex][type] = level
      setLocalData(newData)
      onChange(newData)
    }
  }

  // Generate color based on level (1-10) using smooth HSL values
  const getIntensityColor = (level) => {
    // Map the level (1-10) to a ratio (0-1)
    const ratio = (level - 1) / 9;
    
    // Orange (25) to Red (0) gradient with dynamic lightness and saturation
    const startHue = 25; // Orange
    const endHue = 0; // Red
    const hue = startHue - (startHue - endHue) * ratio;
    
    // Higher levels = slightly more saturated and darker
    const saturation = 60 + ratio * 15; // 60% to 75%
    const lightness = 65 - ratio * 20; // 65% to 45%
    const opacity = 0.55 + ratio * 0.35; // 0.55 to 0.9
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  const getVolumeColor = (level) => {
    // Map the level (1-10) to a ratio (0-1)
    const ratio = (level - 1) / 9;
    
    // Blue (210) to Purple (270) gradient with dynamic lightness and saturation
    const startHue = 210; // Blue
    const endHue = 270; // Purple
    const hue = startHue + (endHue - startHue) * ratio;
    
    // Higher levels = slightly more saturated and darker
    const saturation = 60 + ratio * 15; // 60% to 75%
    const lightness = 65 - ratio * 20; // 65% to 45% 
    const opacity = 0.55 + ratio * 0.35; // 0.55 to 0.9
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  // Get gradient styles for the legend
  const getIntensityGradient = () => {
    return `linear-gradient(to right, 
      hsla(25, 70%, 62%, 0.7), 
      hsla(0, 90%, 40%, 0.9)
    )`;
  }

  const getVolumeGradient = () => {
    return `linear-gradient(to right, 
      hsla(210, 65%, 65%, 0.7), 
      hsla(270, 85%, 40%, 0.9)
    )`;
  }

  // Get the model name based on modelType
  const getModelName = () => {
    if (!modelType) return null;
    
    const modelNames = {
      linear: "Linear Progression",
      undulating: "Undulating Progression",
      accumulation: "Accumulation Phase",
      transmutation: "Transmutation Phase",
      realization: "Realization Phase"
    };
    
    return modelNames[modelType] || "Custom Model";
  }

  // If no data, return empty component
  if (!localData || localData.length === 0) {
    return <div className="p-4 text-center text-gray-500">No progression data available.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Weekly Progression Grid</h3>
          {modelType && (
            <div className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>{getModelName()}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 w-fit">
          <Info className="h-3.5 w-3.5" />
          <span>Click on any cell to set the level</span>
        </div>
      </div>

      {/* Legend moved above the grid */}
      <div className="flex items-center gap-4 text-sm mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-3 rounded-sm" 
            style={{ background: getIntensityGradient() }}
          ></div>
          <span>Intensity</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-3 rounded-sm"
            style={{ background: getVolumeGradient() }}
          ></div>
          <span>Volume</span>
        </div>
      </div>

      {/* Use scaling approach with proper percentages instead of fixed width */}
      <div className="w-full">
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            {/* Header row with level numbers */}
            <thead>
              <tr className="border-b">
                <th className="w-[12%] p-2 font-medium text-center text-sm">Week</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="p-1 sm:p-2 text-center font-medium w-[8.8%] text-xs sm:text-sm">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Grid rows for each week */}
              {localData.map((weekData) => (
                <tr key={weekData.week} className="border-b last:border-b-2 border-gray-200">
                  {/* Week cell */}
                  <td className="w-[12%] border-r border-gray-200 py-4 sm:py-6 text-center font-medium text-sm">
                    {weekData.week}
                  </td>
                  
                  {/* Intensity row embedded in a cell that spans all columns */}
                  <td colSpan={10} className="p-0">
                    <div className="grid grid-cols-10 h-8 sm:h-10">
                      {Array.from({ length: 10 }, (_, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-full h-full cursor-pointer transition-colors border-r last:border-r-0 ${
                                  i + 1 <= weekData.intensity ? "text-gray-700" : "text-gray-400"
                                }`}
                                style={{
                                  backgroundColor: i + 1 <= weekData.intensity ? getIntensityColor(i + 1) : "transparent",
                                  transition: "background-color 0.3s ease-in-out"
                                }}
                                onClick={() => handleCellClick(weekData.week, "intensity", i + 1)}
                              >
                                &nbsp;
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Week {weekData.week} Intensity: {Math.min(i + 1, weekData.intensity)}/10
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    
                    {/* Volume row */}
                    <div className="grid grid-cols-10 h-8 sm:h-10 border-t border-gray-200">
                      {Array.from({ length: 10 }, (_, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-full h-full cursor-pointer transition-colors border-r last:border-r-0 ${
                                  i + 1 <= weekData.volume ? "text-gray-700" : "text-gray-400"
                                }`}
                                style={{
                                  backgroundColor: i + 1 <= weekData.volume ? getVolumeColor(i + 1) : "transparent",
                                  transition: "background-color 0.3s ease-in-out"
                                }}
                                onClick={() => handleCellClick(weekData.week, "volume", i + 1)}
                              >
                                &nbsp;
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Week {weekData.week} Volume: {Math.min(i + 1, weekData.volume)}/10
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
        <span>Lower Intensity/Volume</span>
        <span>Higher Intensity/Volume</span>
      </div>
    </div>
  )
}

export default WeeklyProgressionChart

