/**
 * Event Group Manager Component
 * Compact UI for coaches to create and manage event group definitions
 */

"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  onDataReload: () => void
  className?: string
}

export function EventGroupManager({
  eventGroups,
  onDataReload,
  className
}: EventGroupManagerProps) {
  const { toast } = useToast()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAbbrev, setNewAbbrev] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EventGroup | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim() || !newAbbrev.trim()) return

    setIsCreating(true)
    try {
      const result = await createEventGroupAction(newName, newAbbrev)
      if (result.isSuccess) {
        toast({ title: "Created", description: `Event group "${result.data.abbreviation}" created` })
        setNewName("")
        setNewAbbrev("")
        setShowAddForm(false)
        onDataReload()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to create event group", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deleteEventGroupAction(deleteTarget.id)
      if (result.isSuccess) {
        toast({ title: "Deleted", description: result.message })
        setDeleteTarget(null)
        onDataReload()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete event group", variant: "destructive" })
    } finally {
      setIsDeleting(false)
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
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Event Groups</h3>
        {!showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {eventGroups.length === 0 && !showAddForm ? (
        <p className="text-xs text-muted-foreground">
          Define event groups to categorize athletes by specialization (e.g., SS = Short Sprints)
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {eventGroups.map((eg) => (
            <Badge
              key={eg.id}
              variant="secondary"
              className="text-xs gap-1 pr-1 font-normal"
            >
              <span className="font-mono font-medium">[{eg.abbreviation}]</span>
              <span>{eg.name}</span>
              <button
                onClick={() => setDeleteTarget(eg)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Delete ${eg.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Inline add form */}
      {showAddForm && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={newAbbrev}
            onChange={(e) => setNewAbbrev(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="SS"
            className="h-8 w-16 text-xs font-mono text-center"
            maxLength={3}
            disabled={isCreating}
            autoFocus
          />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Short Sprints"
            className="h-8 text-xs flex-1"
            disabled={isCreating}
          />
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim() || !newAbbrev.trim()}
          >
            {isCreating ? "..." : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setShowAddForm(false)
              setNewName("")
              setNewAbbrev("")
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the "{deleteTarget?.name}" ({deleteTarget?.abbreviation}) event group definition.
              Athletes with this abbreviation assigned will keep their current value but it will no longer appear in dropdowns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
