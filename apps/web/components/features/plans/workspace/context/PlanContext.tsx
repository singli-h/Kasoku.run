"use client"

import { createContext, useContext, ReactNode } from "react"

interface PlanData {
  macrocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    user_id: number | null
    athlete_group_id: number | null
    created_at: string | null
  }
  mesocycles: Array<{
    id: number
    macrocycle_id: number | null
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    metadata: Record<string, unknown> | null
    created_at: string | null
    user_id: number | null
    microcycles: Array<{
      id: number
      mesocycle_id: number | null
      name: string | null
      description: string | null
      start_date: string | null
      end_date: string | null
      created_at: string | null
      user_id: number | null
      sessions: Array<{
        id: string
        day: number
        name: string
        type: 'speed' | 'strength' | 'recovery' | 'endurance'
        duration: number
        volume: number
        intensity: number
        exercises: Array<{
          name: string
          sets: number
          reps: string
          weight?: number
          notes?: string
        }>
      }>
    }>
  }>
  events: Array<{
    id: number
    name: string | null
    category: string | null
    type: string | null
    created_at: string | null
    updated_at: string | null
  }>
}

interface PlanContextType {
  plan: PlanData | null
  activeMesocycleId: number | null
  activeMicrocycleId: number | null
  selectedSessionId: string | null
  onMesocycleChange: (id: number | null) => void
  onMicrocycleChange: (id: number | null) => void
  onSessionChange: (id: string | null) => void
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

interface PlanContextProviderProps {
  children: ReactNode
  plan: PlanData | null
  activeMesocycleId: number | null
  activeMicrocycleId: number | null
  selectedSessionId: string | null
  onMesocycleChange: (id: number | null) => void
  onMicrocycleChange: (id: number | null) => void
  onSessionChange: (id: string | null) => void
}

export function PlanContextProvider({
  children,
  plan,
  activeMesocycleId,
  activeMicrocycleId,
  selectedSessionId,
  onMesocycleChange,
  onMicrocycleChange,
  onSessionChange,
}: PlanContextProviderProps) {
  return (
    <PlanContext.Provider
      value={{
        plan,
        activeMesocycleId,
        activeMicrocycleId,
        selectedSessionId,
        onMesocycleChange,
        onMicrocycleChange,
        onSessionChange,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (context === undefined) {
    throw new Error('usePlanContext must be used within a PlanContextProvider')
  }
  return context
}
