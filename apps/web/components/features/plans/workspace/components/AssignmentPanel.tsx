"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, CheckCircle, AlertCircle } from "lucide-react"

interface AssignmentPanelProps {
  planId: number | undefined
}

export function AssignmentPanel({ planId }: AssignmentPanelProps) {
  const [assignmentMode, setAssignmentMode] = useState<'view' | 'assign'>('view')

  // TODO: Replace with actual group data from Supabase
  const groups = [
    // This will be populated from getAthleteGroupsAction() or similar
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "conflict":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-green-50 border-green-200"
      case "conflict":
        return "bg-red-50 border-red-200"
      default:
        return "bg-muted/50 border-muted"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assigned"
      case "conflict":
        return "Conflict"
      default:
        return "Available"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Assignment</CardTitle>
          <Button
            variant={assignmentMode === 'assign' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAssignmentMode(assignmentMode === 'assign' ? 'view' : 'assign')}
          >
            {assignmentMode === 'assign' ? 'Done' : 'Assign'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor(group.status)}`}
            >
              <div className="flex items-center gap-3">
                {assignmentMode === 'assign' ? (
                  <Checkbox
                    checked={group.status === 'assigned'}
                    disabled={group.hasConflict}
                    onChange={(checked) => {
                      // TODO: Handle assignment logic
                      console.log('Assign group:', group.id, checked)
                    }}
                  />
                ) : (
                  getStatusIcon(group.status)
                )}
                <div>
                  <div className="font-medium text-sm">{group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.athleteCount} athletes
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={group.status === 'assigned' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {getStatusLabel(group.status)}
                </Badge>
                {group.hasConflict && (
                  <Badge variant="destructive" className="text-xs">
                    Conflict
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No groups available</div>
              <div className="text-xs">Create groups to assign this plan</div>
            </div>
          )}
        </div>

        {/* Assignment Summary */}
        {assignmentMode === 'assign' && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Assignment Summary</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Athletes:</span>
                <span>{groups.reduce((acc, group) => acc + group.athleteCount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Assigned:</span>
                <span className="text-green-600">
                  {groups.filter(g => g.status === 'assigned').reduce((acc, group) => acc + group.athleteCount, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Conflicts:</span>
                <span className="text-red-600">
                  {groups.filter(g => g.hasConflict).reduce((acc, group) => acc + group.athleteCount, 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conflict Resolution */}
        {groups.some(g => g.hasConflict) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs font-medium text-red-800 mb-2">⚠️ Assignment Conflicts</div>
            <div className="text-xs text-red-700">
              Some athletes are already assigned to other training plans. 
              Resolve conflicts before assigning this plan.
            </div>
            <Button variant="outline" size="sm" className="mt-2 text-xs">
              View Conflicts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
