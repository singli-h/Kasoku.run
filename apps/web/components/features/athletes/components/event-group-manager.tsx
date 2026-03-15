/**
 * Event Group Manager Component
 * Card section for coaches to create and manage event group definitions
 */

"use client"

import { useState } from "react"
import { Plus, X, Tag } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EventGroupBadge } from "./event-group-badge"
import { Input } from "@/components/ui/input"
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
import { useToast } from "@/hooks/use-toast"
import {
  createEventGroupAction,
  deleteEventGroupAction
} from "@/actions/athletes/event-group-actions"
import type { EventGroup } from "../types"

interface EventGroupManagerProps {
  eventGroups: EventGroup[]
  onEventGroupDeleted?: (egId: number) => void
  onDataReload: () => void
  className?: string
}

export function EventGroupManager({
  eventGroups,
  onEventGroupDeleted,
  onDataReload,
  className
}: EventGroupManagerProps) {
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAbbrev, setNewAbbrev] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<EventGroup | null>(null)

  const handleCreate = async () => {
    if (!newName.trim() || !newAbbrev.trim()) return

    // Capture values and close form immediately
    const savedName = newName
    const savedAbbrev = newAbbrev
    setNewName("")
    setNewAbbrev("")
    setShowAddForm(false)

    // Background: persist to server
    try {
      const result = await createEventGroupAction(savedName, savedAbbrev)
      if (result.isSuccess) {
        toast({ title: "Created", description: `Event group "${result.data.abbreviation}" created` })
        onDataReload()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        // Restore form on failure
        setNewName(savedName)
        setNewAbbrev(savedAbbrev)
        setShowAddForm(true)
      }
    } catch {
      toast({ title: "Error", description: "Failed to create event group", variant: "destructive" })
      setNewName(savedName)
      setNewAbbrev(savedAbbrev)
      setShowAddForm(true)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const deletedEg = deleteTarget

    // Optimistic: close dialog and remove from state immediately
    setDeleteTarget(null)
    onEventGroupDeleted?.(deletedEg.id)

    // Background: persist to server
    try {
      const result = await deleteEventGroupAction(deletedEg.id)
      if (result.isSuccess) {
        toast({ title: "Deleted", description: result.message })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        onDataReload()
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete event group", variant: "destructive" })
      onDataReload()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newName.trim() && newAbbrev.trim()) {
      handleCreate()
    }
    if (e.key === "Escape") {
      setShowAddForm(false)
      setNewName("")
      setNewAbbrev("")
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Event Groups</CardTitle>
          </div>
          {!showAddForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Inline add form */}
        {showAddForm && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
            <Input
              value={newAbbrev}
              onChange={(e) => setNewAbbrev(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="SS"
              className="h-10 w-full sm:w-20 text-sm font-mono text-center"
              maxLength={3}
              autoFocus
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Short Sprints"
              className="h-10 text-sm flex-1"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-10 flex-1 sm:flex-none sm:px-4"
                onClick={handleCreate}
                disabled={!newName.trim() || !newAbbrev.trim()}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3"
                onClick={() => {
                  setShowAddForm(false)
                  setNewName("")
                  setNewAbbrev("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {eventGroups.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <Tag className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Define event groups to categorize athletes by specialization
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              e.g. SS = Short Sprints, LS = Long Sprints
            </p>
          </div>
        ) : eventGroups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {eventGroups.map((eg) => (
              <div
                key={eg.id}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-lg group hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <EventGroupBadge value={eg.abbreviation} />
                  <span className="text-sm text-foreground truncate">{eg.name}</span>
                </div>
                <button
                  onClick={() => setDeleteTarget(eg)}
                  className="p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                  aria-label={`Delete ${eg.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the &quot;{deleteTarget?.name}&quot; ({deleteTarget?.abbreviation}) event group definition.
              Athletes with this abbreviation assigned will keep their current value but it will no longer appear in dropdowns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
