"use server"

import { AthleteManagementDashboard, AthleteGroupManagement } from "@/components/features/athletes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout } from "@/components/layout"

export default async function AthletesPage() {
  return (
    <PageLayout
      title="Athletes"
      description="Manage your athletes and organize them into training groups"
    >
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
    </PageLayout>
  )
} 