"use server"

import { AthleteManagementDashboard, AthleteGroupManagement } from "@/components/features/athletes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AthletesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Tabs defaultValue="athletes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="athletes">Athlete Dashboard</TabsTrigger>
          <TabsTrigger value="groups">Group Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="athletes">
          <AthleteManagementDashboard />
        </TabsContent>
        
        <TabsContent value="groups">
          <AthleteGroupManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
} 