/**
 * Invite Athlete Form Component
 * Handles inviting new athletes or adding existing users to groups
 */

"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { inviteOrAttachAthleteAction } from "@/actions/athletes/athlete-actions"
import type { GroupWithCount, EventGroup } from "../types"

interface InviteAthleteFormProps {
  groups: GroupWithCount[]
  eventGroups?: EventGroup[]
  onSuccess: () => void
  className?: string
}

export function InviteAthleteForm({ groups, eventGroups, onSuccess, className }: InviteAthleteFormProps) {
  const { toast } = useToast()

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null)
  const [inviteEventGroup, setInviteEventGroup] = useState<string>("")
  const [isInviting, setIsInviting] = useState(false)

  const handleInviteAthlete = async () => {
    if (!inviteEmail || !inviteGroupId) {
      toast({
        title: "Error",
        description: "Please enter an email and select a group",
        variant: "destructive"
      })
      return
    }

    setIsInviting(true)
    try {
      const result = await inviteOrAttachAthleteAction(
        inviteEmail,
        inviteGroupId,
        inviteEventGroup && inviteEventGroup !== "none" ? [inviteEventGroup] : undefined
      )

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        setInviteEmail("")
        setInviteGroupId(null)
        setInviteEventGroup("")
        onSuccess() // Reload data
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
        description: "Failed to invite athlete",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  const noGroups = groups.length === 0

  return (
    <div className={className}>
      {noGroups && (
        <p className="text-sm text-muted-foreground mb-2">
          Create a group first to start inviting athletes.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[400px]">
        <div className="flex-1">
          <Input
            placeholder="Enter email to invite..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            type="email"
            disabled={noGroups}
          />
        </div>
        <Select
          value={inviteGroupId?.toString() || ""}
          onValueChange={(value) => setInviteGroupId(value ? parseInt(value) : null)}
          disabled={noGroups}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={noGroups ? "No groups — create one first" : "Select group"} />
          </SelectTrigger>
          <SelectContent>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eventGroups && eventGroups.length > 0 && (
          <Select
            value={inviteEventGroup}
            onValueChange={setInviteEventGroup}
            disabled={noGroups}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Event group (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No event group</SelectItem>
              {eventGroups.map(eg => (
                <SelectItem key={eg.id} value={eg.abbreviation}>
                  {eg.abbreviation} — {eg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={handleInviteAthlete}
          disabled={noGroups || isInviting || !inviteEmail || !inviteGroupId}
          className="whitespace-nowrap"
        >
          {isInviting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Inviting...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
