"use client"

import React from 'react'
import { Users, Activity, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

/**
 * SummaryCards displays total athletes, active today, and upcoming sessions counts.
 * @param {{ athletes: Array }} props
 */
export default function SummaryCards({ athletes }) {
  const total = athletes.length
  // Placeholder logic: treat all as active today
  const activeToday = total
  // No session data available yet
  const upcoming = 0

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeToday}</div>
          <p className="text-xs text-muted-foreground">{Math.round((activeToday/ Math.max(total,1)) * 100)}% of athletes</p>
        </CardContent>
      </Card>
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcoming}</div>
          <p className="text-xs text-muted-foreground">Next: N/A</p>
        </CardContent>
      </Card>
    </div>
  )
} 