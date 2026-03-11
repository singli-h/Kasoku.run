"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  isToday,
  subWeeks,
  addWeeks,
} from "date-fns"
import { ChevronLeft, ChevronRight, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWeekSessions } from "../hooks/use-dashboard-queries"
import type { WeekCalendarSession } from "@/actions/dashboard/dashboard-actions"

interface WeekCalendarStripProps {
  initialWeekStart: string // ISO date string for Monday, e.g. "2026-03-09"
}

export function WeekCalendarStrip({ initialWeekStart }: WeekCalendarStripProps) {
  const [weekStart, setWeekStart] = useState(initialWeekStart)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { data: sessions, isLoading } = useWeekSessions(weekStart)

  // Generate 7 days starting from weekStart (Monday)
  const weekDays = useMemo(() => {
    const start = new Date(weekStart + "T00:00:00")
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [weekStart])

  // Group sessions by date string for dot indicators
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WeekCalendarSession[]>()
    for (const session of sessions || []) {
      const existing = map.get(session.date) || []
      existing.push(session)
      map.set(session.date, existing)
    }
    return map
  }, [sessions])

  // Sessions for selected day
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const selectedSessions = sessionsByDate.get(selectedDateStr) || []

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = subWeeks(new Date(weekStart + "T00:00:00"), 1)
    setWeekStart(format(prev, "yyyy-MM-dd"))
  }

  const handleNextWeek = () => {
    const next = addWeeks(new Date(weekStart + "T00:00:00"), 1)
    setWeekStart(format(next, "yyyy-MM-dd"))
  }

  const handleGoToToday = () => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    setWeekStart(format(monday, "yyyy-MM-dd"))
    setSelectedDate(today)
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
  }

  return (
    <div className="space-y-3">
      {/* Week header with navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Week of {format(new Date(weekStart + "T00:00:00"), "MMM d")}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleGoToToday}
            disabled={isToday(selectedDate)}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1" role="listbox" aria-label="Week days">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const hasSessions = sessionsByDate.has(dateStr)
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              role="option"
              aria-selected={isSelected}
              aria-label={`${format(day, "EEEE, MMMM d")}${hasSessions ? ", has sessions" : ""}`}
              className={`
                flex flex-col items-center py-2 px-1 rounded-lg transition-colors cursor-pointer
                ${isSelected
                  ? "bg-primary text-primary-foreground"
                  : isTodayDate
                    ? "ring-1 ring-primary/50 bg-primary/5"
                    : "hover:bg-accent"
                }
              `}
            >
              <span className={`text-[10px] font-medium uppercase ${
                isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {format(day, "EEE")}
              </span>
              <span className={`text-sm font-semibold mt-0.5 ${
                isSelected ? "text-primary-foreground" : ""
              }`}>
                {format(day, "d")}
              </span>
              {/* Session dot indicator */}
              <div className="h-1.5 mt-1">
                {hasSessions && (
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  }`} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Session cards for selected day */}
      <div className="min-h-[4rem]">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading sessions...
          </div>
        ) : selectedSessions.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No training scheduled — Enjoy your rest day
          </div>
        ) : (
          <div className="space-y-2">
            {selectedSessions.map((session) => (
              <SessionPreviewCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Session Preview Card (T039) ---

function SessionPreviewCard({ session }: { session: WeekCalendarSession }) {
  const statusColors: Record<WeekCalendarSession['status'], string> = {
    pending: "bg-blue-500",
    "in-progress": "bg-amber-500",
    completed: "bg-green-500",
    cancelled: "bg-muted-foreground/50",
  }

  const isActionable = session.status === "pending" || session.status === "in-progress"

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-2 w-2 rounded-full shrink-0 ${statusColors[session.status]}`} />
          <span className="text-sm font-medium truncate">{session.title}</span>
        </div>
      </div>

      {/* Exercise list */}
      {session.exercises.length > 0 && (
        <ol className="space-y-0.5 pl-4">
          {session.exercises.map((exercise, idx) => (
            <li
              key={idx}
              className="text-xs text-muted-foreground flex items-baseline gap-2"
            >
              <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                {idx + 1}.
              </span>
              <span className="truncate">
                {exercise.name}
              </span>
              <span className="shrink-0 text-muted-foreground/80 ml-auto tabular-nums">
                {exercise.summary}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Start Workout CTA */}
      {isActionable && (
        <div className="flex gap-2">
          <Link href={`/workout/${session.id}`} className="flex-1">
            <Button size="sm" className="w-full h-8 text-xs">
              <Play className="h-3 w-3 mr-1.5" />
              {session.status === "in-progress" ? "Continue" : "Start"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
