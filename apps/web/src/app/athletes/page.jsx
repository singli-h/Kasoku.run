"use client"

import { useState, useEffect } from "react"
import SummaryCards from "@/components/athletes/SummaryCards"
import AthletesList from "@/components/athletes/AthletesList"
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import GroupManagerDialog from '@/components/athletes/GroupManagerDialog'

export default function AthletesPage() {
  const [athletes, setAthletes] = useState([])
  const [groups, setGroups] = useState([])
  const [isGroupOpen, setIsGroupOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [resAth, resGrp] = await Promise.all([
        fetch('/api/athletes', { credentials: 'include' }),
        fetch('/api/athlete-groups', { credentials: 'include' })
      ])
      const jsonAth = await resAth.json()
      const jsonGrp = await resGrp.json()
      setAthletes(jsonAth.data || [])
      setGroups(jsonGrp.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-4">Loading athletes...</div>
  }

  return (
    <div className="p-4">
      <Heading size="lg" className="mb-4">Athletes</Heading>
      <SummaryCards athletes={athletes} />
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setIsGroupOpen(true)}>
          Manage Groups
        </Button>
      </div>
      <AthletesList athletes={athletes} groups={groups} />
      <GroupManagerDialog
        open={isGroupOpen}
        onOpenChange={setIsGroupOpen}
        groups={groups}
        setGroups={setGroups}
      />
    </div>
  )
}