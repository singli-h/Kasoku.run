"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AthleteProfile from '@/components/athletes/AthleteProfile'
import { Heading } from '@/components/ui/heading'

export default function ClientAthleteDetail({ athleteId }) {
  const router = useRouter()
  const [athlete, setAthlete] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/athletes/${athleteId}`, { credentials: 'include' })
      const json = await res.json()
      if (json.status === 'success') {
        setAthlete(json.data)
      } else {
        router.replace('/athletes')
      }
      setLoading(false)
    }
    load()
  }, [athleteId, router])

  if (loading) {
    return <div className="p-4">Loading athlete...</div>
  }
  if (!athlete) {
    return <div className="p-4">Athlete not found.</div>
  }

  return (
    <div className="p-4 space-y-6">
      <Heading size="lg">{athlete.user.first_name} {athlete.user.last_name}</Heading>
      <AthleteProfile athlete={athlete} />
    </div>
  )
} 