/**
 * AthleteCard Component - Mobile-optimized athlete display
 * Touch-friendly card with long-press multi-select
 */

"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  User,
  Users,
  MoreVertical,
  ChevronRight,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  Tag
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { updateAthleteProfileAction } from "@/actions/athletes/athlete-actions"
import { EventGroupBadge } from "./event-group-badge"
import type { AthleteWithDetails, BulkOperationState, EventGroup } from "../types"

interface AthleteCardProps {
  athlete: AthleteWithDetails
  isSelected: boolean
  isSelectionMode: boolean
  eventGroups: EventGroup[]
  onSelect: (athleteId: number) => void
  onLongPress: () => void
  onBulkOperation: (operation: BulkOperationState) => void
  onGroupFilter: (groupId: number | null) => void
  onDataReload?: () => void
}

export function AthleteCard({
  athlete,
  isSelected,
  isSelectionMode,
  eventGroups,
  onSelect,
  onLongPress,
  onBulkOperation,
  onGroupFilter,
  onDataReload
}: AthleteCardProps) {
  const [eventGroupOpen, setEventGroupOpen] = useState(false)
  const [savingEventGroup, setSavingEventGroup] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase()
  const events = parseEvents(athlete.events)
  const age = calculateAge(athlete.user?.birthdate)

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress()
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect(athlete.id)
    }
  }

  const handleEventGroupToggle = async (abbreviation: string) => {
    if (!athlete.user_id) return
    const current = athlete.event_groups ?? []
    const newValues = current.includes(abbreviation)
      ? current.filter(g => g !== abbreviation)
      : [...current, abbreviation]
    setSavingEventGroup(true)
    const result = await updateAthleteProfileAction(athlete.user_id, { event_groups: newValues.length > 0 ? newValues : null })
    setSavingEventGroup(false)
    if (result.isSuccess) {
      onDataReload?.()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  const handleEventGroupClear = async () => {
    if (!athlete.user_id) return
    setSavingEventGroup(true)
    const result = await updateAthleteProfileAction(athlete.user_id, { event_groups: null })
    setSavingEventGroup(false)
    if (result.isSuccess) {
      setEventGroupOpen(false)
      onDataReload?.()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Main card */}
      <div
        className={cn(
          "relative flex items-center gap-3 p-4 bg-card border rounded-lg",
          "transition-colors duration-150",
          isSelected && "bg-primary/5 border-primary/30"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        {/* Selection checkbox */}
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          isSelectionMode ? "w-8 opacity-100" : "w-0 opacity-0"
        )}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(athlete.id)}
            className="touch-target"
          />
        </div>

        {/* Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background shadow-sm">
          <AvatarImage src={athlete.user?.avatar_url || ''} alt={fullName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{fullName}</span>
            {age !== null && (
              <span className="text-xs text-muted-foreground flex-shrink-0">{age}y</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Popover open={eventGroupOpen} onOpenChange={setEventGroupOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5"
                >
                  {(athlete.event_groups ?? []).length > 0 ? (
                    (athlete.event_groups ?? []).map(g => (
                      <EventGroupBadge key={g} value={g} interactive />
                    ))
                  ) : (
                    <EventGroupBadge value={null} interactive />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-1 pb-1">Event Groups</p>
                  {eventGroups.length > 0 ? (
                    <>
                      {eventGroups.map((eg) => (
                        <button
                          key={eg.id}
                          disabled={savingEventGroup}
                          onClick={() => handleEventGroupToggle(eg.abbreviation)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors",
                            (athlete.event_groups ?? []).includes(eg.abbreviation) && "bg-muted font-medium"
                          )}
                        >
                          {eg.abbreviation} — {eg.name}
                        </button>
                      ))}
                      {(athlete.event_groups ?? []).length > 0 && (
                        <button
                          disabled={savingEventGroup}
                          onClick={() => handleEventGroupClear()}
                          className="w-full text-left px-2 py-1.5 rounded text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground px-2 py-1.5">No event groups defined</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {events.slice(0, 3).map((event, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                {event}
              </Badge>
            ))}
            {events.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{events.length - 3}</span>
            )}
          </div>

          {athlete.athlete_group?.group_name && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onGroupFilter(athlete.athlete_group?.id || null)
              }}
              className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-3 w-3" />
              <span>{athlete.athlete_group.group_name}</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isSelectionMode && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/athletes/${athlete.id}`} className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEventGroupOpen(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Edit Event Group
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBulkOperation({ isOpen: true, type: 'assign', athleteIds: [athlete.id] })}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to Group
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation({ isOpen: true, type: 'move', athleteIds: [athlete.id] })}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Move to Group
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation({ isOpen: true, type: 'remove', athleteIds: [athlete.id] })} className="text-destructive">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove from Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href={`/athletes/${athlete.id}`}>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  )
}

function calculateAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1
  }
  return age
}

function parseEvents(events: unknown): string[] {
  if (!events) return []
  let parsedEvents: unknown[]
  if (typeof events === 'string') {
    try {
      parsedEvents = JSON.parse(events)
    } catch {
      return []
    }
  } else if (Array.isArray(events)) {
    parsedEvents = events
  } else {
    return []
  }
  return parsedEvents.map((event) => {
    if (typeof event === 'string') return event
    if (event && typeof event === 'object' && 'name' in event) {
      return String((event as { name: unknown }).name)
    }
    return String(event)
  }).filter(Boolean)
}
