/**
 * MobileInviteFAB - Floating action button with bottom sheet for inviting athletes
 * Mobile-optimized invite experience
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, UserPlus, X, Mail, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { inviteOrAttachAthleteAction } from "@/actions/athletes/athlete-actions"
import { cn } from "@/lib/utils"
import type { GroupWithCount, EventGroup } from "../types"

interface MobileInviteFABProps {
  groups: GroupWithCount[]
  eventGroups?: EventGroup[]
  onSuccess: () => void
  isHidden?: boolean
  className?: string
}

export function MobileInviteFAB({
  groups,
  eventGroups,
  onSuccess,
  isHidden = false,
  className
}: MobileInviteFABProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [groupId, setGroupId] = useState<string>("")
  const [eventGroupAbbrev, setEventGroupAbbrev] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email || !groupId) {
      toast({
        title: "Missing information",
        description: "Please enter an email and select a group",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await inviteOrAttachAthleteAction(
        email,
        parseInt(groupId),
        eventGroupAbbrev && eventGroupAbbrev !== "none" ? [eventGroupAbbrev] : undefined
      )
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: result.message
        })
        setEmail("")
        setGroupId("")
        setEventGroupAbbrev("")
        setIsOpen(false)
        onSuccess()
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
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isHidden && !isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "fixed bottom-6 right-6 z-40",
              "pb-[env(safe-area-inset-bottom)]",
              className
            )}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg shadow-primary/25"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "bg-background rounded-t-2xl shadow-xl",
                "pb-[env(safe-area-inset-bottom)]"
              )}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Invite Athlete</h3>
                    <p className="text-xs text-muted-foreground">Add a new athlete to your roster</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-5">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="athlete@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    autoComplete="email"
                  />
                </div>

                {/* Group field */}
                <div className="space-y-2">
                  <Label htmlFor="invite-group" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Training Group
                  </Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          <span className="flex items-center gap-2">
                            {group.group_name}
                            <span className="text-muted-foreground text-xs">
                              ({group.athlete_count} athletes)
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event group field (optional) */}
                {eventGroups && eventGroups.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Event Group (optional)
                    </Label>
                    <Select value={eventGroupAbbrev} onValueChange={setEventGroupAbbrev}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="No event group" />
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
                  </div>
                )}

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !email || !groupId}
                  className="w-full h-12 text-base font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>

                {/* Helper text */}
                <p className="text-xs text-center text-muted-foreground">
                  The athlete will receive an email invitation to join your team
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
