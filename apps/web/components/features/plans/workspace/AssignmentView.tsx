"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Users, User, UserMinus, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Server Actions
import { getCoachAthleteGroupsAction, getRosterWithGroupCountsAction } from "@/actions/athletes/athlete-actions"
import {
  assignPlanToAthletesAction,
  unassignPlanFromAthletesAction,
  getGroupsWithActivePlansAction,
  getAssignedGroupsForPlanAction,
} from "@/actions/plans/plan-assignment-actions"

type AssignmentType = "individuals" | "groups"
type StartAlignment = "anchor" | "monday" | "custom"

interface Athlete {
  id: number
  user_id: number | null
  first_name?: string
  last_name?: string
  athlete_group_id?: number | null
  group_name?: string | null
  // Additional fields from database
  events?: unknown
  experience?: string | null
  height?: number | null
  training_goals?: string | null
  weight?: number | null
}

interface Group {
  id: number
  group_name: string | null
  athlete_count?: number
  coach_id?: number | null
  created_at?: string | null
}

interface AssignedGroupInfo {
  groupId: number
  groupName: string
  athleteCount: number
  sessionCount: number
}

interface GroupActivePlan {
  groupId: number
  groupName: string
  macrocycleId: number
  planName: string
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

  // Currently assigned groups for this plan
  const [assignedGroups, setAssignedGroups] = useState<AssignedGroupInfo[]>([])
  // Groups with active plans (from any plan) - used for warning badges
  const [groupsWithActivePlans, setGroupsWithActivePlans] = useState<GroupActivePlan[]>([])
  // Unassign confirmation
  const [unassignTarget, setUnassignTarget] = useState<AssignedGroupInfo | null>(null)

  const loadAssignmentData = useCallback(async () => {
    if (!macrocycleId) return
    const [assignedResult, activePlansResult] = await Promise.all([
      getAssignedGroupsForPlanAction(macrocycleId),
      getGroupsWithActivePlansAction(),
    ])
    if (assignedResult.isSuccess && assignedResult.data) {
      setAssignedGroups(assignedResult.data)
    }
    if (activePlansResult.isSuccess && activePlansResult.data) {
      setGroupsWithActivePlans(activePlansResult.data)
    }
  }, [macrocycleId])

  // Load athletes, groups, and assignment data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [groupsResult, athletesResult] = await Promise.all([
          getCoachAthleteGroupsAction(),
          getRosterWithGroupCountsAction(),
        ])

        if (groupsResult.isSuccess && groupsResult.data) {
          setGroups(groupsResult.data)
        }
        if (athletesResult.isSuccess && athletesResult.data) {
          setAthletes(athletesResult.data.athletes)
        }

        await loadAssignmentData()
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAssignmentData])

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

    // Clear selections immediately for instant feedback
    const savedGroups = [...selectedGroups]
    const savedAthletes = [...selectedAthletes]
    setSelectedGroups([])
    setSelectedAthletes([])
    setIsAssigning(true)

    try {
      const result = await assignPlanToAthletesAction({
        macrocycleId,
        athleteIds: assignmentType === "individuals" ? savedAthletes : [],
        groupIds: assignmentType === "groups" ? savedGroups : [],
        startAlignment,
        customStartDate: startAlignment === "custom" ? customDate : undefined,
      })

      if (result.isSuccess) {
        toast({
          title: "Success!",
          description: result.message,
        })
        await loadAssignmentData()
        onAssignmentComplete?.()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('[AssignmentView] Assignment failed:', error)
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign plan",
        variant: "destructive",
      })
      // Restore selections on failure
      setSelectedGroups(savedGroups)
      setSelectedAthletes(savedAthletes)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassignGroup = async () => {
    if (!macrocycleId || !unassignTarget) return

    const removedGroup = unassignTarget

    // Optimistic: close dialog and remove from state immediately
    setUnassignTarget(null)
    setAssignedGroups(prev => prev.filter(g => g.groupId !== removedGroup.groupId))

    try {
      const result = await unassignPlanFromAthletesAction({
        macrocycleId,
        groupIds: [removedGroup.groupId],
      })

      if (result.isSuccess) {
        toast({
          title: "Unassigned",
          description: result.message,
        })
      } else {
        toast({
          title: "Unassign failed",
          description: result.message,
          variant: "destructive",
        })
        await loadAssignmentData()
      }
    } catch (error) {
      console.error('[AssignmentView] Unassign failed:', error)
      toast({
        title: "Unassign failed",
        description: error instanceof Error ? error.message : "Failed to unassign group",
        variant: "destructive",
      })
      await loadAssignmentData()
    }
  }

  // Build a map of groupId → active plan info (from other macrocycles only)
  const otherPlanByGroupId = useMemo(() => {
    const map = new Map<number, GroupActivePlan>()
    for (const gap of groupsWithActivePlans) {
      if (macrocycleId && gap.macrocycleId !== macrocycleId) {
        map.set(gap.groupId, gap)
      }
    }
    return map
  }, [groupsWithActivePlans, macrocycleId])

  // Groups already assigned to THIS plan
  const assignedGroupIds = useMemo(
    () => new Set(assignedGroups.map(g => g.groupId)),
    [assignedGroups]
  )

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
      {/* Currently Assigned Groups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Currently Assigned</CardTitle>
          <CardDescription>Groups with active assignments for this plan</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups assigned yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedGroups.map((ag) => (
                <div
                  key={ag.groupId}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ag.groupName}</span>
                    <span className="text-xs text-muted-foreground">
                      {ag.athleteCount} athlete{ag.athleteCount !== 1 ? 's' : ''} · {ag.sessionCount} session{ag.sessionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-1 text-muted-foreground hover:text-destructive"
                    onClick={() => setUnassignTarget(ag)}
                    aria-label={`Unassign ${ag.groupName}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Configuration */}
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
                  {groups.map((group) => {
                    const otherPlan = otherPlanByGroupId.get(group.id)
                    const isAssignedToThisPlan = assignedGroupIds.has(group.id)
                    const isDisabled = !!otherPlan

                    return (
                      <div
                        key={group.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isDisabled ? 'opacity-60 bg-muted' : 'hover:bg-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                          disabled={isDisabled}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label
                              htmlFor={`group-${group.id}`}
                              className={`font-medium ${isDisabled ? '' : 'cursor-pointer'}`}
                            >
                              {group.group_name}
                            </Label>
                            {isAssignedToThisPlan && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned
                              </Badge>
                            )}
                            {otherPlan && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                On: {otherPlan.planName}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.athlete_count} athlete{group.athlete_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Start Alignment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Plan Start Date</Label>
            <p className="text-xs text-muted-foreground -mt-1">Choose when athlete schedules begin relative to the plan</p>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="monday"
                  value="monday"
                  checked={startAlignment === "monday"}
                  onChange={() => setStartAlignment("monday")}
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <Label htmlFor="monday" className="cursor-pointer">
                    Next Monday (Recommended)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Week 1 starts on the upcoming Monday</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="anchor"
                  value="anchor"
                  checked={startAlignment === "anchor"}
                  onChange={() => setStartAlignment("anchor")}
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <Label htmlFor="anchor" className="cursor-pointer">
                    Race Anchor
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Count backwards from competition — taper lands on race day</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="radio"
                  id="custom"
                  value="custom"
                  checked={startAlignment === "custom"}
                  onChange={() => setStartAlignment("custom")}
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <Label htmlFor="custom" className="cursor-pointer">
                    Custom Date
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Pick a specific start date</p>
                </div>
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

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={!!unassignTarget} onOpenChange={(open) => !open && setUnassignTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign {unassignTarget?.groupName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all sessions that haven&apos;t been started yet for this group.
              Ongoing and completed sessions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUnassignGroup()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
