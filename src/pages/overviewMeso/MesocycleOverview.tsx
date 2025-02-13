"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card"
import Button from "../../components/common/Button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const MesocycleOverview = ({ mesocycle }: { mesocycle: any }) => {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([])

  const toggleWeek = (weekIndex: number) => {
    setExpandedWeeks((prev) => (prev.includes(weekIndex) ? prev.filter((w) => w !== weekIndex) : [...prev, weekIndex]))
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Mesocycle Overview</h2>
      {mesocycle.weeks.map((week: any, index: number) => (
        <Card key={index} className="w-full bg-white shadow-md rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4">
            <CardTitle className="text-lg font-semibold">Week {index + 1}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => toggleWeek(index)} className="text-gray-500 hover:text-gray-700">
              {expandedWeeks.includes(index) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <p className="text-gray-700">
              <strong>Total Volume:</strong> {week.totalVolume}
            </p>
            <p className="text-gray-700">
              <strong>Intensity:</strong> {week.intensity}
            </p>
            <p className="text-gray-700">
              <strong>Main Objectives:</strong> {week.mainObjectives}
            </p>
            {expandedWeeks.includes(index) && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-gray-700">Weekly Progression</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={week.progression} className="bg-gray-100 rounded-lg">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="volume" fill="#8884d8" />
                    <Bar dataKey="intensity" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default MesocycleOverview

