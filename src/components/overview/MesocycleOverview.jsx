"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ChevronDown, ChevronUp, Target, Zap, Activity, Dumbbell, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from "recharts"
import { cn } from "../../lib/utils"
import { mockMesocycle } from "../data/mockData"

export default function MesocycleOverview({ mesocycle = mockMesocycle }) {
  const [expandedWeeks, setExpandedWeeks] = useState([])
  const [hoveredWeek, setHoveredWeek] = useState(null)

  // Calculate mesocycle totals
  const mesocycleStats = {
    totalWeeks: mesocycle.weeks.length,
    totalVolume: mesocycle.weeks.reduce((sum, week) => sum + week.totalVolume, 0),
    avgIntensity: Math.round(mesocycle.weeks.reduce((sum, week) => {
      const intensityValue = parseFloat(week.intensity) || 0;
      return sum + intensityValue;
    }, 0) / mesocycle.weeks.length)
  }

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => 
      prev.includes(weekIndex) ? prev.filter((w) => w !== weekIndex) : [...prev, weekIndex]
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <p className="font-semibold">{label}</p>
          <p className="text-indigo-600"><TrendingUp size={14} className="inline mr-1"/> Volume: {payload[0].value}</p>
          <p className="text-emerald-600"><Zap size={14} className="inline mr-1"/> Intensity: {payload[1].value}%</p>
        </div>
      )
    }
    return null
  }

  const renderIntensityIndicator = (intensity) => {
    const intensityValue = parseFloat(intensity) || 0;
    const intensityLevel = 
      intensityValue >= 80 ? 'High' :
      intensityValue >= 50 ? 'Moderate' : 'Low';

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-block w-3 h-3 rounded-full 
          ${intensityLevel === 'High' ? 'bg-red-500' :
            intensityLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500'}`}
        />
        <span>{intensity}% ({intensityLevel})</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Mesocycle Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <Dumbbell className="text-blue-600" /> Mesocycle Overview
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
              <Target className="w-5 h-5" />
              <span className="font-semibold">Total Weeks</span>
            </div>
            <div className="text-3xl font-bold mt-2 text-blue-600">
              {mesocycleStats.totalWeeks}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">Total Volume</span>
            </div>
            <div className="text-3xl font-bold mt-2 text-purple-600">
              {mesocycleStats.totalVolume.toLocaleString()} kg
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Avg Intensity</span>
            </div>
            <div className="text-3xl font-bold mt-2 text-green-600">
              {mesocycleStats.avgIntensity}%
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown */}
    </div>
  )
}

