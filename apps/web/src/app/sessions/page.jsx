"use client"

import React, { useState } from "react"
import { SessionProvider, useSession } from "@/components/sessions/session-context"
import SessionHeader from "@/components/sessions/session-header"
import GroupSection from "@/components/sessions/group-section"
import Link from 'next/link'

function SessionsInner() {
  const { activeGroup, isLoading } = useSession()
  const [configGroupId, setConfigGroupId] = useState(null)

  if (isLoading) {
    return <div className="p-6">Loading session...</div>
  }
  if (!activeGroup) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">No session found for today or upcoming dates.</p>
        <Link href="/plan" className="text-primary underline">Create a session</Link>
      </div>
    )
  }
  return (
    <div className="p-6 space-y-6">
      <SessionHeader onConfigRuns={setConfigGroupId} />
      <GroupSection onConfigRuns={setConfigGroupId} />
      {configGroupId}
    </div>
  )
}

export default function SessionsPage() {
  return (
    <SessionProvider>
      <SessionsInner />
    </SessionProvider>
  )
} 