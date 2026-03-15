"use client"

import type React from "react"
import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight, Plus, Edit, Trash2, Sparkles, BarChart3 } from "lucide-react"
import { EditMesocycleDialog, type MesocycleFormData } from "./components/EditMesocycleDialog"
import { EditMicrocycleDialog, type MicrocycleFormData } from "./components/EditMicrocycleDialog"
import { EditRaceDialog } from "./components/EditRaceDialog"
import { EditSessionDialog } from "./components/EditSessionDialog"
import { CopySessionDialog } from "./components/CopySessionDialog"
import { DuplicateWeekDialog } from "./components/DuplicateWeekDialog"
import { PlanPageHeader } from "../components/PlanPageHeader"
import { copySessionAction, updateSessionPlanAction, deleteSessionPlanAction, duplicateMicrocycleSessionsAction } from "@/actions/plans/session-plan-actions"
import {
  createMesocycleAction,
  updateMesocycleAction,
  deleteMesocycleAction,
  createMicrocycleAction,
  updateMicrocycleAction,
  deleteMicrocycleAction,
  updateMacrocycleAction,
} from "@/actions/plans/plan-actions"
import { createRaceAction, updateRaceAction, deleteRaceAction } from "@/actions/plans/race-actions"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { abbreviateSubgroup } from "@/lib/training-utils"
import { SubgroupBadge } from "@/components/features/athletes/components/subgroup-badge"

// Training plan workspace component - interfaces for data structure
export interface Session {
  id: string
  day: number
  name: string
  type: 'speed' | 'strength' | 'recovery' | 'endurance' | 'power'
  duration: number
  volume: number
  volumeUnit?: string
  intensity: number
  exercises: unknown[]
  /** Exercise names extracted server-side for card display */
  exerciseNames?: string[]
  /** Formatted exercise summaries (e.g. "3x10 80kg") */
  exerciseSummaries?: string[]
  /** Per-exercise target event groups for subgroup indicators */
  targetSubgroups?: (string[])[]
  /** Session-level target event groups for schedule filtering */
  sessionTargetSubgroups?: string[] | null
}

interface Microcycle {
  id: number
  mesocycle_id: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  sessions: Session[]
  // UI-only fields
  weekNumber?: number
  volume?: number
  intensity?: number
  isDeload?: boolean
}

interface Mesocycle {
  id: number
  macrocycle_id: number | null
  user_id: number | null
  name: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  planning_context?: unknown | null
  metadata: {
    phase?: string
    color?: string
    deload?: boolean
  } | null
  microcycles: Microcycle[]
  // UI-only calculated fields
  totalSessions?: number
  avgVolume?: number
  avgIntensity?: number
}

interface Event {
  id: number
  name: string | null
  category: string | null
  type: string | null
  date?: string
}

export interface TrainingPlan {
  macrocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    planning_context?: unknown | null
  }
  mesocycles: Mesocycle[]
  events: Event[]
  status?: "active" | "draft" | "completed"
}

type HistoryState = {
  plan: TrainingPlan
  timestamp: number
}

interface TrainingPlanWorkspaceProps {
  initialPlan: TrainingPlan
  onPlanUpdate?: (plan: TrainingPlan) => void
  /** @deprecated Group filter removed — plans have 1 group. Kept for microcycle creation fallback. */
  selectedGroupId?: number | null
  onGenerateWeek?: (microcycleId: number, microcycleName: string | null) => void
  onReviewWeek?: (microcycleId: number, weeklyInsights?: unknown) => void
  /** Slot for filter bar rendered below PlanPageHeader */
  filterBar?: React.ReactNode
  /** Selected event groups for session filtering (multi-select) */
  selectedSubgroups?: string[]
}

/** Format a date string as "12 Feb" (short day + month) */
function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/**
 * Find the current mesocycle and microcycle based on today's date
 * Falls back to first mesocycle if no current week is found
 */
function findCurrentPeriod(plan: TrainingPlan): { meso: Mesocycle | null; micro: Microcycle | null } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // First, try to find by microcycle dates (most specific)
  for (const meso of plan.mesocycles) {
    for (const micro of meso.microcycles) {
      if (micro.start_date && micro.end_date) {
        const startDate = new Date(micro.start_date)
        const endDate = new Date(micro.end_date)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        if (today >= startDate && today <= endDate) {
          return { meso, micro }
        }
      }
    }
  }

  // Fallback: find by mesocycle dates
  for (const meso of plan.mesocycles) {
    if (meso.start_date && meso.end_date) {
      const startDate = new Date(meso.start_date)
      const endDate = new Date(meso.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)

      if (today >= startDate && today <= endDate) {
        // Found current mesocycle, try to find microcycle by position
        // Calculate which week we're in based on start date
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysSinceStart / 7)
        const micro = meso.microcycles[weekIndex] || meso.microcycles[0] || null
        return { meso, micro }
      }
    }
  }

  // Final fallback: first mesocycle, first microcycle
  const fallbackMeso = plan.mesocycles.length > 0 ? plan.mesocycles[0] : null
  return {
    meso: fallbackMeso,
    micro: fallbackMeso?.microcycles?.[0] ?? null
  }
}

/**
 * Check if a microcycle is the current week
 */
function isCurrentWeek(micro: Microcycle): boolean {
  if (!micro.start_date || !micro.end_date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(micro.start_date)
  const endDate = new Date(micro.end_date)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  return today >= startDate && today <= endDate
}

export function TrainingPlanWorkspace({ initialPlan, onPlanUpdate, selectedGroupId, onGenerateWeek, onReviewWeek, filterBar, selectedSubgroups }: TrainingPlanWorkspaceProps) {
  const router = useRouter()
  const [plan, setPlan] = useState(initialPlan)

  // Auto-navigate to current week on initial load
  const initialPeriod = useMemo(() => findCurrentPeriod(initialPlan), [initialPlan])
  const [selectedMeso, setSelectedMeso] = useState<Mesocycle | null>(initialPeriod.meso)
  const [selectedMicro, setSelectedMicro] = useState<Microcycle | null>(initialPeriod.micro)

  const [mobileView, setMobileView] = useState<"meso" | "micro" | "session">(initialPeriod.micro ? "micro" : "meso")
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")
  const [mobileTransitionEnabled, setMobileTransitionEnabled] = useState(false)

  const [history, setHistory] = useState<HistoryState[]>([{ plan: initialPlan, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // After hydration: fix mobileView if needed, then enable slide transitions
  useEffect(() => {
    if (selectedMicro && mobileView === "meso") {
      setMobileView("micro")
    }
    // Enable transitions one frame after mount so initial position is instant
    requestAnimationFrame(() => setMobileTransitionEnabled(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dialog states
  const [mesoDialogOpen, setMesoDialogOpen] = useState(false)
  const [editingMeso, setEditingMeso] = useState<Mesocycle | null>(null)
  const [microDialogOpen, setMicroDialogOpen] = useState(false)
  const [editingMicro, setEditingMicro] = useState<Microcycle | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copyingSession, setCopyingSession] = useState<Session | null>(null)
  const [duplicateWeekDialogOpen, setDuplicateWeekDialogOpen] = useState(false)
  const [duplicatingMicrocycle, setDuplicatingMicrocycle] = useState<Microcycle | null>(null)
  const [duplicatingMesocycle, setDuplicatingMesocycle] = useState<Mesocycle | null>(null)

  const { toast } = useToast()

  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up debounced title save on unmount
  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current)
    }
  }, [])

  const addToHistory = useCallback((newPlan: TrainingPlan) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1)
      newHistory.push({ plan: newPlan, timestamp: Date.now() })
      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift()
        return newHistory
      }
      return newHistory
    })

    setHistoryIndex(prevIndex => {
      const newHistory = history.slice(0, prevIndex + 1)
      if (newHistory.length <= 50) {
        return prevIndex + 1
      }
      return prevIndex
    })

    setPlan(newPlan)
    onPlanUpdate?.(newPlan)
  }, [historyIndex, history, onPlanUpdate])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const newPlan = history[newIndex].plan
      setPlan(newPlan)
      onPlanUpdate?.(newPlan)
    }
  }, [historyIndex, history, onPlanUpdate])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const newPlan = history[newIndex].plan
      setPlan(newPlan)
      onPlanUpdate?.(newPlan)
    }
  }, [historyIndex, history, onPlanUpdate])

  const handleSaveMesocycle = useCallback(async (mesocycle: MesocycleFormData) => {
    try {
      if (mesocycle.id) {
        // Update existing mesocycle
        const result = await updateMesocycleAction(mesocycle.id, {
          name: mesocycle.name,
          description: mesocycle.description,
          start_date: mesocycle.start_date,
          end_date: mesocycle.end_date,
          metadata: mesocycle.metadata,
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Mesocycle updated",
          description: "Your changes have been saved.",
        })
      } else {
        // Create new mesocycle
        const result = await createMesocycleAction({
          name: mesocycle.name || "New Mesocycle",
          description: mesocycle.description || undefined,
          start_date: mesocycle.start_date || new Date().toISOString().split('T')[0],
          end_date: mesocycle.end_date || new Date().toISOString().split('T')[0],
          macrocycle_id: plan.macrocycle.id,
          metadata: mesocycle.metadata,
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
          return
        }

        // Update the mesocycle with the new ID from the server
        mesocycle.id = result.data?.id

        toast({
          title: "Mesocycle created",
          description: "New training phase added.",
        })
      }

      // Update local state
      const newPlan = {
        ...plan,
        mesocycles: mesocycle.id
          ? plan.mesocycles.map((m) => (m.id === mesocycle.id ? { ...m, ...mesocycle } as Mesocycle : m))
          : [...plan.mesocycles, { ...mesocycle, microcycles: [] } as Mesocycle],
      }
      addToHistory(newPlan)
    } catch (error) {
      console.error("Error saving mesocycle:", error)
      toast({
        title: "Error",
        description: "Failed to save mesocycle. Please try again.",
        variant: "destructive",
      })
    }
  }, [plan, addToHistory, toast])

  const handleDeleteMesocycle = useCallback(async (id: number) => {
    try {
      const result = await deleteMesocycleAction(id)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Mesocycle deleted",
        description: "Training phase has been removed.",
      })

      const newPlan = {
        ...plan,
        mesocycles: plan.mesocycles.filter((m) => m.id !== id),
      }
      addToHistory(newPlan)
      if (selectedMeso?.id === id) {
        setSelectedMeso(null)
      }
    } catch (error) {
      console.error("Error deleting mesocycle:", error)
      toast({
        title: "Error",
        description: "Failed to delete mesocycle. Please try again.",
        variant: "destructive",
      })
    }
  }, [plan, addToHistory, selectedMeso, toast])

  const handleSaveMicrocycle = async (microcycle: MicrocycleFormData) => {
    if (!selectedMeso) return

    try {
      if (microcycle.id) {
        // Update existing microcycle
        const result = await updateMicrocycleAction(microcycle.id, {
          name: microcycle.name,
          description: microcycle.description,
          start_date: microcycle.start_date,
          end_date: microcycle.end_date,
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Microcycle updated",
          description: "Your changes have been saved.",
        })
      } else {
        // Create new microcycle
        const result = await createMicrocycleAction({
          name: microcycle.name || "New Week",
          description: microcycle.description || undefined,
          start_date: microcycle.start_date || new Date().toISOString().split('T')[0],
          end_date: microcycle.end_date || new Date().toISOString().split('T')[0],
          mesocycle_id: selectedMeso.id,
          athlete_group_id: selectedGroupId ?? null,
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
          return
        }

        // Update the microcycle with the new ID from the server
        microcycle.id = result.data?.id

        toast({
          title: "Microcycle created",
          description: "New training week added.",
        })
      }

      // Update local state
      const updatedMeso = {
        ...selectedMeso,
        microcycles: microcycle.id
          ? selectedMeso.microcycles.map((m) => (m.id === microcycle.id ? { ...m, ...microcycle } as Microcycle : m))
          : [...selectedMeso.microcycles, { ...microcycle, sessions: [] } as Microcycle],
      }
      const newPlan = {
        ...plan,
        mesocycles: plan.mesocycles.map((m) => (m.id === selectedMeso.id ? updatedMeso : m)),
      }
      addToHistory(newPlan)
      setSelectedMeso(updatedMeso)
    } catch (error) {
      console.error("Error saving microcycle:", error)
      toast({
        title: "Error",
        description: "Failed to save microcycle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMicrocycle = async (id: number) => {
    if (!selectedMeso) return

    try {
      const result = await deleteMicrocycleAction(id)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Microcycle deleted",
        description: "Training week has been removed.",
      })

      const updatedMeso = {
        ...selectedMeso,
        microcycles: selectedMeso.microcycles.filter((m) => m.id !== id),
      }
      const newPlan = {
        ...plan,
        mesocycles: plan.mesocycles.map((m) => (m.id === selectedMeso.id ? updatedMeso : m)),
      }
      addToHistory(newPlan)
      setSelectedMeso(updatedMeso)
      if (selectedMicro?.id === id) {
        setSelectedMicro(null)
      }
    } catch (error) {
      console.error("Error deleting microcycle:", error)
      toast({
        title: "Error",
        description: "Failed to delete microcycle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEvent = async (event: Event) => {
    const existingEvent = plan.events.find((e) => e.id === event.id)
    const isNew = !existingEvent || event.id >= 1e12 // Date.now()-generated IDs are very large

    try {
      if (isNew) {
        const result = await createRaceAction({
          name: event.name || "",
          type: event.type || "secondary",
          date: event.date || new Date().toISOString().split("T")[0],
          macrocycle_id: plan.macrocycle.id,
        })

        if (!result.isSuccess || !result.data) {
          toast({
            title: "Error",
            description: result.message || "Failed to create race.",
            variant: "destructive",
          })
          return
        }

        const savedEvent: Event = {
          id: result.data.id,
          name: result.data.name,
          category: event.category,
          type: result.data.type,
          date: result.data.date,
        }
        const newPlan = {
          ...plan,
          events: existingEvent
            ? plan.events.map((e) => (e.id === event.id ? savedEvent : e))
            : [...plan.events, savedEvent],
        }
        addToHistory(newPlan)
        toast({ title: "Race saved", description: "Race has been created." })
      } else {
        const result = await updateRaceAction(event.id, {
          name: event.name || undefined,
          type: event.type || undefined,
          date: event.date || undefined,
        })

        if (!result.isSuccess) {
          toast({
            title: "Error",
            description: result.message || "Failed to update race.",
            variant: "destructive",
          })
          return
        }

        const newPlan = {
          ...plan,
          events: plan.events.map((e) => (e.id === event.id ? event : e)),
        }
        addToHistory(newPlan)
        toast({ title: "Race updated", description: "Race has been updated." })
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Failed to save race. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      const result = await deleteRaceAction(id)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message || "Failed to delete race.",
          variant: "destructive",
        })
        return
      }

      const newPlan = {
        ...plan,
        events: plan.events.filter((e) => e.id !== id),
      }
      addToHistory(newPlan)
      toast({ title: "Race deleted", description: "Race has been removed." })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete race. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveSession = async (session: Session) => {
    if (!selectedMeso || !selectedMicro) return

    // Optimistic local state update
    const updatedMicro = {
      ...selectedMicro,
      sessions: selectedMicro.sessions.some((s) => s.id === session.id)
        ? selectedMicro.sessions.map((s) => (s.id === session.id ? session : s))
        : [...selectedMicro.sessions, session],
    }
    const updatedMeso = {
      ...selectedMeso,
      microcycles: selectedMeso.microcycles.map((m) => (m.id === selectedMicro.id ? updatedMicro : m)),
    }
    const newPlan = {
      ...plan,
      mesocycles: plan.mesocycles.map((m) => (m.id === selectedMeso.id ? updatedMeso : m)),
    }
    addToHistory(newPlan)
    setSelectedMeso(updatedMeso)
    setSelectedMicro(updatedMicro)

    // Persist to server
    try {
      const result = await updateSessionPlanAction(session.id, {
        name: session.name,
        day: session.day,
      })

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Session saved",
        description: "Your changes have been saved.",
      })
    } catch (error) {
      console.error("Error saving session:", error)
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async (id: string) => {
    if (!selectedMeso || !selectedMicro) return

    // Optimistic local state update
    const updatedMicro = {
      ...selectedMicro,
      sessions: selectedMicro.sessions.filter((s) => s.id !== id),
    }
    const updatedMeso = {
      ...selectedMeso,
      microcycles: selectedMeso.microcycles.map((m) => (m.id === selectedMicro.id ? updatedMicro : m)),
    }
    const newPlan = {
      ...plan,
      mesocycles: plan.mesocycles.map((m) => (m.id === selectedMeso.id ? updatedMeso : m)),
    }
    addToHistory(newPlan)
    setSelectedMeso(updatedMeso)
    setSelectedMicro(updatedMicro)

    // Persist to server
    try {
      const result = await deleteSessionPlanAction(id)

      if (!result.isSuccess) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Session deleted",
        description: result.message,
      })
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCopySession = async (sessionId: string, targetMicrocycleId: number, targetDay: number) => {
    const result = await copySessionAction(sessionId, targetMicrocycleId, targetDay)

    if (result.isSuccess) {
      toast({
        title: "Session copied",
        description: result.message,
      })
      // Refresh the page to show the new session
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleDuplicateWeek = async (sourceMicrocycleId: number, targetMicrocycleIds: number[]) => {
    const result = await duplicateMicrocycleSessionsAction(sourceMicrocycleId, targetMicrocycleIds)

    if (result.isSuccess) {
      toast({
        title: "Week duplicated",
        description: result.message,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleMesoClick = (meso: Mesocycle) => {
    setSelectedMeso(meso)
    setSlideDirection("left")
    setMobileView("micro")
  }

  const handleMicroClick = (micro: Microcycle) => {
    setSelectedMicro(micro)
    setSlideDirection("left")
    setMobileView("session")
  }

  const handleBackToMeso = () => {
    setSlideDirection("right")
    setMobileView("meso")
    setSelectedMicro(null)
  }

  const handleBackToMicro = () => {
    setSlideDirection("right")
    setMobileView("micro")
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance) {
      if (mobileView === "session") {
        handleBackToMicro()
      } else if (mobileView === "micro") {
        handleBackToMeso()
      }
    }

    touchStartX.current = 0
    touchEndX.current = 0
  }

  const getTransformValue = () => {
    // With w-[300%] track and w-1/3 slides, each slide is 33.333% of the track
    // So we translate by 33.333% per slide
    switch (mobileView) {
      case "meso":
        return "translateX(0%)"
      case "micro":
        return "translateX(-33.333%)"
      case "session":
        return "translateX(-66.666%)"
      default:
        return "translateX(0%)"
    }
  }

  // Get navigation label based on current view
  const getNavLabel = () => {
    switch (mobileView) {
      case "meso": return "Phases"
      case "micro": return "Weeks"
      case "session": return "Sessions"
      default: return ""
    }
  }

  // Navigation handlers for header arrows
  const handleNavBack = () => {
    if (mobileView === "session") {
      handleBackToMicro()
    } else if (mobileView === "micro") {
      handleBackToMeso()
    }
  }

  const handleNavForward = () => {
    if (mobileView === "meso" && selectedMeso) {
      setSlideDirection("left")
      setMobileView("micro")
    } else if (mobileView === "micro" && selectedMicro) {
      setSlideDirection("left")
      setMobileView("session")
    }
  }

  // Filter sessions by selected event groups (checks both session-level and exercise-level tags)
  const filterSessions = useCallback((sessions: Session[]) => {
    if (!selectedSubgroups || selectedSubgroups.length === 0) return sessions
    return sessions.filter(session => {
      // Union of session-level tags and exercise-level tags
      const sessionTags = session.sessionTargetSubgroups ?? []
      const exerciseTags = (session.targetSubgroups ?? []).flat()
      // No tags at all — shared session, always visible
      if (sessionTags.length === 0 && exerciseTags.length === 0) return true
      return sessionTags.some(g => selectedSubgroups.includes(g))
        || exerciseTags.some(g => selectedSubgroups.includes(g))
    })
  }, [selectedSubgroups])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PlanPageHeader
        title={plan.macrocycle.name || "Training Plan"}
        backPath="/plans"
        backLabel="Back to Plans"
        status={plan.status}
        editable
        onTitleChange={(newName) => {
          // Optimistic local state update
          setPlan((prev) => ({
            ...prev,
            macrocycle: { ...prev.macrocycle, name: newName },
          }))

          // Debounced server persistence
          if (titleSaveTimeoutRef.current) {
            clearTimeout(titleSaveTimeoutRef.current)
          }
          titleSaveTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await updateMacrocycleAction(plan.macrocycle.id, { name: newName })
              if (!result.isSuccess) {
                toast({
                  title: "Error",
                  description: result.message,
                  variant: "destructive",
                })
              } else {
                toast({
                  title: "Plan renamed",
                  description: "Plan title has been saved.",
                })
              }
            } catch (error) {
              console.error("Error renaming plan:", error)
              toast({
                title: "Error",
                description: "Failed to save plan title. Please try again.",
                variant: "destructive",
              })
            }
          }, 1000)
        }}
        // Mobile navigation arrows
        showNavArrows
        canNavBack={mobileView !== "meso"}
        canNavForward={
          (mobileView === "meso" && selectedMeso !== null) ||
          (mobileView === "micro" && selectedMicro !== null)
        }
        onNavBack={handleNavBack}
        onNavForward={handleNavForward}
        navLabel={getNavLabel()}
      />

      {/* Filter Bar (group + event group) */}
      {filterBar}

      {/* Main Content */}
      <main className="px-4 py-3 sm:p-4 lg:p-6">
        {/* Desktop View - 3 Column Grid (left narrower, right wider for session cards) */}
        <div className="hidden lg:grid lg:gap-6" style={{ gridTemplateColumns: '1fr 1.1fr 1.3fr' }}>
          {/* Left Panel - Mesocycle Timeline */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Training Phases</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMeso(null)
                  setMesoDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {plan.mesocycles.map((meso) => (
                <div
                  key={meso.id}
                  onClick={() => setSelectedMeso(meso)}
                  className={`w-full rounded-lg border-l-4 p-4 text-left transition-all hover:bg-accent cursor-pointer ${
                    selectedMeso?.id === meso.id ? "bg-accent" : "bg-card"
                  }`}
                  style={{ borderLeftColor: meso.metadata?.color || ["#6478b4", "#548a7c", "#b8864e", "#b45e72", "#7f6daa", "#5090a0", "#7e9a56", "#a87558"][plan.mesocycles.indexOf(meso) % 8] }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{meso.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{meso.description}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {meso.microcycles.length} weeks
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {meso.totalSessions || 0} sessions
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingMeso(meso)
                        setMesoDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Events */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Events & Races</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingEvent(null)
                    setEventDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {[...plan.events]
                  .sort((a, b) => {
                    const da = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY
                    const db = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY
                    return da - db
                  })
                  .map((event) => {
                    const isPast = event.date ? new Date(event.date).getTime() < Date.now() : false
                    return (
                  <div key={event.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isPast ? "opacity-60" : ""}`}>
                    <Calendar
                      className={`h-5 w-5 shrink-0 ${
                        event.type === "primary" ? "text-red-500" : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.date || "No date"}</p>
                    </div>
                    <Badge variant={event.type === "primary" ? "default" : "secondary"} className="shrink-0">
                      {event.type}
                    </Badge>
                    {isPast && (
                      <Badge variant="secondary" className="shrink-0">
                        Completed
                      </Badge>
                    )}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingEvent(event)
                          setEventDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Middle Panel - Microcycle Grid */}
          <div>
            {selectedMeso ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">{selectedMeso.name}</h2>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 ml-2 bg-transparent"
                    onClick={() => {
                      setEditingMicro(null)
                      setMicroDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedMeso.microcycles.map((micro) => (
                    <div
                      key={micro.id}
                      onClick={() => setSelectedMicro(micro)}
                      className={`w-full rounded-lg border p-4 text-left transition-all hover:bg-accent cursor-pointer ${
                        selectedMicro?.id === micro.id ? "bg-accent ring-2 ring-primary" : "bg-card"
                      } ${isCurrentWeek(micro) ? "border-primary/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{micro.name}</h3>
                            {isCurrentWeek(micro) && (
                              <Badge variant="default" className="text-xs">
                                This Week
                              </Badge>
                            )}
                            {micro.isDeload && (
                              <Badge variant="secondary" className="text-xs">
                                Deload
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatShortDate(micro.start_date)} – {formatShortDate(micro.end_date)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{micro.description}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Duplicate week"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDuplicatingMicrocycle(micro)
                              setDuplicatingMesocycle(selectedMeso)
                              setDuplicateWeekDialogOpen(true)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMicro(micro)
                              setMicroDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 xl:gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] xl:text-xs text-muted-foreground">Vol</span>
                          <div className="h-2 w-12 xl:w-16 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-blue-500" style={{ width: `${((micro.volume || 0) / 10) * 100}%` }} />
                          </div>
                          <span className="text-[10px] xl:text-xs text-muted-foreground">{micro.volume || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] xl:text-xs text-muted-foreground">Int</span>
                          <div className="h-2 w-12 xl:w-16 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full bg-orange-500"
                              style={{ width: `${((micro.intensity || 0) / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] xl:text-xs text-muted-foreground">{micro.intensity || 0}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {micro.sessions.length} sessions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a mesocycle to view weeks
              </div>
            )}
          </div>

          {/* Right Panel - Session Details */}
          <div>
            {selectedMicro ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">{selectedMicro.name} Sessions</h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {onReviewWeek && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => onReviewWeek(selectedMicro.id)}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Insights
                      </Button>
                    )}
                    {onGenerateWeek && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 bg-transparent"
                        onClick={() => onGenerateWeek(selectedMicro.id, selectedMicro.name)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        setEditingSession(null)
                        setSessionDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {filterSessions(selectedMicro.sessions).map((session) => {
                    const dayShortMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    const idx = Math.max(1, Math.min(7, session.day || 1)) - 1
                    // Compute actual date from microcycle start_date + day offset
                    const sessionDate = selectedMicro.start_date
                      ? (() => { const d = new Date(selectedMicro.start_date!); d.setDate(d.getDate() + idx); return d.getDate() })()
                      : null
                    return (
                    <div
                      key={session.id}
                      className="w-full rounded-lg border overflow-hidden transition-all hover:bg-accent bg-card cursor-pointer"
                      onClick={() => {
                        router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                      }}
                    >
                      <div className="flex">
                        {/* Weekday sidebar */}
                        <div className="w-16 bg-primary/80 border-r border-primary flex items-center justify-center shrink-0">
                          <div className="text-center">
                            <div className="text-sm font-medium text-primary-foreground">{dayShortMap[idx]}</div>
                            {sessionDate !== null && (
                              <div className="text-xs text-primary-foreground/80">{sessionDate}</div>
                            )}
                          </div>
                        </div>

                        {/* Session content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{session.name}</h3>
                              {/* Event group badges */}
                              {(() => {
                                const groups = session.sessionTargetSubgroups
                                  ?? (session.targetSubgroups?.length ? [...new Set(session.targetSubgroups.flat())] : null)
                                return groups && groups.length > 0 ? (
                                  <div className="mt-2 flex gap-1 flex-wrap">
                                    {groups.map(g => (
                                      <SubgroupBadge key={g} value={abbreviateSubgroup(g)} size="md" />
                                    ))}
                                  </div>
                                ) : null
                              })()}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCopyingSession(session)
                                  setCopyDialogOpen(true)
                                }}
                                title="Copy session"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a microcycle to view sessions
              </div>
            )}
          </div>
        </div>

        {/* Mobile View - Sliding Panels */}
        <div className="lg:hidden overflow-hidden w-full max-w-full relative" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className={`flex w-[300%] ${mobileTransitionEnabled ? 'transition-transform duration-300 ease-out' : ''}`} style={{ transform: getTransformValue() }}>
            {/* Mesocycle View - Always rendered */}
            <div className="w-1/3 shrink-0 px-0.5">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Training Phases</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 bg-transparent"
                    onClick={() => {
                      setEditingMeso(null)
                      setMesoDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {plan.mesocycles.map((meso) => (
                    <div
                      key={meso.id}
                      onClick={() => handleMesoClick(meso)}
                      className="rounded-lg border-l-4 p-4 text-left transition-all hover:bg-accent cursor-pointer"
                      style={{ borderLeftColor: meso.metadata?.color || ["#6478b4", "#548a7c", "#b8864e", "#b45e72", "#7f6daa", "#5090a0", "#7e9a56", "#a87558"][plan.mesocycles.indexOf(meso) % 8] }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold break-words">{meso.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground break-words">{meso.description}</p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {meso.microcycles.length} weeks
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {meso.totalSessions || 0} sessions
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMeso(meso)
                              setMesoDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Events */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Events & Races</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 bg-transparent"
                      onClick={() => {
                        setEditingEvent(null)
                        setEventDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {plan.events.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Calendar
                          className={`h-5 w-5 shrink-0 ${
                            event.type === "primary" ? "text-red-500" : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.date || "No date"}</p>
                        </div>
                        <Badge variant={event.type === "primary" ? "default" : "secondary"} className="shrink-0">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Microcycle View - Always rendered */}
            <div className="w-1/3 shrink-0 px-0.5">
              <div>
                {selectedMeso ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold truncate">{selectedMeso.name}</h2>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 ml-2 bg-transparent"
                        onClick={() => {
                          setEditingMicro(null)
                          setMicroDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {selectedMeso.microcycles.map((micro) => (
                        <div
                          key={micro.id}
                          onClick={() => handleMicroClick(micro)}
                          className={`w-full rounded-lg border p-4 text-left transition-all hover:bg-accent cursor-pointer ${isCurrentWeek(micro) ? "border-primary/50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{micro.name}</h3>
                                {isCurrentWeek(micro) && (
                                  <Badge variant="default" className="text-xs">
                                    This Week
                                  </Badge>
                                )}
                                {micro.isDeload && (
                                  <Badge variant="secondary" className="text-xs">
                                    Deload
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatShortDate(micro.start_date)} – {formatShortDate(micro.end_date)}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{micro.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2 sm:gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground w-6 sm:w-auto">Vol</span>
                                  <div className="h-2 w-10 sm:w-14 overflow-hidden rounded-full bg-secondary">
                                    <div className="h-full bg-blue-500" style={{ width: `${((micro.volume || 0) / 10) * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{micro.volume || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground w-6 sm:w-auto">Int</span>
                                  <div className="h-2 w-10 sm:w-14 overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className="h-full bg-orange-500"
                                      style={{ width: `${((micro.intensity || 0) / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{micro.intensity || 0}</span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {micro.sessions.length} sessions
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Duplicate week"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDuplicatingMicrocycle(micro)
                                  setDuplicatingMesocycle(selectedMeso)
                                  setDuplicateWeekDialogOpen(true)
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingMicro(micro)
                                  setMicroDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Select a mesocycle to view weeks
                  </div>
                )}
              </div>
            </div>

            {/* Session View - Always rendered */}
            <div className="w-1/3 shrink-0 px-0.5">
              <div>
                {selectedMicro ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold truncate">{selectedMicro.name} Sessions</h2>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {onReviewWeek && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => onReviewWeek(selectedMicro.id)}
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Insights
                          </Button>
                        )}
                        {onGenerateWeek && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 bg-transparent"
                            onClick={() => onGenerateWeek(selectedMicro.id, selectedMicro.name)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => {
                            setEditingSession(null)
                            setSessionDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {filterSessions(selectedMicro.sessions).map((session) => {
                        const dayShortMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                        const idx = Math.max(1, Math.min(7, session.day || 1)) - 1
                        const sessionDate = selectedMicro.start_date
                          ? (() => { const d = new Date(selectedMicro.start_date!); d.setDate(d.getDate() + idx); return d.getDate() })()
                          : null
                        return (
                        <div
                          key={session.id}
                          className="w-full rounded-lg border overflow-hidden transition-all hover:bg-accent bg-card cursor-pointer"
                          onClick={() => {
                            router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                          }}
                        >
                          <div className="flex">
                            {/* Weekday sidebar */}
                            <div className="w-16 bg-primary/80 border-r border-primary flex items-center justify-center shrink-0">
                              <div className="text-center">
                                <div className="text-sm font-medium text-primary-foreground">{dayShortMap[idx]}</div>
                                {sessionDate !== null && (
                                  <div className="text-xs text-primary-foreground/80">{sessionDate}</div>
                                )}
                              </div>
                            </div>

                            {/* Session content */}
                            <div className="flex-1 p-4 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold">{session.name}</h3>
                                  {/* Event group badges */}
                                  {(() => {
                                    const groups = session.sessionTargetSubgroups
                                      ?? (session.targetSubgroups?.length ? [...new Set(session.targetSubgroups.flat())] : null)
                                    return groups && groups.length > 0 ? (
                                      <div className="mt-2 flex gap-1 flex-wrap">
                                        {groups.map(g => (
                                          <SubgroupBadge key={g} value={abbreviateSubgroup(g)} size="md" />
                                        ))}
                                      </div>
                                    ) : null
                                  })()}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCopyingSession(session)
                                      setCopyDialogOpen(true)
                                    }}
                                    title="Copy session"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Select a microcycle to view sessions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <EditMesocycleDialog
        mesocycle={editingMeso}
        open={mesoDialogOpen}
        onOpenChange={setMesoDialogOpen}
        onSave={handleSaveMesocycle}
        onDelete={handleDeleteMesocycle}
      />

      <EditMicrocycleDialog
        microcycle={editingMicro}
        open={microDialogOpen}
        onOpenChange={setMicroDialogOpen}
        onSave={handleSaveMicrocycle}
        onDelete={handleDeleteMicrocycle}
      />

      <EditRaceDialog
        event={editingEvent}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <EditSessionDialog
        session={editingSession}
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
      />

      <CopySessionDialog
        session={copyingSession}
        mesocycles={plan.mesocycles}
        currentMicrocycleId={selectedMicro?.id || null}
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        onCopy={handleCopySession}
      />

      <DuplicateWeekDialog
        sourceMicrocycle={duplicatingMicrocycle}
        mesocycle={duplicatingMesocycle}
        open={duplicateWeekDialogOpen}
        onOpenChange={setDuplicateWeekDialogOpen}
        onDuplicate={handleDuplicateWeek}
      />
    </div>
  )
}
