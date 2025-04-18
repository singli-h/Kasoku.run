"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import  Button  from "../ui/button"
import { ChevronDown, ChevronUp, Target, Zap, Activity, Dumbbell, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from "recharts"
import { cn } from "../../lib/utils"
import { useBrowserSupabaseClient } from '@/lib/supabase'
import { dashboardApi } from '@/lib/supabase-api'

export default function MesocycleOverview() {
  const [mesocycle, setMesocycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedWeeks, setExpandedWeeks] = useState([])
  const [hoveredWeek, setHoveredWeek] = useState(null)
  const supabase = useBrowserSupabaseClient()

  useEffect(() => {
    const fetchMesocycle = async () => {
      try {
        setLoading(true)
        const { data, error } = await dashboardApi.getMesocycle(supabase)
        if (error) throw error
        setMesocycle(data)
      } catch (err) {
        console.error('Error fetching mesocycle:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMesocycle()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!mesocycle) return <div>No mesocycle data available</div>

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
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="text-blue-500" /> Weekly Breakdown
        </h3>
        
        {mesocycle.weeks.map((week, index) => (
          <Card 
            key={index} 
            className="w-full transition-all hover:shadow-lg"
            onMouseEnter={() => setHoveredWeek(index)}
            onMouseLeave={() => setHoveredWeek(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  hoveredWeek === index ? "bg-blue-100" : "bg-gray-100"
                )}>
                  <span className="font-medium text-blue-600">W{index + 1}</span>
                </div>
                <CardTitle className="text-lg font-semibold">
                  {week.name || `Week ${index + 1}`}
                </CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleWeek(index)}
                className="rounded-full"
              >
                {expandedWeeks.includes(index) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Total Volume</label>
                  <p className="text-lg font-semibold">{week.totalVolume.toLocaleString()} kg</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Intensity</label>
                  <div className="text-lg font-semibold">
                    {renderIntensityIndicator(week.intensity)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {week.mainObjectives?.split(',').map((obj, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {obj.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {expandedWeeks.includes(index) && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Weekly Progression
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={week.progression}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#6b7280' }}
                          label={{ 
                            value: 'Training Days', 
                            position: 'bottom', 
                            fill: '#4b5563',
                            fontSize: 14
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: '#6b7280' }}
                          label={{
                            value: 'Volume (kg)',
                            angle: -90,
                            position: 'left',
                            fill: '#4b5563',
                            fontSize: 14
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fill: '#6b7280' }}
                          label={{
                            value: 'Intensity (%)',
                            angle: 90,
                            position: 'right',
                            fill: '#4b5563',
                            fontSize: 14
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: 20 }}
                          formatter={(value) => (
                            <span className="text-gray-600">{value}</span>
                          )}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="volume" 
                          name="Training Volume"
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="intensity" 
                          name="Intensity Level"
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#059669', strokeWidth: 2 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {week.notes && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Coach Notes</h4>
                      <p className="text-blue-700">{week.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

