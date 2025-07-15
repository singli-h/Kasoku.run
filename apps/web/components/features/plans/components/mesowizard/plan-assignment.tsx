/**
 * Plan Assignment Step Component
 * Allows coaches to assign training plans to groups or individual athletes
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Users, User, Search, Check, AlertCircle, FileText } from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

// Actions
import { getCoachAthleteGroupsAction } from "@/actions/training/athlete-actions"

// Types
import { AthleteGroup, Athlete } from "@/types/database"

// Extended types for the component
interface AthleteGroupWithDetails extends AthleteGroup {
  athletes?: AthleteWithUser[]
}

interface AthleteWithUser extends Athlete {
  user?: {
    first_name?: string
    last_name?: string
    email?: string
    avatar_url?: string
  }
}

export type AssignmentType = 'group' | 'individual' | 'template'

export interface PlanAssignment {
  type: AssignmentType
  groupId?: number
  athleteIds: number[]
  isTemplate: boolean
}

interface PlanAssignmentProps {
  assignment: PlanAssignment | null
  onAssignmentChange: (assignment: PlanAssignment) => void
  onNext: () => void
  onPrevious: () => void
  isLoading?: boolean
}

interface AthleteWithGroup extends AthleteWithUser {
  athlete_group?: AthleteGroupWithDetails
}

export function PlanAssignment({
  assignment,
  onAssignmentChange,
  onNext,
  onPrevious,
  isLoading = false
}: PlanAssignmentProps) {
  const { toast } = useToast()
  
  // State
  const [groups, setGroups] = useState<AthleteGroupWithDetails[]>([])
  const [athletes, setAthletes] = useState<AthleteWithGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('group')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize from existing assignment
  useEffect(() => {
    if (assignment) {
      setAssignmentType(assignment.type)
      setSelectedGroup(assignment.groupId || null)
      setSelectedAthletes(assignment.athleteIds)
    }
  }, [assignment])

  // Load coach's groups and athletes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)
        setError(null)

        // Get coach's groups
        const groupsResult = await getCoachAthleteGroupsAction()
        if (!groupsResult.isSuccess) {
          throw new Error(groupsResult.message)
        }

        const coachGroups = (groupsResult.data || []) as AthleteGroupWithDetails[]
        setGroups(coachGroups)

        // Get all athletes from all groups
        const allAthletes: AthleteWithGroup[] = []
        for (const group of coachGroups) {
          if (group.athletes) {
            const athletesWithGroup = group.athletes.map((athlete: any) => ({
              ...athlete,
              athlete_group: group
            }))
            allAthletes.push(...athletesWithGroup)
          }
        }
        setAthletes(allAthletes)

      } catch (error) {
        console.error('Error loading assignment data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
        toast({
          title: "Error",
          description: "Failed to load groups and athletes",
          variant: "destructive"
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [toast])

  // Filter athletes based on search
  const filteredAthletes = useMemo(() => {
    if (!searchTerm) return athletes
    
    const term = searchTerm.toLowerCase()
    return athletes.filter(athlete => {
      const firstName = athlete.user?.first_name?.toLowerCase() || ''
      const lastName = athlete.user?.last_name?.toLowerCase() || ''
      const email = athlete.user?.email?.toLowerCase() || ''
      const groupName = athlete.athlete_group?.group_name?.toLowerCase() || ''
      
      return firstName.includes(term) || 
             lastName.includes(term) || 
             email.includes(term) ||
             groupName.includes(term)
    })
  }, [athletes, searchTerm])

  // Handle assignment type change
  const handleAssignmentTypeChange = (type: AssignmentType) => {
    setAssignmentType(type)
    setSelectedGroup(null)
    setSelectedAthletes([])
    
    // Update assignment
    onAssignmentChange({
      type,
      groupId: undefined,
      athleteIds: [],
      isTemplate: type === 'template'
    })
  }

  // Handle group selection
  const handleGroupSelection = (groupId: number) => {
    setSelectedGroup(groupId)
    setSelectedAthletes([])
    
    onAssignmentChange({
      type: 'group',
      groupId,
      athleteIds: [],
      isTemplate: false
    })
  }

  // Handle individual athlete selection
  const handleAthleteToggle = (athleteId: number) => {
    const newSelection = selectedAthletes.includes(athleteId)
      ? selectedAthletes.filter(id => id !== athleteId)
      : [...selectedAthletes, athleteId]
    
    setSelectedAthletes(newSelection)
    
    onAssignmentChange({
      type: 'individual',
      groupId: undefined,
      athleteIds: newSelection,
      isTemplate: false
    })
  }

  // Validation
  const canProceed = useMemo(() => {
    if (assignmentType === 'template') return true
    if (assignmentType === 'group') return selectedGroup !== null
    if (assignmentType === 'individual') return selectedAthletes.length > 0
    return false
  }, [assignmentType, selectedGroup, selectedAthletes])

  const handleNext = () => {
    if (!canProceed) {
      toast({
        title: "Assignment Required",
        description: "Please select at least one group or athlete, or choose to create a template",
        variant: "destructive"
      })
      return
    }
    onNext()
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading groups and athletes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Plan Assignment</h2>
        <p className="text-muted-foreground">
          Choose how to assign this training plan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assignmentType}
            onValueChange={handleAssignmentTypeChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group" id="group" />
              <Label htmlFor="group" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                Assign to Group
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Assign to Individual Athletes
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="template" id="template" />
              <Label htmlFor="template" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Save as Template Only
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {assignmentType === 'group' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Group</CardTitle>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No athlete groups found</p>
                <p className="text-sm">Create a group first to assign plans</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGroup === group.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleGroupSelection(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{group.group_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.athletes?.length || 0} athletes
                        </p>
                      </div>
                      {selectedGroup === group.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {assignmentType === 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Athletes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search athletes by name, email, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredAthletes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No athletes found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredAthletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`athlete-${athlete.id}`}
                        checked={selectedAthletes.includes(athlete.id)}
                        onCheckedChange={() => handleAthleteToggle(athlete.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={athlete.user?.avatar_url || ''} />
                        <AvatarFallback>
                          {athlete.user?.first_name?.[0]}{athlete.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {athlete.user?.first_name} {athlete.user?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{athlete.user?.email}</span>
                          {athlete.athlete_group && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {athlete.athlete_group.group_name}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedAthletes.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {selectedAthletes.length} athlete{selectedAthletes.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {assignmentType === 'template' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Template Mode</h3>
                <p className="text-sm text-muted-foreground">
                  This plan will be saved as a template that can be assigned to athletes later
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
          Previous
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed || isLoading}
          className="min-w-24"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </motion.div>
  )
} 