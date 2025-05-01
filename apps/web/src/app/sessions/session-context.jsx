"use client"

import React, { createContext, useContext, useState } from "react"
import { useToast } from "@/components/ui/toast"

const SprintSessionContext = createContext(null)

export function useSprintSession() {
  const context = useContext(SprintSessionContext)
  if (!context) {
    throw new Error("useSprintSession must be used within a SprintSessionProvider")
  }
  return context
}

export function SprintSessionProvider({ children, initialSession }) {
  const { toast } = useToast()
  const [session, setSession] = useState(initialSession)

  const updateSessionConfig = (config) => {
    setSession((prev) => ({ ...prev, ...config }))
    toast({ title: "Session updated", description: "Session configuration has been updated" })
  }

  // Group management
  const addGroup = (name) => {
    const newGroupId = Date.now().toString()
    const newGroup = {
      id: newGroupId,
      name,
      runs: [{ id: "1", distance: 60 }],
    }
    setSession((prev) => ({ ...prev, groups: [...prev.groups, newGroup] }))
    toast({ title: "Group added", description: `${name} has been added to the session` })
  }

  const updateGroup = (groupId, name) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    }))
  }

  const removeGroup = (groupId) => {
    const group = session.groups.find((g) => g.id === groupId)
    const runIds = group?.runs.map((r) => r.id) || []
    const athleteIds = session.athletes
      .filter((a) => a.groupId === groupId)
      .map((a) => a.id)

    setSession((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
      athletes: prev.athletes.filter((a) => a.groupId !== groupId),
      results: prev.results.filter(
        (r) => !athleteIds.includes(r.athleteId) && !runIds.includes(r.runId)
      ),
    }))
    toast({ title: "Group removed", description: `${group?.name || "Group"} and all associated data have been removed` })
  }

  // Run management
  const updateRuns = (groupId, runs) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, runs } : g)),
    }))
    toast({ title: "Runs updated", description: `Updated to ${runs.length} runs for the group` })
  }

  const addRun = (groupId, distance) => {
    setSession((prev) => {
      const group = prev.groups.find((g) => g.id === groupId)
      if (!group) return prev
      const newRunId = (Math.max(0, ...group.runs.map((r) => Number.parseInt(r.id))) + 1).toString()
      const newRun = { id: newRunId, distance }
      return {
        ...prev,
        groups: prev.groups.map((g) => (g.id === groupId ? { ...g, runs: [...g.runs, newRun] } : g)),
      }
    })
  }

  const removeRun = (groupId, runId) => {
    setSession((prev) => {
      const athletesInGroup = prev.athletes.filter((a) => a.groupId === groupId).map((a) => a.id)
      return {
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, runs: g.runs.filter((r) => r.id !== runId) } : g
        ),
        results: prev.results.filter(
          (r) => !(r.runId === runId && athletesInGroup.includes(r.athleteId))
        ),
      }
    })
    toast({ title: "Run removed", description: `Run and all associated results have been removed` })
  }

  const updateRunDistance = (groupId, runId, distance) => {
    setSession((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? { ...g, runs: g.runs.map((r) => (r.id === runId ? { ...r, distance } : r)) }
          : g
      ),
    }))
  }

  // Athlete management
  const addAthlete = ({ name, groupId }) => {
    const newAthlete = { id: Date.now().toString(), name, groupId }
    setSession((prev) => ({ ...prev, athletes: [...prev.athletes, newAthlete] }))
    toast({ title: "Athlete added", description: `${name} has been added to the session` })
  }

  const removeAthlete = (athleteId) => {
    const athlete = session.athletes.find((a) => a.id === athleteId)
    setSession((prev) => ({
      ...prev,
      athletes: prev.athletes.filter((a) => a.id !== athleteId),
      results: prev.results.filter((r) => r.athleteId !== athleteId),
    }))
    toast({ title: "Athlete removed", description: `${athlete?.name || "Athlete"} and all their results have been removed` })
  }

  const moveAthlete = (athleteId, newGroupId) => {
    setSession((prev) => {
      const athlete = prev.athletes.find((a) => a.id === athleteId)
      const oldGroup = athlete?.groupId
      if (oldGroup === newGroupId) return prev
      const oldRunIds = prev.groups.find((g) => g.id === oldGroup)?.runs.map((r) => r.id) || []
      return {
        ...prev,
        athletes: prev.athletes.map((a) => (a.id === athleteId ? { ...a, groupId: newGroupId } : a)),
        results: prev.results.filter(
          (r) => !(r.athleteId === athleteId && oldRunIds.includes(r.runId))
        ),
      }
    })
    toast({ title: "Athlete moved", description: `${athleteId} has been moved to a different group` })
  }

  // Result management
  const updateResult = (athleteId, runId, time, customDistance) => {
    setSession((prev) => {
      const idx = prev.results.findIndex((r) => r.athleteId === athleteId && r.runId === runId)
      let newResults = []
      if (idx >= 0) {
        newResults = [...prev.results]
        newResults[idx] = { athleteId, runId, time, customDistance }
      } else {
        newResults = [...prev.results, { athleteId, runId, time, customDistance }]
      }
      return { ...prev, results: newResults }
    })
  }

  const getResult = (athleteId, runId) => {
    return session.results.find((r) => r.athleteId === athleteId && r.runId === runId)
  }

  // Helpers
  const getGroupById = (groupId) => session.groups.find((g) => g.id === groupId)
  const getAthletesByGroup = (groupId) => session.athletes.filter((a) => a.groupId === groupId)
  const getRunsForGroup = (groupId) => getGroupById(groupId)?.runs || []

  const value = {
    session,
    updateSessionConfig,
    addGroup,
    updateGroup,
    removeGroup,
    updateRuns,
    addRun,
    removeRun,
    updateRunDistance,
    addAthlete,
    removeAthlete,
    moveAthlete,
    updateResult,
    getResult,
    getGroupById,
    getAthletesByGroup,
    getRunsForGroup,
  }

  return <SprintSessionContext.Provider value={value}>{children}</SprintSessionContext.Provider>
} 