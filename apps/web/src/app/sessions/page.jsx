"use client"

import React, { useState } from "react"
import { SprintSessionProvider, useSprintSession } from "./session-context"
import { SessionHeader } from "./session-header"
import { GroupSection } from "./group-section"
import { RunConfigPanel } from "./run-config-panel"

function SessionsInner() {
  const { session } = useSprintSession()
  const [configGroupId, setConfigGroupId] = useState(null)

  return (
    <div className="p-6 space-y-6">
      <SessionHeader onConfigRuns={setConfigGroupId} />
      {session.groups.map((group) => (
        <GroupSection key={group.id} groupId={group.id} onConfigRuns={setConfigGroupId} />
      ))}
      {configGroupId && <RunConfigPanel groupId={configGroupId} onClose={() => setConfigGroupId(null)} />}
    </div>
  )
}

export default function SessionsPage() {
  // Initialize an empty session structure
  const [initialSession] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "draft",
    groups: [],
    athletes: [],
    runs: [],
    results: [],
    availableAthletes: []
  })

  return (
    <SprintSessionProvider initialSession={initialSession}>
      <SessionsInner />
    </SprintSessionProvider>
  )
} 