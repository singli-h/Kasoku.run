/**
 * Athlete Roster Section Component
 * Displays the athlete roster table with search, filtering, and bulk operations
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
import type { AthleteWithDetails, GroupWithCount, BulkOperationState } from "../types"

interface AthleteRosterSectionProps {
  athletes: AthleteWithDetails[]
  groups: GroupWithCount[]
  selectedAthletes: number[]
  onSelectAthletes: (athletes: number[]) => void
  onBulkOperation: (operation: BulkOperationState) => void
  selectedGroupFilter: number | null
  onGroupFilterChange: (groupId: number | null) => void
  className?: string
}

export function AthleteRosterSection({
  athletes,
  groups,
  selectedAthletes,
  onSelectAthletes,
  onBulkOperation,
  selectedGroupFilter,
  onGroupFilterChange,
  className
}: AthleteRosterSectionProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    let filtered = [...athletes]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(athlete => {
        const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.toLowerCase()
        const email = athlete.user?.email?.toLowerCase() || ''
        return fullName.includes(search) || email.includes(search)
      })
    }

    // Group filter
    if (selectedGroupFilter !== null) {
      filtered = filtered.filter(athlete => 
        athlete.athlete_group_id === selectedGroupFilter
      )
    }

    return filtered
  }, [athletes, searchTerm, selectedGroupFilter])

  // Handle select all athletes
  const handleSelectAll = useCallback(() => {
    if (selectedAthletes.length === filteredAthletes.length) {
      onSelectAthletes([])
    } else {
      onSelectAthletes(filteredAthletes.map(a => a.id))
    }
  }, [selectedAthletes.length, filteredAthletes, onSelectAthletes])

  // Handle individual athlete selection
  const handleSelectAthlete = useCallback((athleteId: number) => {
    onSelectAthletes(
      selectedAthletes.includes(athleteId)
        ? selectedAthletes.filter(id => id !== athleteId)
        : [...selectedAthletes, athleteId]
    )
  }, [selectedAthletes, onSelectAthletes])

  // Calculate age from birthdate
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

  // Parse events from JSON
  const parseEvents = useCallback((events: unknown): string[] => {
    if (!events) return []
    if (typeof events === 'string') {
      try {
        return JSON.parse(events)
      } catch {
        return []
      }
    }
    if (Array.isArray(events)) {
      return events
    }
    return []
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Athlete Roster</CardTitle>
            <CardDescription>
              {filteredAthletes.length} athlete{filteredAthletes.length !== 1 ? 's' : ''}
              {selectedGroupFilter && (
                <>
                  {' '}in{' '}
                  <Badge variant="outline" className="ml-1">
                    {groups.find(g => g.id === selectedGroupFilter)?.group_name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => onGroupFilterChange(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </>
              )}
            </CardDescription>
          </div>

          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>

            {selectedAthletes.length > 0 && (
              <div className="flex gap-1">
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
        </div>
      </CardHeader>

      <CardContent>
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAthletes.length === filteredAthletes.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Sex</TableHead>
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
                            type: 'assign' 
                          })}>
                            Add to Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onBulkOperation({ 
                            isOpen: true, 
                            type: 'move' 
                          })}>
                            Move to Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onBulkOperation({ 
                            isOpen: true, 
                            type: 'remove' 
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
