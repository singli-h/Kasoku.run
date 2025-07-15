"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Calendar, Users, User, Trophy } from "lucide-react"
import { MesoWizard } from "./mesowizard/mesowizard"
import { ExistingPlansTab } from "@/components/features/plans/components/existing-plans-tab"
import { TemplatesPage } from "./templates-page"

export function TrainingPlansPage() {
  const [activeTab, setActiveTab] = useState("existing")

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Training Plans</h1>
        <p className="text-muted-foreground">
          Manage your training plans, discover templates, and create new programs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Existing Plans
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <ExistingPlansTab />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesPage />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Training Plan
              </CardTitle>
              <CardDescription>
                Use the MesoWizard to create comprehensive training plans with periodization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MesoWizard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 