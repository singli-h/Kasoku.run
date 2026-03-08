/**
 * GroupFilterChips - Horizontal scrollable filter chips for athlete groups
 * Mobile-optimized group filtering with quick access to all groups
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Users, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createAthleteGroupAction } from "@/actions/athletes/athlete-actions"
import { cn } from "@/lib/utils"
import type { GroupWithCount } from "../types"

interface GroupFilterChipsProps {
  groups: GroupWithCount[]
  selectedGroupId: number | null
  onGroupChange: (groupId: number | null) => void
  onGroupCreated: () => void
  className?: string
}

export function GroupFilterChips({
  groups,
  selectedGroupId,
  onGroupChange,
  onGroupCreated,
  className
}: GroupFilterChipsProps) {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createAthleteGroupAction(newGroupName.trim())
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Group created successfully"
        })
        setNewGroupName("")
        setIsCreateOpen(false)
        onGroupCreated()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div className={cn("relative", className)}>
        {/* Scrollable container */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
          {/* All filter chip */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onGroupChange(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
              "whitespace-nowrap transition-colors flex-shrink-0",
              "border touch-target-sm",
              selectedGroupId === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            All
            {selectedGroupId === null && (
              <Check className="h-3.5 w-3.5 ml-0.5" />
            )}
          </motion.button>

          {/* Group chips */}
          {groups.map((group) => (
            <motion.button
              key={group.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onGroupChange(selectedGroupId === group.id ? null : group.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
                "whitespace-nowrap transition-colors flex-shrink-0",
                "border touch-target-sm",
                selectedGroupId === group.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {group.group_name}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                selectedGroupId === group.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {group.athlete_count}
              </span>
              {selectedGroupId === group.id && (
                <X className="h-3.5 w-3.5 ml-0.5" />
              )}
            </motion.button>
          ))}

          {/* Create group button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
              "whitespace-nowrap transition-colors flex-shrink-0",
              "border border-dashed border-muted-foreground/30",
              "text-muted-foreground hover:bg-muted hover:border-muted-foreground/50",
              "touch-target-sm"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            New Group
          </motion.button>
        </div>

        {/* Fade edges indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new training group to organize your athletes
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Group name (e.g., Sprinters, Distance)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateGroup()
                }
              }}
              className="h-11"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={isCreating || !newGroupName.trim()}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
