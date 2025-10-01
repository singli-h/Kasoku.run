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
import { inviteOrAttachAthleteAction } from "@/actions/training/athlete-actions"
import type { GroupWithCount } from "../types"

interface InviteAthleteFormProps {
  groups: GroupWithCount[]
  onSuccess: () => void
  className?: string
}

export function InviteAthleteForm({ groups, onSuccess, className }: InviteAthleteFormProps) {
  const { toast } = useToast()
  
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null)
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
      const result = await inviteOrAttachAthleteAction(inviteEmail, inviteGroupId)
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        setInviteEmail("")
        setInviteGroupId(null)
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

  return (
    <div className={`flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[400px] ${className}`}>
      <div className="flex-1">
        <Input
          placeholder="Enter email to invite..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          type="email"
        />
      </div>
      <Select
        value={inviteGroupId?.toString() || ""}
        onValueChange={(value) => setInviteGroupId(value ? parseInt(value) : null)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Select group" />
        </SelectTrigger>
        <SelectContent>
          {groups.map(group => (
            <SelectItem key={group.id} value={group.id.toString()}>
              {group.group_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={handleInviteAthlete}
        disabled={isInviting || !inviteEmail || !inviteGroupId}
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
  )
}
