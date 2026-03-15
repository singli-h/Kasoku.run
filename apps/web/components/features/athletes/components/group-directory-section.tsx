/**
 * Group Directory Section Component
 * Displays and manages athlete groups with CRUD operations
 */

"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit,
  Trash2
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  createAthleteGroupAction,
  updateAthleteGroupAction,
  deleteAthleteGroupAction
} from "@/actions/athletes/athlete-actions"
import type { GroupWithCount, EventGroup } from "../types"

interface GroupDirectorySectionProps {
  groups: GroupWithCount[]
  athletes?: Array<{ athlete_group_id: number | null; event_groups?: string[] | null }>
  eventGroups?: EventGroup[]
  selectedGroupFilter: number | null
  onGroupFilterChange: (groupId: number | null) => void
  onGroupUpdated?: (groupId: number, newName: string) => void
  onGroupDeleted?: (groupId: number) => void
  onDataReload: () => void
  className?: string
}

/** Compute event group breakdown for a given athlete group */
function getEventGroupBreakdown(
  groupId: number,
  athletes: Array<{ athlete_group_id: number | null; event_groups?: string[] | null }>,
  eventGroupMap: Map<string, string>
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const a of athletes) {
    if (a.athlete_group_id === groupId) {
      (a.event_groups ?? []).forEach(eg => {
        const displayName = eventGroupMap.get(eg) || eg
        counts[displayName] = (counts[displayName] || 0) + 1
      })
    }
  }
  return counts
}

export function GroupDirectorySection({
  groups,
  athletes,
  eventGroups,
  selectedGroupFilter,
  onGroupFilterChange,
  onGroupUpdated,
  onGroupDeleted,
  onDataReload,
  className
}: GroupDirectorySectionProps) {
  // Build abbreviation -> name lookup
  const eventGroupMap = useMemo(() => {
    const map = new Map<string, string>()
    if (eventGroups) {
      for (const eg of eventGroups) {
        map.set(eg.abbreviation, eg.name)
      }
    }
    return map
  }, [eventGroups])
  const { toast } = useToast()
  
  const [newGroupName, setNewGroupName] = useState("")
  const [editingGroup, setEditingGroup] = useState<GroupWithCount | null>(null)

  // Handle group creation — clear input immediately, sync on server response
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      })
      return
    }

    const savedName = newGroupName.trim()
    setNewGroupName("")

    try {
      const result = await createAthleteGroupAction(savedName)

      if (result.isSuccess) {
        toast({ title: "Success", description: "Group created successfully" })
        onDataReload()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        setNewGroupName(savedName)
      }
    } catch {
      toast({ title: "Error", description: "Failed to create group", variant: "destructive" })
      setNewGroupName(savedName)
    }
  }

  // Handle group update — optimistic rename, revert on failure
  const handleUpdateGroup = async (group: GroupWithCount, newName: string) => {
    if (!newName.trim()) return

    // Optimistic: close dialog and update state immediately
    setEditingGroup(null)
    onGroupUpdated?.(group.id, newName.trim())

    try {
      const result = await updateAthleteGroupAction(group.id, { group_name: newName.trim() })

      if (result.isSuccess) {
        toast({ title: "Success", description: "Group updated successfully" })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        onDataReload()
      }
    } catch {
      toast({ title: "Error", description: "Failed to update group", variant: "destructive" })
      onDataReload()
    }
  }

  // Handle group deletion — optimistic remove, revert on failure
  const handleDeleteGroup = async (groupId: number) => {
    // Optimistic: remove from state immediately
    if (selectedGroupFilter === groupId) {
      onGroupFilterChange(null)
    }
    onGroupDeleted?.(groupId)

    try {
      const result = await deleteAthleteGroupAction(groupId)

      if (result.isSuccess) {
        toast({ title: "Success", description: "Group deleted successfully" })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        onDataReload()
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete group", variant: "destructive" })
      onDataReload()
    }
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Group Directory</CardTitle>
              <CardDescription>
                {groups.length} group{groups.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="New group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 sm:w-48"
              />
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No groups created</p>
              <p className="text-muted-foreground text-sm">
                Create your first group to organize athletes
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedGroupFilter === group.id && "ring-2 ring-primary"
                    )}
                    onClick={() => onGroupFilterChange(
                      selectedGroupFilter === group.id ? null : group.id
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">
                          {group.group_name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingGroup(group)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGroup(group.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Athletes</span>
                        <Badge variant="secondary">
                          {group.athlete_count}
                        </Badge>
                      </div>
                      {athletes && (() => {
                        const breakdown = getEventGroupBreakdown(group.id, athletes, eventGroupMap)
                        const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1])
                        if (entries.length === 0) return null
                        return (
                          <p className="text-xs text-muted-foreground mt-2">
                            {entries.map(([eg, count]) => `${eg}: ${count}`).join(", ")}
                          </p>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>
              Change the name of "{editingGroup?.group_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              defaultValue={editingGroup?.group_name || ''}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && editingGroup) {
                  const input = e.target as HTMLInputElement
                  handleUpdateGroup(editingGroup, input.value)
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingGroup) {
                const input = document.getElementById('group-name') as HTMLInputElement
                handleUpdateGroup(editingGroup, input.value)
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
