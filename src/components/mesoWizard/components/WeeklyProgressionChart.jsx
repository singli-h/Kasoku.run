"use client"

import { useEffect, useState } from "react"
import { Info, BarChart3 } from "lucide-react"

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
    <div className="w-full">
      <header className="mb-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <h3 className="text-base sm:text-lg font-semibold">Weekly Progression Chart</h3>
          {modelType && (
            <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full inline-flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {getModelName()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-sm" style={{ background: getIntensityGradient() }}/>
              Intensity
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-sm" style={{ background: getVolumeGradient() }}/>
              Volume
            </span>
          </div>
          <span className="text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Info className="h-3 w-3" />
            Tap to set level
          </span>
        </div>
      </header>

      <div className="relative">
        <div className="overflow-x-auto pb-2 touch-pan-x scrollbar-thin">
          <div className="min-w-[400px] w-full">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b">
                  <th className="w-[8%] py-1.5 font-medium text-center text-xs sticky left-0 bg-white/80">Week</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="w-[9.2%] py-1.5 font-medium text-center text-xs">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localData.map((weekData) => (
                  <tr key={weekData.week} className="border-b last:border-b-2 border-gray-200">
                    <td className="py-1.5 text-center font-medium text-xs sticky left-0 bg-white/80">
                      {weekData.week}
                    </td>
                    <td colSpan={10} className="p-0">
                      <div className="grid grid-cols-10 h-8 sm:h-10">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-full h-full cursor-pointer transition-colors ${
                              i + 1 <= weekData.intensity ? "text-gray-700" : "text-gray-400"
                            }`}
                            style={{
                              backgroundColor: i + 1 <= weekData.intensity ? getIntensityColor(i + 1) : "transparent",
                              transition: "background-color 0.2s ease"
                            }}
                            onClick={() => handleCellClick(weekData.week, "intensity", i + 1)}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-10 h-8 sm:h-10 border-t border-gray-200">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-full h-full cursor-pointer transition-colors ${
                              i + 1 <= weekData.volume ? "text-gray-700" : "text-gray-400"
                            }`}
                            style={{
                              backgroundColor: i + 1 <= weekData.volume ? getVolumeColor(i + 1) : "transparent",
                              transition: "background-color 0.2s ease"
                            }}
                            onClick={() => handleCellClick(weekData.week, "volume", i + 1)}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-between text-xs text-gray-500 px-[8%] pt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyProgressionChart

