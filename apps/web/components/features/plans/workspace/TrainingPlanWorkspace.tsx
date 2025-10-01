"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Settings, Edit, Trash2, Undo, Redo } from "lucide-react"
import { EditMesocycleDialog, type MesocycleFormData } from "./components/EditMesocycleDialog"
import { EditMicrocycleDialog, type MicrocycleFormData } from "./components/EditMicrocycleDialog"
import { EditRaceDialog } from "./components/EditRaceDialog"
import { EditSessionDialog } from "./components/EditSessionDialog"

// Using existing sample data structure
export interface Session {
  id: number
  day: number
  name: string
  type: 'speed' | 'strength' | 'recovery' | 'endurance' | 'power'
  duration: number
  volume: number
  intensity: number
  exercises: any[]
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
  metadata: {
    phase?: "GPP" | "SPP" | "Taper" | "Competition"
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

interface TrainingPlan {
  macrocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
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
}

export function TrainingPlanWorkspace({ initialPlan, onPlanUpdate }: TrainingPlanWorkspaceProps) {
  const router = useRouter()
  const [plan, setPlan] = useState(initialPlan)
  const [selectedMeso, setSelectedMeso] = useState<Mesocycle | null>(
    initialPlan.mesocycles.length > 0 ? initialPlan.mesocycles[0] : null
  )
  const [selectedMicro, setSelectedMicro] = useState<Microcycle | null>(null)

  const [mobileView, setMobileView] = useState<"meso" | "micro" | "session">("meso")
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")

  const [history, setHistory] = useState<HistoryState[]>([{ plan: initialPlan, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Dialog states
  const [mesoDialogOpen, setMesoDialogOpen] = useState(false)
  const [editingMeso, setEditingMeso] = useState<Mesocycle | null>(null)
  const [microDialogOpen, setMicroDialogOpen] = useState(false)
  const [editingMicro, setEditingMicro] = useState<Microcycle | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const addToHistory = (newPlan: TrainingPlan) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ plan: newPlan, timestamp: Date.now() })
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }
    setHistory(newHistory)
    setPlan(newPlan)
    onPlanUpdate?.(newPlan)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const newPlan = history[newIndex].plan
      setPlan(newPlan)
      onPlanUpdate?.(newPlan)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const newPlan = history[newIndex].plan
      setPlan(newPlan)
      onPlanUpdate?.(newPlan)
    }
  }

  const handleSaveMesocycle = (mesocycle: MesocycleFormData) => {
    const newPlan = {
      ...plan,
      mesocycles: mesocycle.id
        ? plan.mesocycles.map((m) => (m.id === mesocycle.id ? { ...m, ...mesocycle } as Mesocycle : m))
        : [...plan.mesocycles, { ...mesocycle, microcycles: [] } as Mesocycle],
    }
    addToHistory(newPlan)
  }

  const handleDeleteMesocycle = (id: number) => {
    const newPlan = {
      ...plan,
      mesocycles: plan.mesocycles.filter((m) => m.id !== id),
    }
    addToHistory(newPlan)
    if (selectedMeso?.id === id) {
      setSelectedMeso(null)
    }
  }

  const handleSaveMicrocycle = (microcycle: MicrocycleFormData) => {
    if (!selectedMeso) return
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
  }

  const handleDeleteMicrocycle = (id: number) => {
    if (!selectedMeso) return
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
  }

  const handleSaveEvent = (event: Event) => {
    const existingEvent = plan.events.find((e) => e.id === event.id)
    const newPlan = {
      ...plan,
      events: existingEvent
        ? plan.events.map((e) => (e.id === event.id ? event : e))
        : [...plan.events, event],
    }
    addToHistory(newPlan)
  }

  const handleDeleteEvent = (id: number) => {
    const newPlan = {
      ...plan,
      events: plan.events.filter((e) => e.id !== id),
    }
    addToHistory(newPlan)
  }

  const handleSaveSession = (session: Session) => {
    if (!selectedMeso || !selectedMicro) return
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
  }

  const handleDeleteSession = (id: number) => {
    if (!selectedMeso || !selectedMicro) return
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
    switch (mobileView) {
      case "meso":
        return "translateX(0%)"
      case "micro":
        return "translateX(-100%)"
      case "session":
        return "translateX(-200%)"
      default:
        return "translateX(0%)"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden flex-shrink-0 ${mobileView === "meso" ? "invisible" : "visible"}`}
                onClick={mobileView === "micro" ? handleBackToMeso : handleBackToMicro}
                disabled={mobileView === "meso"}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold truncate">{plan.macrocycle.name}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  {plan.macrocycle.start_date} - {plan.macrocycle.end_date}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex === 0} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status || "draft"}</Badge>
            <Button variant="outline" size="sm" className="hidden md:flex bg-transparent">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Desktop View - 3 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left Panel - Mesocycle Timeline */}
          <Card className="p-6">
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
                  style={{ borderLeftColor: meso.metadata?.color || "#10b981" }}
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
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingMeso(meso)
                        setMesoDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>Vol: {meso.avgVolume || 0}%</span>
                    <span>Int: {meso.avgIntensity || 0}/10</span>
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
                {plan.events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Calendar
                      className={`h-5 w-5 flex-shrink-0 ${
                        event.type === "primary" ? "text-red-500" : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.date || "No date"}</p>
                    </div>
                    <Badge variant={event.type === "primary" ? "default" : "secondary"} className="flex-shrink-0">
                      {event.type}
                    </Badge>
                    <div className="flex gap-1 flex-shrink-0">
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
                ))}
              </div>
            </div>
          </Card>

          {/* Middle Panel - Microcycle Grid */}
          <Card className="p-6">
            {selectedMeso ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">{selectedMeso.name}</h2>
                    <Badge
                      style={{
                        backgroundColor: selectedMeso.metadata?.color || "#10b981",
                        color: "white",
                      }}
                      className="mt-1"
                    >
                      {selectedMeso.metadata?.phase || "Phase"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 ml-2 bg-transparent"
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
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{micro.name}</h3>
                            {micro.isDeload && (
                              <Badge variant="secondary" className="text-xs">
                                Deload
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {micro.start_date} - {micro.end_date}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{micro.description}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingMicro(micro)
                            setMicroDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex gap-4">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-blue-500" style={{ width: `${micro.volume || 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{micro.volume || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full bg-orange-500"
                              style={{ width: `${((micro.intensity || 0) / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{micro.intensity || 0}/10</span>
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
          </Card>

          {/* Right Panel - Session Details */}
          <Card className="p-6">
            {selectedMicro ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">{selectedMicro.name} Sessions</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedMicro.start_date} - {selectedMicro.end_date}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 ml-2 bg-transparent"
                    onClick={() => {
                      setEditingSession(null)
                      setSessionDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedMicro.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="w-full rounded-lg border p-4 transition-all hover:bg-accent bg-card cursor-pointer"
                      onClick={() => {
                        // TODO: Navigate to session editor
                        alert(`Navigate to session ${session.id}`)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{session.name}</h3>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                session.type === "speed"
                                  ? "border-red-500 text-red-500"
                                  : session.type === "strength"
                                    ? "border-blue-500 text-blue-500"
                                    : session.type === "endurance"
                                      ? "border-green-500 text-green-500"
                                      : "border-gray-500 text-gray-500"
                              }`}
                            >
                              {session.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {session.duration}min
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {session.exercises.length} exercises
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a microcycle to view sessions
              </div>
            )}
          </Card>
        </div>

        {/* Mobile View - Sliding Panels */}
        <div className="lg:hidden overflow-hidden w-full" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="flex transition-transform duration-300 ease-out w-[300%]" style={{ transform: getTransformValue() }}>
            {/* Mesocycle View - Always rendered */}
            <div className="w-full flex-shrink-0">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Training Phases</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 bg-transparent"
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
                      className="w-full rounded-lg border-l-4 p-4 text-left transition-all hover:bg-accent cursor-pointer"
                      style={{ borderLeftColor: meso.metadata?.color || "#10b981" }}
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
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                      className="flex-shrink-0 bg-transparent"
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
                          className={`h-5 w-5 flex-shrink-0 ${
                            event.type === "primary" ? "text-red-500" : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.date || "No date"}</p>
                        </div>
                        <Badge variant={event.type === "primary" ? "default" : "secondary"} className="flex-shrink-0">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Microcycle View - Always rendered */}
            <div className="w-full flex-shrink-0 pl-6">
              <Card className="p-6">
                {selectedMeso ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold truncate">{selectedMeso.name}</h2>
                        <Badge
                          style={{
                            backgroundColor: selectedMeso.metadata?.color || "#10b981",
                            color: "white",
                          }}
                          className="mt-1"
                        >
                          {selectedMeso.metadata?.phase || "Phase"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 ml-2 bg-transparent"
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
                          className="w-full rounded-lg border p-4 text-left transition-all hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{micro.name}</h3>
                                {micro.isDeload && (
                                  <Badge variant="secondary" className="text-xs">
                                    Deload
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {micro.start_date} - {micro.end_date}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{micro.description}</p>
                              <div className="mt-3 flex gap-4">
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                                    <div className="h-full bg-blue-500" style={{ width: `${micro.volume || 0}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{micro.volume || 0}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className="h-full bg-orange-500"
                                      style={{ width: `${((micro.intensity || 0) / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{micro.intensity || 0}/10</span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {micro.sessions.length} sessions
                                </Badge>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
              </Card>
            </div>

            {/* Session View - Always rendered */}
            <div className="w-full flex-shrink-0 pl-6">
              <Card className="p-6">
                {selectedMicro ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold truncate">{selectedMicro.name} Sessions</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedMicro.start_date} - {selectedMicro.end_date}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 ml-2 bg-transparent"
                        onClick={() => {
                          setEditingSession(null)
                          setSessionDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {selectedMicro.sessions.map((session) => (
                        <div key={session.id} className="w-full rounded-lg border p-4 transition-all hover:bg-accent">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{session.name}</h3>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    session.type === "speed"
                                      ? "border-red-500 text-red-500"
                                      : session.type === "strength"
                                        ? "border-blue-500 text-blue-500"
                                        : session.type === "endurance"
                                          ? "border-green-500 text-green-500"
                                          : session.type === "recovery"
                                            ? "border-gray-500 text-gray-500"
                                            : "border-purple-500 text-purple-500"
                                  }`}
                                >
                                  {session.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {session.duration}min
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {session.exercises.length} exercises
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/plans/${plan.macrocycle.id}/session/${session.id}`)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Select a microcycle to view sessions
                  </div>
                )}
              </Card>
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
    </div>
  )
}
