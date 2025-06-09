"use client"

import React from "react"
import { SessionProvider } from "@/components/sessions/session-context"
import SessionHeader from "@/components/sessions/session-header"
import GroupSection from "@/components/sessions/group-section"
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = url => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function SessionsPage() {
  const { data, error } = useSWR('/api/coach/sessions', fetcher)
  const groups = data?.sessions || []
  const today = new Date().toISOString().split('T')[0]
  // Find today's groups; fall back to upcoming
  const todays = groups.filter(g => g.date === today)
  const displayGroups = todays.length ? todays : groups.filter(g => g.date > today)

  if (error) return <div className="p-6 text-center">Error loading sessions.</div>
  if (!data) return <div className="p-6">Loading sessions...</div>
  if (displayGroups.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">No session found for today or upcoming dates.</p>
        <Link href="/plans" className="text-primary underline">Create a session</Link>
      </div>
    )
  }

  return (
    <>
      {/* Single header for all groups */}
      <SessionProvider overrideGroup={displayGroups[0]}>
        <SessionHeader />
      </SessionProvider>

      {/* Render each group table */}
      {displayGroups.map(group => (
        <div key={group.id} className="p-6">
          <SessionProvider overrideGroup={group}>
            <GroupSection />
          </SessionProvider>
        </div>
      ))}
    </>
  )
} 