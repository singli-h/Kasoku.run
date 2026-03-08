"use client"

import { useState, useEffect } from "react"
import { Upload, Loader2, Check, AlertCircle, Info, Pencil, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  parseResultsAction,
  bulkImportResultsAction,
  type PreparedResult,
} from "@/actions/performance/import-results-actions"
import { getEventsAction } from "@/actions/performance/race-result-actions"
import { formatWind, isWindAffectedEvent, getEventId, WIND_AFFECTED_EVENT_IDS } from "@/lib/ai/parse-race-results"
import { checkRateLimit, incrementRateLimit, formatResetsIn } from "@/lib/rate-limit"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Event = Database["public"]["Tables"]["events"]["Row"]

const RATE_LIMIT_KEY = "ai_parse_results"
const DAILY_LIMIT = 10

interface ImportResultsDialogProps {
  onSuccess?: () => void
}

type Step = "paste" | "preview"

export function ImportResultsDialog({ onSuccess }: ImportResultsDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("paste")
  const [pastedText, setPastedText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<PreparedResult[]>([])
  const [unparseable, setUnparseable] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [rateLimitInfo, setRateLimitInfo] = useState({ allowed: true, remaining: DAILY_LIMIT, resetsIn: 0 })
  const { toast } = useToast()

  // Check rate limit on open
  useEffect(() => {
    if (open) {
      const info = checkRateLimit(RATE_LIMIT_KEY, DAILY_LIMIT)
      setRateLimitInfo(info)
    }
  }, [open])

  // Load events for editing
  useEffect(() => {
    if (open && events.length === 0) {
      getEventsAction().then((response) => {
        if (response.isSuccess) {
          setEvents(response.data)
        }
      })
    }
  }, [open, events.length])

  function resetDialog() {
    setStep("paste")
    setPastedText("")
    setResults([])
    setUnparseable([])
    setSelectedIds(new Set())
    setEditingIndex(null)
  }

  async function handleParse() {
    if (!pastedText.trim()) {
      toast({ title: "Please paste some text", variant: "destructive" })
      return
    }

    // Check rate limit
    const limit = checkRateLimit(RATE_LIMIT_KEY, DAILY_LIMIT)
    if (!limit.allowed) {
      toast({
        title: "Daily limit reached",
        description: `You can parse ${DAILY_LIMIT} times per day. Resets in ${formatResetsIn(limit.resetsIn)}`,
        variant: "destructive",
      })
      return
    }

    setParsing(true)
    try {
      const response = await parseResultsAction(pastedText)

      if (response.isSuccess) {
        // Increment rate limit on success
        incrementRateLimit(RATE_LIMIT_KEY)
        setRateLimitInfo(checkRateLimit(RATE_LIMIT_KEY, DAILY_LIMIT))

        setResults(response.data.results)
        setUnparseable(response.data.unparseable)

        // Pre-select all importable results
        const importable = response.data.results
          .map((r, i) => (r.canImport ? i : -1))
          .filter((i) => i >= 0)
        setSelectedIds(new Set(importable))

        if (response.data.results.length === 0) {
          toast({
            title: "No results found",
            description: "Could not parse any race results from the text",
            variant: "destructive",
          })
        } else {
          setStep("preview")
        }
      } else {
        toast({ title: response.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to parse results", variant: "destructive" })
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    const selectedResults = results
      .filter((_, i) => selectedIds.has(i))
      .filter((r) => r.canImport && r.eventId)

    if (selectedResults.length === 0) {
      toast({ title: "No results selected", variant: "destructive" })
      return
    }

    setImporting(true)
    try {
      const response = await bulkImportResultsAction({
        results: selectedResults.map((r) => ({
          eventId: r.eventId!,
          value: r.performance,
          date: r.date,
          wind: r.wind,
          indoor: r.indoor,
          confidence: r.confidence,
        })),
      })

      if (response.isSuccess) {
        toast({
          title: response.message,
          description:
            response.data.newPBs > 0 ? "Congratulations on the new PBs!" : undefined,
        })
        resetDialog()
        setOpen(false)
        onSuccess?.()
      } else {
        toast({ title: response.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to import results", variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  function toggleSelect(index: number) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIds(newSelected)
  }

  function toggleSelectAll() {
    const importableIndices = results
      .map((r, i) => (r.canImport ? i : -1))
      .filter((i) => i >= 0)

    if (selectedIds.size === importableIndices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(importableIndices))
    }
  }

  // Update a result field
  function updateResult(index: number, updates: Partial<PreparedResult>) {
    setResults((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r

        const updated = { ...r, ...updates }

        // If eventId changed, update canImport and eventName
        if (updates.eventId !== undefined) {
          const event = events.find((e) => e.id === updates.eventId)
          if (event && event.name) {
            updated.eventName = event.name
            updated.event = event.name
            updated.canImport = true
            updated.reason = undefined
          }
        }

        // Update performanceDisplay if performance changed
        if (updates.performance !== undefined) {
          const eventId = updated.eventId
          const event = events.find((e) => e.id === eventId)
          if (event?.type === "field") {
            updated.performanceDisplay = `${updates.performance.toFixed(2)}m`
          } else {
            updated.performanceDisplay = updates.performance.toFixed(2)
          }
        }

        return updated
      })
    )
  }

  const importableCount = results.filter((r) => r.canImport).length
  const selectedCount = selectedIds.size

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("max-w-2xl", step === "preview" && "max-w-5xl")}>
        <DialogHeader>
          <DialogTitle>Import Race Results</DialogTitle>
          <DialogDescription>
            {step === "paste"
              ? "Paste your race results and we'll extract the data automatically"
              : "Review and edit results before importing"}
          </DialogDescription>
        </DialogHeader>

        {step === "paste" ? (
          <>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder={`Paste your results here...

Example formats:
100m  10.52  +1.2  2024-06-15
200m  21.34  -0.5  May 20, 2024
Long Jump  7.85m  +0.8  2024-07-01`}
                className="min-h-[200px] font-mono text-sm"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  We extract only event, performance, date, and wind data. No personal
                  information or competition details are stored.
                </p>
              </div>

              {/* Rate limit indicator */}
              <div className="text-xs text-muted-foreground">
                {rateLimitInfo.remaining} of {DAILY_LIMIT} parses remaining today
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={parsing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={parsing || !pastedText.trim() || !rateLimitInfo.allowed}
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  "Parse Results"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Results preview - card-based for easier editing */}
              <div className="space-y-2">
                {results.map((result, index) => {
                  const isEditing = editingIndex === index
                  const eventId = result.eventId
                  const showWind = eventId && isWindAffectedEvent(eventId) && !result.indoor

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        !result.canImport && "opacity-50 bg-muted/30",
                        isEditing && "ring-2 ring-primary bg-muted/10"
                      )}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedIds.has(index)}
                        onCheckedChange={() => toggleSelect(index)}
                        disabled={!result.canImport}
                        className="mt-1"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          // Edit mode
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={eventId?.toString() ?? ""}
                              onValueChange={(v) => updateResult(index, { eventId: parseInt(v) })}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue placeholder="Event" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Track</SelectLabel>
                                  {events
                                    .filter((e) => e.type === "track")
                                    .map((event) => (
                                      <SelectItem key={event.id} value={event.id.toString()}>
                                        {event.name}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                                <SelectGroup>
                                  <SelectLabel>Field</SelectLabel>
                                  {events
                                    .filter((e) => e.type === "field")
                                    .map((event) => (
                                      <SelectItem key={event.id} value={event.id.toString()}>
                                        {event.name}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>

                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={result.performance}
                              onChange={(e) =>
                                updateResult(index, { performance: parseFloat(e.target.value) || 0 })
                              }
                              className="w-[90px] h-8 text-xs font-mono"
                            />

                            <Input
                              type="date"
                              value={result.date}
                              onChange={(e) => updateResult(index, { date: e.target.value })}
                              className="w-[140px] h-8 text-xs"
                            />

                            {showWind && (
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Wind"
                                value={result.wind ?? ""}
                                onChange={(e) =>
                                  updateResult(index, {
                                    wind: e.target.value ? parseFloat(e.target.value) : null,
                                  })
                                }
                                className="w-[70px] h-8 text-xs font-mono"
                              />
                            )}

                            <label className="flex items-center gap-1.5 text-xs">
                              <Switch
                                checked={result.indoor}
                                onCheckedChange={(checked) =>
                                  updateResult(index, { indoor: checked, wind: checked ? null : result.wind })
                                }
                                className="scale-75"
                              />
                              Indoor
                            </label>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingIndex(null)}
                              className="h-8 px-2"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{result.event}</span>
                            <span className="font-mono text-sm">{result.performanceDisplay}</span>
                            <span className="text-sm text-muted-foreground">{result.date}</span>

                            {result.indoor && (
                              <Badge variant="secondary" className="text-xs">
                                indoor
                              </Badge>
                            )}

                            {showWind && result.wind !== null && (
                              <span
                                className={cn(
                                  "font-mono text-xs",
                                  result.wind > 2.0 && "text-amber-600 dark:text-amber-400"
                                )}
                              >
                                {formatWind(result.wind)}
                                {result.wind > 2.0 && "w"}
                              </span>
                            )}

                            {/* Show warning for low confidence results */}
                            {result.confidence === "low" && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                                Review
                              </Badge>
                            )}

                            {!result.canImport && (
                              <span className="text-xs text-destructive">{result.reason}</span>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingIndex(index)}
                              className="h-6 px-1.5 ml-auto"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Unparseable lines warning */}
              {unparseable.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Some lines could not be parsed
                    </p>
                    <ul className="mt-1 text-amber-700 dark:text-amber-300 text-xs list-disc list-inside">
                      {unparseable.slice(0, 3).map((line, i) => (
                        <li key={i} className="truncate max-w-md">
                          {line}
                        </li>
                      ))}
                      {unparseable.length > 3 && (
                        <li>...and {unparseable.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectAll}
                    className="text-primary hover:underline text-xs"
                  >
                    {selectedCount === importableCount ? "Deselect all" : "Select all"}
                  </button>
                  <span>
                    {selectedCount} of {importableCount} selected
                  </span>
                </div>
                <span className="text-xs">
                  By importing, you confirm these are your own results.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("paste")}
                disabled={importing}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Re-parse
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import {selectedCount} Result{selectedCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
