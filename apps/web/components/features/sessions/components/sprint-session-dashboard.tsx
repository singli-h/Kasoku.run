/*
<ai_context>
Sprint Session Dashboard - Simplified version for header duplication fix.
This is a temporary working version while we address the architectural issues.
The main goal is to fix header duplication and ensure the app builds.
</ai_context>
*/

"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, AlertCircle } from "lucide-react"

export function SprintSessionDashboard() {
  return (
    <div className="space-y-6">
      
      {/* Session Status Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Session Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your sprint session parameters
              </p>
            </div>
            <Badge variant="secondary">Ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sprint session dashboard is being rebuilt. This is a temporary interface.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Athlete Groups</h4>
              <p className="text-sm text-muted-foreground">Select groups to include</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Sprint Distances</h4>
              <p className="text-sm text-muted-foreground">Configure round distances</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Session Type</h4>
              <p className="text-sm text-muted-foreground">Choose preset or custom</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
} 