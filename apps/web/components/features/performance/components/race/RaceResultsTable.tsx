"use client"

import { useState, useMemo } from "react"
import { Trash2, Trophy, Pencil, Zap, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { deleteRaceResultAction, type RaceResult, type RaceResultMetadata } from "@/actions/performance/race-result-actions"
import { EditRaceResultDialog } from "./EditRaceResultDialog"
import { cn } from "@/lib/utils"

interface RaceResultsTableProps {
  results: RaceResult[]
  onDelete?: () => void
  onEdit?: () => void
}

// Sort options
type SortOption = "newest" | "oldest" | "best"

const RESULTS_PER_PAGE = 20

/**
 * Format time in seconds to display format
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(2)
    return `${mins}:${secs.padStart(5, "0")}`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = (seconds % 60).toFixed(2)
  return `${hours}:${mins.toString().padStart(2, "0")}:${secs.padStart(5, "0")}`
}

/**
 * Format distance in meters
 */
function formatDistance(meters: number): string {
  return `${meters.toFixed(2)}m`
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Extract distance from event name (e.g., "100m" -> 100, "100mH" -> 100)
 * Returns Infinity for non-distance events to sort them after distance events
 */
function extractDistance(name: string): number {
  const match = name.match(/^(\d+)m/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return Infinity
}

/**
 * Group events by type for dropdown, sorted by distance (short to long)
 */
function getUniqueEvents(results: RaceResult[]): Map<string, { id: number; name: string }[]> {
  const eventMap = new Map<string, { id: number; name: string }[]>()
  const seen = new Set<number>()

  for (const result of results) {
    if (!result.event || seen.has(result.event.id)) continue
    seen.add(result.event.id)

    const type = result.event.type || "other"
    if (!eventMap.has(type)) {
      eventMap.set(type, [])
    }
    eventMap.get(type)!.push({ id: result.event.id, name: result.event.name || "Unknown" })
  }

  // Sort events within each type by distance (short to long), then alphabetically
  for (const events of eventMap.values()) {
    events.sort((a, b) => {
      const distA = extractDistance(a.name)
      const distB = extractDistance(b.name)

      // Both have distances: sort by distance
      if (distA !== Infinity && distB !== Infinity) {
        if (distA !== distB) return distA - distB
        // Same distance: sort alphabetically
        return a.name.localeCompare(b.name)
      }

      // Only one has distance: distance first
      if (distA !== Infinity) return -1
      if (distB !== Infinity) return 1

      // Neither has distance: sort alphabetically
      return a.name.localeCompare(b.name)
    })
  }

  return eventMap
}

export function RaceResultsTable({ results, onDelete, onEdit }: RaceResultsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingResult, setEditingResult] = useState<RaceResult | null>(null)
  const { toast } = useToast()

  // Filter state
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [pbsOnly, setPbsOnly] = useState(false)

  // Pagination state
  const [displayCount, setDisplayCount] = useState(RESULTS_PER_PAGE)

  // Get unique events for dropdown
  const eventsByType = useMemo(() => getUniqueEvents(results), [results])

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...results]

    // Filter by event
    if (eventFilter !== "all") {
      const eventId = parseInt(eventFilter)
      filtered = filtered.filter((r) => r.event?.id === eventId)
    }

    // Filter by PB status
    if (pbsOnly) {
      filtered = filtered.filter((r) => {
        const meta = r.metadata as RaceResultMetadata | null
        return meta?.is_pb === true
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.achieved_date).getTime() - new Date(a.achieved_date).getTime()
        case "oldest":
          return new Date(a.achieved_date).getTime() - new Date(b.achieved_date).getTime()
        case "best": {
          // For track events, lower is better. For field, higher is better.
          const aIsField = a.event?.type === "field"
          const bIsField = b.event?.type === "field"
          // If mixed types, track first
          if (aIsField !== bIsField) return aIsField ? 1 : -1
          // Same type: compare values
          return aIsField ? b.value - a.value : a.value - b.value
        }
        default:
          return 0
      }
    })

    return filtered
  }, [results, eventFilter, sortBy, pbsOnly])

  // Paginated results
  const displayedResults = filteredResults.slice(0, displayCount)
  const hasMore = displayCount < filteredResults.length

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      const response = await deleteRaceResultAction(id)
      if (response.isSuccess) {
        toast({ title: "Result deleted" })
        onDelete?.()
      } else {
        toast({ title: response.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  function handleLoadMore() {
    setDisplayCount((prev) => prev + RESULTS_PER_PAGE)
  }

  // Reset pagination when filters change
  function handleFilterChange<T>(setter: (value: T) => void, value: T) {
    setter(value)
    setDisplayCount(RESULTS_PER_PAGE)
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No race results yet</p>
        <p className="text-sm">Add your first competition result to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 pb-2">
        {/* Event Filter */}
        <Select
          value={eventFilter}
          onValueChange={(value) => handleFilterChange(setEventFilter, value)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {Array.from(eventsByType.entries()).map(([type, events]) => (
              <SelectGroup key={type}>
                <SelectLabel className="capitalize">{type}</SelectLabel>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) => handleFilterChange(setSortBy, value as SortOption)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="best">Best Result</SelectItem>
          </SelectContent>
        </Select>

        {/* PB Toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <Switch
            checked={pbsOnly}
            onCheckedChange={(checked) => handleFilterChange(setPbsOnly, checked)}
            className="scale-90"
          />
          <span className="text-muted-foreground">PBs only</span>
        </label>

        {/* Result count */}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredResults.length === results.length
            ? `${results.length} result${results.length !== 1 ? "s" : ""}`
            : `${filteredResults.length} of ${results.length}`}
        </span>
      </div>

      {/* Table */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          <p>No results match your filters</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setEventFilter("all")
              setPbsOnly(false)
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Wind</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedResults.map((result) => {
                const metadata = result.metadata as RaceResultMetadata | null
                const isFieldEvent = result.event?.type === "field"
                const formattedValue = isFieldEvent
                  ? formatDistance(result.value)
                  : formatTime(result.value)

                return (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {formatDate(result.achieved_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.event?.name || "Unknown"}
                        {metadata?.indoor && (
                          <Badge variant="secondary" className="text-xs">
                            indoor
                          </Badge>
                        )}
                        {metadata?.is_pb && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600 gap-1">
                                  <Trophy className="h-3 w-3" />
                                  PB
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Official Personal Best (wind-legal)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {!metadata?.is_pb && metadata?.is_fastest && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 gap-1">
                                  <Zap className="h-3 w-3" />
                                  Best
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Fastest time (wind-assisted, {">"} +2.0 m/s)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{formattedValue}</TableCell>
                    <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                      {metadata?.wind !== undefined ? (
                        <span className={metadata.wind > 2.0 ? "text-amber-600 dark:text-amber-400" : ""}>
                          {metadata.wind > 0 ? "+" : ""}{metadata.wind.toFixed(1)}
                          {metadata.wind > 2.0 && "w"}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingResult(result)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deletingId === result.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Result</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this race result? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(result.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Load More */}
          {hasMore && (
            <div className="p-3 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Load more ({filteredResults.length - displayCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <EditRaceResultDialog
        result={editingResult}
        open={editingResult !== null}
        onOpenChange={(open) => !open && setEditingResult(null)}
        onSuccess={() => {
          setEditingResult(null)
          onEdit?.()
        }}
      />
    </div>
  )
}
