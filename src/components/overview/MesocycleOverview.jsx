"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const MesocycleOverview = ({ mesocycle }) => {
  const [expandedWeeks, setExpandedWeeks] = useState([])

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => (prev.includes(weekIndex) ? prev.filter((w) => w !== weekIndex) : [...prev, weekIndex]))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Mesocycle Overview</h2>
      {mesocycle.weeks.map((week, index) => (
        <Card key={index} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week {index + 1}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => toggleWeek(index)}>
              {expandedWeeks.includes(index) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Total Volume:</strong> {week.totalVolume}
            </p>
            <p>
              <strong>Intensity:</strong> {week.intensity}
            </p>
            <p>
              <strong>Main Objectives:</strong> {week.mainObjectives}
            </p>
            {expandedWeeks.includes(index) && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Weekly Progression</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={week.progression}>
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

