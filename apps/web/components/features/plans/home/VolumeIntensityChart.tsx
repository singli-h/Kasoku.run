"use client"

import { useMemo, useState, useEffect } from "react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"

export interface ChartDataPoint {
  week: number
  weekLabel: string
  volume: number
  intensity: number
  phaseId?: string
  phaseName?: string
}

interface VolumeIntensityChartProps {
  data: ChartDataPoint[]
  selectedPhaseId?: string
  mode: 'macrocycle' | 'mesocycle'
  className?: string
}

// Responsive chart margins hook
const useResponsiveChartMargins = () => {
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    top: 20,
    right: windowWidth < 640 ? 10 : windowWidth < 1024 ? 20 : 30,
    left: windowWidth < 640 ? 10 : 20,
    bottom: 5,
  };
};

// Extracted outside component to maintain stable reference across renders
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <div className="space-y-1">
          <div className="font-medium text-sm">{data.weekLabel}</div>
          {data.phaseName && (
            <div className="text-xs text-gray-500">{data.phaseName}</div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-blue-500 rounded-sm"></div>
            <span className="text-sm">Volume: {data.volume}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Intensity: {data.intensity}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function VolumeIntensityChart({
  data,
  selectedPhaseId,
  mode,
  className
}: VolumeIntensityChartProps) {
  const margins = useResponsiveChartMargins();

  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      ...point,
      // Add phase highlighting for visual connection
      isHighlighted: selectedPhaseId ? point.phaseId === selectedPhaseId : false,
      // Format week labels for better readability
      weekLabel: `W${point.week}`
    }))
  }, [data, selectedPhaseId, mode])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Volume & Intensity Progression
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 bg-blue-500 rounded-sm"></div>
            <span className="text-muted-foreground">Volume (load)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-orange-500 rounded-full"></div>
            <span className="text-muted-foreground">Intensity (effort)</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-48 sm:h-56 md:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={margins}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            {/* X-Axis */}
            <XAxis 
              dataKey="weekLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              interval={mode === 'macrocycle' ? 1 : 0}
            />
            
            {/* Volume Y-Axis (Left) */}
            <YAxis 
              yAxisId="volume"
              orientation="left"
              domain={[0, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            
            {/* Intensity Y-Axis (Right) */}
            <YAxis 
              yAxisId="intensity"
              orientation="right"
              domain={[0, 10]}
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            
            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume Bars */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#3b82f6"
              fillOpacity={0.8}
              radius={[2, 2, 0, 0]}
              stroke="#2563eb"
              strokeWidth={1}
            />
            
            {/* Intensity Line */}
            <Line
              yAxisId="intensity"
              type="monotone"
              dataKey="intensity"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
              animationDuration={300}
              animationEasing="ease-in-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
