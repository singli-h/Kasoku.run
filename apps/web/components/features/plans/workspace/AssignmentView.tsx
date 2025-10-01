"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, User, Calendar } from "lucide-react"

type AssignmentType = "individuals" | "groups"
type StartAlignment = "anchor" | "monday" | "custom"

interface DemoAthlete {
  id: string
  name: string
  group: string
  hasActivePlan: boolean
}

interface DemoGroup {
  id: string
  name: string
  athleteCount: number
  hasActivePlan: boolean
}

const DEMO_ATHLETES: DemoAthlete[] = [
  { id: "a1", name: "John Smith", group: "Varsity", hasActivePlan: false },
  { id: "a2", name: "Sarah Johnson", group: "Varsity", hasActivePlan: true },
  { id: "a3", name: "Mike Davis", group: "JV", hasActivePlan: false },
  { id: "a4", name: "Emma Wilson", group: "Varsity", hasActivePlan: false },
  { id: "a5", name: "Alex Chen", group: "JV", hasActivePlan: true },
  { id: "a6", name: "Maria Rodriguez", group: "Varsity", hasActivePlan: false },
  { id: "a7", name: "James Park", group: "JV", hasActivePlan: false },
  { id: "a8", name: "Lisa Wong", group: "Varsity", hasActivePlan: true }
]

const DEMO_GROUPS: DemoGroup[] = [
  { id: "g1", name: "Varsity Sprint Group", athleteCount: 12, hasActivePlan: false },
  { id: "g2", name: "JV Distance Squad", athleteCount: 8, hasActivePlan: true },
  { id: "g3", name: "Masters Training", athleteCount: 5, hasActivePlan: false },
  { id: "g4", name: "Club Throws Team", athleteCount: 6, hasActivePlan: false }
]

export function AssignmentView() {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("individuals")
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [startAlignment, setStartAlignment] = useState<StartAlignment>("anchor")
  const [customDate, setCustomDate] = useState("")

  const handleAthleteToggle = (athleteId: string) => {
    setSelectedAthletes(prev =>
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Guardrail checks
  const hasNoAnchor = false // Demo: assume we have anchors
  const hasEmptySelection = assignmentType === "individuals"
    ? selectedAthletes.length === 0
    : selectedGroups.length === 0

  const conflictingPlans = assignmentType === "individuals"
    ? DEMO_ATHLETES.filter(a => selectedAthletes.includes(a.id) && a.hasActivePlan).length
    : DEMO_GROUPS.filter(g => selectedGroups.includes(g.id) && g.hasActivePlan).length

  const hasLoadSpike = selectedAthletes.length > 3 // Demo: simulate spike warning
  const canProceed = !hasNoAnchor && !hasEmptySelection

  // Edge case: Mixed assignment types
  const hasMixedTypes = assignmentType === "individuals" && selectedAthletes.length > 0 && selectedGroups.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignment Configuration</CardTitle>
          <CardDescription>Choose how to assign this training plan to athletes or groups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assignment Type</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="individuals"
                  name="assignmentType"
                  checked={assignmentType === "individuals"}
                  onChange={() => setAssignmentType("individuals")}
                  className="w-4 h-4"
                />
                <Label htmlFor="individuals" className="cursor-pointer">Individual Athletes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="groups"
                  name="assignmentType"
                  checked={assignmentType === "groups"}
                  onChange={() => setAssignmentType("groups")}
                  className="w-4 h-4"
                />
                <Label htmlFor="groups" className="cursor-pointer">Athlete Groups</Label>
              </div>
            </div>
          </div>

          {/* Selection */}
          {assignmentType === "individuals" ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Athletes ({selectedAthletes.length} selected)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                {DEMO_ATHLETES.map((athlete) => (
                  <div key={athlete.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={athlete.id}
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={() => handleAthleteToggle(athlete.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <Label htmlFor={athlete.id} className="cursor-pointer font-medium">
                        {athlete.name}
                      </Label>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{athlete.group}</span>
                        {athlete.hasActivePlan && (
                          <Badge variant="destructive" className="text-xs">Has Active Plan</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Groups ({selectedGroups.length} selected)</Label>
              <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                {DEMO_GROUPS.map((group) => (
                  <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={group.id}
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <Label htmlFor={group.id} className="cursor-pointer font-medium">
                        {group.name}
                      </Label>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{group.athleteCount} athletes</span>
                        {group.hasActivePlan && (
                          <Badge variant="destructive" className="text-xs">Has Active Plan</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Alignment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Start Alignment</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="anchor"
                  name="alignment"
                  checked={startAlignment === "anchor"}
                  onChange={() => setStartAlignment("anchor")}
                  className="w-4 h-4"
                />
                <Label htmlFor="anchor" className="cursor-pointer">Align to Race Anchor (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="monday"
                  name="alignment"
                  checked={startAlignment === "monday"}
                  onChange={() => setStartAlignment("monday")}
                  className="w-4 h-4"
                />
                <Label htmlFor="monday" className="cursor-pointer">Start Next Monday</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  name="alignment"
                  checked={startAlignment === "custom"}
                  onChange={() => setStartAlignment("custom")}
                  className="w-4 h-4"
                />
                <Label htmlFor="custom" className="cursor-pointer">Custom Start Date</Label>
              </div>
              {startAlignment === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardrails & Warnings */}
      {(hasNoAnchor || hasEmptySelection || conflictingPlans > 0 || hasLoadSpike || hasMixedTypes) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Assignment Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasNoAnchor && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No race anchors set. Consider adding competition dates for better planning.
                </AlertDescription>
              </Alert>
            )}
            {hasEmptySelection && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No {assignmentType === "individuals" ? "athletes" : "groups"} selected.
                </AlertDescription>
              </Alert>
            )}
            {conflictingPlans > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {conflictingPlans} {assignmentType === "individuals" ? "athlete" : "group"}{conflictingPlans !== 1 ? "s have" : " has"} active training plans.
                  Choose how to handle conflicts:
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm">Replace</Button>
                    <Button variant="outline" size="sm">Keep Both</Button>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {hasLoadSpike && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Weekly load spike detected (+18% vs last week). Consider gradual progression.
                </AlertDescription>
              </Alert>
            )}
            {hasMixedTypes && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Mixed assignment types detected. Please confirm this is intentional.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Summary</CardTitle>
          <CardDescription>Review before confirming assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Assignment Type</div>
              <div className="font-medium capitalize">{assignmentType}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Selected</div>
              <div className="font-medium">
                {assignmentType === "individuals"
                  ? `${selectedAthletes.length} athlete${selectedAthletes.length !== 1 ? 's' : ''}`
                  : `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''}`
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Start Alignment</div>
              <div className="font-medium">
                {startAlignment === "anchor" ? "Race Anchor" :
                 startAlignment === "monday" ? "Next Monday" :
                 `Custom: ${customDate || "Not set"}`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Plan Duration</div>
              <div className="font-medium">3 months</div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              disabled={!canProceed}
              onClick={() => {
                // Demo: just show success toast
                console.log("Plan assigned!", {
                  type: assignmentType,
                  selected: assignmentType === "individuals" ? selectedAthletes : selectedGroups,
                  alignment: startAlignment
                })
              }}
            >
              Assign Plan
            </Button>
            <Button variant="outline">Preview Sessions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
