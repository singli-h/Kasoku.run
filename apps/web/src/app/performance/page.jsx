"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import WeeklyOverview from '@/components/overview/WeeklyOverview'

export default function PerformancePage() {
  return (
    <Tabs defaultValue="progress" className="min-h-screen">
      <TabsList className="flex space-x-4 p-4 bg-white">
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="records">Records</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="p-4">
        <WeeklyOverview />
      </TabsContent>

      <TabsContent value="records" className="p-4">
        <div>Records coming soon.</div>
      </TabsContent>

      <TabsContent value="analytics" className="p-4">
        <div>Analytics coming soon.</div>
      </TabsContent>
    </Tabs>
  )
} 