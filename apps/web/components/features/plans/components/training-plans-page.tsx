"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExistingPlansTab } from "./existing-plans-tab"
import { MesoWizard } from "./mesowizard/mesowizard"

export function TrainingPlansPage() {
  const [activeTab, setActiveTab] = useState("existing")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Your Plans</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-6">
          <ExistingPlansTab />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {/* Create new plan section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MesoWizard Card */}
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧙‍♂️ MesoWizard
                </CardTitle>
                <CardDescription>
                  Use the MesoWizard to create comprehensive training plans with periodization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MesoWizard />
              </CardContent>
            </Card>

            {/* Quick Templates Card */}
            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Quick Templates
                </CardTitle>
                <CardDescription>
                  Start from pre-built templates for common training goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quick templates coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 