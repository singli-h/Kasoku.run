"use server"

import { AthleteManagementDashboard, AthleteGroupManagement } from "@/components/features/athletes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AthletesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Athletes</h1>
        <p className="text-muted-foreground mt-2">
          Manage your athletes and organize them into training groups
        </p>
      </div>

      {/* Main Content */}
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