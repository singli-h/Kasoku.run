"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, User, Calendar, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Server Actions
import { getCoachAthleteGroupsAction, getRosterWithGroupCountsAction } from "@/actions/athletes/athlete-actions"
import { assignPlanToAthletesAction } from "@/actions/plans/plan-assignment-actions"

type AssignmentType = "individuals" | "groups"
type StartAlignment = "anchor" | "monday" | "custom"

interface Athlete {
  id: number
  user_id: number
  first_name: string
  last_name: string
  athlete_group_id?: number
  group_name?: string
}

interface Group {
  id: number
  group_name: string
  athlete_count: number
}

interface AssignmentViewProps {
  macrocycleId?: number
  onAssignmentComplete?: () => void
}

export function AssignmentView({ macrocycleId, onAssignmentComplete }: AssignmentViewProps) {
  const { toast } = useToast()
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("groups")
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [startAlignment, setStartAlignment] = useState<StartAlignment>("monday")
  const [customDate, setCustomDate] = useState("")

  // Data state
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  // Load athletes and groups
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load groups
        const groupsResult = await getCoachAthleteGroupsAction()
        if (groupsResult.isSuccess && groupsResult.data) {
          setGroups(groupsResult.data)
        }

        // Load athletes with roster data
        const athletesResult = await getRosterWithGroupCountsAction()
        if (athletesResult.isSuccess && athletesResult.data) {
          setAthletes(athletesResult.data)
        }
      } catch (error) {
        console.error('[AssignmentView] Failed to load data:', error)
        toast({
          title: "Error",
          description: "Failed to load athletes and groups",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleAthleteToggle = (athleteId: number) => {
    setSelectedAthletes(prev =>
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleAssign = async () => {
    if (!macrocycleId) {
      toast({
        title: "Error",
        description: "No plan selected for assignment",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    try {
      const result = await assignPlanToAthletesAction({
        macrocycleId,
        athleteIds: assignmentType === "individuals" ? selectedAthletes : [],
        groupIds: assignmentType === "groups" ? selectedGroups : [],
        startAlignment,
        customStartDate: startAlignment === "custom" ? customDate : undefined,
      })

      if (result.isSuccess) {
        toast({
          title: "Success!",
          description: result.message,
        })
        onAssignmentComplete?.()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('[AssignmentView] Assignment failed:', error)
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign plan",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Guardrail checks
  const hasEmptySelection = assignmentType === "individuals"
    ? selectedAthletes.length === 0
    : selectedGroups.length === 0

  const canProceed = !hasEmptySelection && !isLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
                  value="individuals"
                  checked={assignmentType === "individuals"}
                  onChange={() => setAssignmentType("individuals")}
                  className="w-4 h-4"
                />
                <Label htmlFor="individuals" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Individual Athletes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="groups"
                  value="groups"
                  checked={assignmentType === "groups"}
                  onChange={() => setAssignmentType("groups")}
                  className="w-4 h-4"
                />
                <Label htmlFor="groups" className="cursor-pointer flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Athlete Groups
                </Label>
              </div>
            </div>
          </div>

          {/* Selection */}
          {assignmentType === "individuals" ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select Athletes ({selectedAthletes.length} selected)
              </Label>
              {athletes.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No athletes found. Add athletes to your roster first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {athletes.map((athlete) => (
                    <div key={athlete.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                      <input
                        type="checkbox"
                        id={`athlete-${athlete.id}`}
                        checked={selectedAthletes.includes(athlete.id)}
                        onChange={() => handleAthleteToggle(athlete.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`athlete-${athlete.id}`} className="cursor-pointer font-medium">
                          {athlete.first_name} {athlete.last_name}
                        </Label>
                        {athlete.group_name && (
                          <div className="text-xs text-muted-foreground">
                            {athlete.group_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select Groups ({selectedGroups.length} selected)
              </Label>
              {groups.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No groups found. Create athlete groups first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`group-${group.id}`} className="cursor-pointer font-medium">
                          {group.group_name}
                        </Label>
                        <div className="text-xs text-muted-foreground">
                          {group.athlete_count} athlete{group.athlete_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Start Alignment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Plan Start Date</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="monday"
                  value="monday"
                  checked={startAlignment === "monday"}
                  onChange={() => setStartAlignment("monday")}
                  className="w-4 h-4"
                />
                <Label htmlFor="monday" className="cursor-pointer">
                  Next Monday (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="anchor"
                  value="anchor"
                  checked={startAlignment === "anchor"}
                  onChange={() => setStartAlignment("anchor")}
                  className="w-4 h-4"
                />
                <Label htmlFor="anchor" className="cursor-pointer">
                  Race Anchor (Peak on competition date)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  value="custom"
                  checked={startAlignment === "custom"}
                  onChange={() => setStartAlignment("custom")}
                  className="w-4 h-4"
                />
                <Label htmlFor="custom" className="cursor-pointer">
                  Custom Date
                </Label>
              </div>
              {startAlignment === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              )}
            </div>
          </div>

          {/* Warnings */}
          {hasEmptySelection && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one {assignmentType === "individuals" ? "athlete" : "group"} to assign the plan.
              </AlertDescription>
            </Alert>
          )}

          {/* Assignment Summary */}
          {!hasEmptySelection && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Assignment Summary</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>
                  • Assigning to {assignmentType === "individuals" ? selectedAthletes.length : selectedGroups.length}{" "}
                  {assignmentType === "individuals" ? "athlete(s)" : "group(s)"}
                </li>
                <li>
                  • Start alignment: {startAlignment === "monday" ? "Next Monday" : startAlignment === "anchor" ? "Race Anchor" : "Custom Date"}
                </li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={!canProceed || isAssigning}
              className="gap-2"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Assign Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
