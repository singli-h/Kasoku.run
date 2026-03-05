/**
 * AthleteCard Component - Mobile-optimized athlete display
 * Touch-friendly card with swipe actions and long-press multi-select
 */

"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import {
  User,
  Users,
  MoreVertical,
  ChevronRight,
  UserPlus,
  ArrowRightLeft,
  UserMinus
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
import { cn } from "@/lib/utils"
import type { AthleteWithDetails, BulkOperationState } from "../types"

interface AthleteCardProps {
  athlete: AthleteWithDetails
  isSelected: boolean
  isSelectionMode: boolean
  onSelect: (athleteId: number) => void
  onLongPress: () => void
  onBulkOperation: (operation: BulkOperationState) => void
  onGroupFilter: (groupId: number | null) => void
}

export function AthleteCard({
  athlete,
  isSelected,
  isSelectionMode,
  onSelect,
  onLongPress,
  onBulkOperation,
  onGroupFilter
}: AthleteCardProps) {
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const x = useMotionValue(0)

  const actionOpacity = useTransform(x, [-120, -60], [1, 0])
  const actionScale = useTransform(x, [-120, -60], [1, 0.8])

  const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase()
  const events = parseEvents(athlete.events)
  const age = calculateAge(athlete.user?.birthdate)

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      setIsSwipeRevealed(true)
    } else {
      setIsSwipeRevealed(false)
    }
  }

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

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe action background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center gap-1 px-3 bg-gradient-to-l from-muted/80 to-transparent"
        style={{ opacity: actionOpacity, scale: actionScale }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={() => onBulkOperation({ isOpen: true, type: 'assign', athleteIds: [athlete.id] })}
        >
          <UserPlus className="h-4 w-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20"
          onClick={() => onBulkOperation({ isOpen: true, type: 'move', athleteIds: [athlete.id] })}
        >
          <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full bg-destructive/10 hover:bg-destructive/20"
          onClick={() => onBulkOperation({ isOpen: true, type: 'remove', athleteIds: [athlete.id] })}
        >
          <UserMinus className="h-4 w-4 text-destructive" />
        </Button>
      </motion.div>

      {/* Main card */}
      <motion.div
        className={cn(
          "relative flex items-center gap-3 p-4 bg-card border rounded-lg touch-pan-y",
          "transition-colors duration-150",
          isSelected && "bg-primary/5 border-primary/30",
          isSwipeRevealed && "shadow-lg"
        )}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
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

          {(events.length > 0 || athlete.event_group) && (
            <div className="flex items-center gap-1.5 mt-1">
              {athlete.event_group && (
                <span className="px-1.5 py-0 bg-muted rounded text-[10px] font-mono h-5 inline-flex items-center">{athlete.event_group}</span>
              )}
              {events.slice(0, 3).map((event, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  {event}
                </Badge>
              ))}
              {events.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{events.length - 3}</span>
              )}
            </div>
          )}

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
      </motion.div>
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
