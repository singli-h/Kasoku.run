/**
 * Athlete Roster Section Component
 * Responsive layout: Cards on mobile, Table on desktop
 */

"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  Search,
  MoreHorizontal,
  X
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { updateAthleteProfileAction } from "@/actions/athletes/athlete-actions"

import { AthleteCard } from "./athlete-card"
import { GroupFilterChips } from "./group-filter-chips"
import { EventGroupBadge } from "./event-group-badge"
import type { AthleteWithDetails, GroupWithCount, BulkOperationState, EventGroup } from "../types"

/**
 * Inline editor for athlete event_group field.
 * Shows coach-defined event group options in a popover.
 */
function EventGroupEditor({
  userId,
  currentValue,
  eventGroups,
  onSaved,
}: {
  userId: number | null
  currentValue: string | null | undefined
  eventGroups: EventGroup[]
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSelect = async (value: string | null) => {
    if (!userId) return
    setSaving(true)
    const result = await updateAthleteProfileAction(userId, { event_group: value })
    setSaving(false)
    if (result.isSuccess) {
      setOpen(false)
      onSaved()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  // Find display name for current value
  const currentEg = eventGroups.find(eg => eg.abbreviation === currentValue)
  const displayLabel = currentEg ? currentEg.abbreviation : currentValue

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <EventGroupBadge
          value={displayLabel}
          emptyLabel="Set"
          interactive
        />
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-1 pb-1">Event Group</p>
          {eventGroups.length > 0 ? (
            <>
              {eventGroups.map((eg) => (
                <button
                  key={eg.id}
                  disabled={saving}
                  onClick={() => handleSelect(eg.abbreviation)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors",
                    currentValue === eg.abbreviation && "bg-muted font-medium"
                  )}
                >
                  {eg.abbreviation} — {eg.name}
                </button>
              ))}
              {currentValue && (
                <button
                  disabled={saving}
                  onClick={() => handleSelect(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-1.5">No event groups defined</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface AthleteRosterSectionProps {
  athletes: AthleteWithDetails[]
  groups: GroupWithCount[]
  eventGroups: EventGroup[]
  selectedAthletes: number[]
  onSelectAthletes: (athletes: number[]) => void
  onBulkOperation: (operation: BulkOperationState) => void
  selectedGroupFilter: number | null
  onGroupFilterChange: (groupId: number | null) => void
  onDataReload?: () => void
  className?: string
}

export function AthleteRosterSection({
  athletes,
  groups,
  eventGroups,
  selectedAthletes,
  onSelectAthletes,
  onBulkOperation,
  selectedGroupFilter,
  onGroupFilterChange,
  onDataReload,
  className
}: AthleteRosterSectionProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    let filtered = [...athletes]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(athlete => {
        const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.toLowerCase()
        const email = athlete.user?.email?.toLowerCase() || ''
        return fullName.includes(search) || email.includes(search)
      })
    }

    if (selectedGroupFilter !== null) {
      filtered = filtered.filter(athlete =>
        athlete.athlete_group_id === selectedGroupFilter
      )
    }

    return filtered
  }, [athletes, searchTerm, selectedGroupFilter])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedAthletes.length === filteredAthletes.length) {
      onSelectAthletes([])
    } else {
      onSelectAthletes(filteredAthletes.map(a => a.id))
    }
  }, [selectedAthletes.length, filteredAthletes, onSelectAthletes])

  // Handle individual selection
  const handleSelectAthlete = useCallback((athleteId: number) => {
    onSelectAthletes(
      selectedAthletes.includes(athleteId)
        ? selectedAthletes.filter(id => id !== athleteId)
        : [...selectedAthletes, athleteId]
    )
  }, [selectedAthletes, onSelectAthletes])

  // Enter selection mode (long press on mobile)
  const handleEnterSelectionMode = useCallback(() => {
    setIsSelectionMode(true)
  }, [])

  // Exit selection mode
  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    onSelectAthletes([])
  }, [onSelectAthletes])

  // Calculate age
  const calculateAge = useCallback((birthdate: string | null | undefined): number | null => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }, [])

  // Parse events
  const parseEvents = useCallback((events: unknown): string[] => {
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
  }, [])

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        {/* Title and count */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Athletes</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
              {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? 's' : ''}
              {selectedGroupFilter !== null && (
                <Badge variant="outline" className="gap-1">
                  {groups.find(g => g.id === selectedGroupFilter)?.group_name}
                  <button
                    onClick={() => onGroupFilterChange(null)}
                    className="ml-0.5 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </CardDescription>
          </div>

          {/* Desktop bulk actions */}
          {!isMobile && selectedAthletes.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'assign' })}
              >
                Add to Group ({selectedAthletes.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'move' })}
              >
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'remove' })}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Group filter chips (mobile) */}
        {isMobile && (
          <GroupFilterChips
            groups={groups}
            selectedGroupId={selectedGroupFilter}
            onGroupChange={onGroupFilterChange}
            onGroupCreated={onDataReload || (() => {})}
            className="mt-4 -mx-2"
          />
        )}

        {/* Search bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-9",
              isMobile ? "h-11 text-base" : "h-9"
            )}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className={isMobile ? "px-3" : ""}>
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No athletes found</p>
            <p className="text-muted-foreground text-sm">
              {searchTerm || selectedGroupFilter ?
                "Try adjusting your search or filter" :
                "Invite athletes to get started"
              }
            </p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card-based layout */
          <div className="space-y-2">
            {/* Selection mode toggle */}
            {isSelectionMode && (
              <div className="flex items-center justify-between py-2 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitSelectionMode}
                  className="text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedAthletes.length === filteredAthletes.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}

            {/* Athlete cards */}
            {filteredAthletes.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                isSelected={selectedAthletes.includes(athlete.id)}
                isSelectionMode={isSelectionMode}
                eventGroups={eventGroups}
                onSelect={handleSelectAthlete}
                onLongPress={handleEnterSelectionMode}
                onBulkOperation={onBulkOperation}
                onGroupFilter={onGroupFilterChange}
                onDataReload={onDataReload}
              />
            ))}

            {/* Tip for long-press */}
            {!isSelectionMode && filteredAthletes.length > 0 && (
              <p className="text-xs text-center text-muted-foreground pt-4 pb-2">
                Long-press an athlete to select multiple
              </p>
            )}
          </div>
        ) : (
          /* Desktop: Table layout */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAthletes.length === filteredAthletes.length && filteredAthletes.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Event Group</TableHead>
                <TableHead>Events</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAthletes.map((athlete) => {
                const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
                const age = calculateAge(athlete.user?.birthdate)
                const events = parseEvents(athlete.events)
                const isSelected = selectedAthletes.includes(athlete.id)

                return (
                  <TableRow key={athlete.id} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectAthlete(athlete.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={athlete.user?.avatar_url || ''} />
                          <AvatarFallback>
                            {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium hover:underline">{fullName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {athlete.user?.email}
                    </TableCell>
                    <TableCell>
                      {athlete.athlete_group?.group_name ? (
                        <Badge
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => onGroupFilterChange(athlete.athlete_group?.id || null)}
                        >
                          {athlete.athlete_group.group_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {age !== null ? `${age}y` : '—'}
                    </TableCell>
                    <TableCell>
                      {athlete.user?.sex || '—'}
                    </TableCell>
                    <TableCell>
                      <EventGroupEditor
                        userId={athlete.user_id}
                        currentValue={athlete.event_group}
                        eventGroups={eventGroups}
                        onSaved={() => onDataReload?.()}
                      />
                    </TableCell>
                    <TableCell>
                      {events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {events.slice(0, 2).map((event, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {events.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{events.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/athletes/${athlete.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onBulkOperation({
                            isOpen: true,
                            type: 'assign',
                            athleteIds: [athlete.id]
                          })}>
                            Add to Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onBulkOperation({
                            isOpen: true,
                            type: 'move',
                            athleteIds: [athlete.id]
                          })}>
                            Move to Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onBulkOperation({
                            isOpen: true,
                            type: 'remove',
                            athleteIds: [athlete.id]
                          })}>
                            Remove from Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
