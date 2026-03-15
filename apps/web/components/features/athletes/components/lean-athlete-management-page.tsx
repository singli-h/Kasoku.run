/**
 * Lean Athlete Management Page - MVP Implementation
 * Single-page workspace for coaches to invite and manage athletes
 * Responsive: Mobile-first with FAB + bottom sheets, desktop with inline forms
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"

// Server Actions
import { getRosterWithGroupCountsAction } from "@/actions/athletes/athlete-actions"
import { getSubgroupsAction } from "@/actions/athletes/subgroup-actions"

// Components
import { InviteAthleteForm } from "./invite-athlete-form"
import { AthleteRosterSection } from "./athlete-roster-section"
import { GroupDirectorySection } from "./group-directory-section"
import { BulkOperationsDialog } from "./bulk-operations-dialog"
import { MobileBulkActionBar } from "./mobile-bulk-action-bar"
import { SubgroupManager } from "./subgroup-manager"

// Types
import type {
  AthleteWithDetails,
  GroupWithCount,
  Subgroup,
  BulkOperationState
} from "../types"

export function LeanAthleteManagementPage() {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Data state
  const [athletes, setAthletes] = useState<AthleteWithDetails[]>([])
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [subgroups, setSubgroups] = useState<Subgroup[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | null>(null)

  // Bulk operations
  const [bulkOperation, setBulkOperation] = useState<BulkOperationState>({
    isOpen: false,
    type: null
  })

  // Track whether initial load is done to avoid skeleton flash on subsequent reloads
  const initialLoadDone = useRef(false)

  // Load data - only shows loading skeleton on initial load
  const loadData = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const [rosterResult, subgroupsResult] = await Promise.all([
        getRosterWithGroupCountsAction(),
        getSubgroupsAction()
      ])

      if (rosterResult.isSuccess && rosterResult.data) {
        setAthletes(rosterResult.data.athletes)
        setGroups(rosterResult.data.groups)
      } else {
        toast({
          title: "Error",
          description: rosterResult.message,
          variant: "destructive"
        })
      }

      if (subgroupsResult.isSuccess && subgroupsResult.data) {
        setSubgroups(subgroupsResult.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load athlete data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Optimistic update: athlete subgroups
  const handleAthleteSubgroupUpdate = useCallback((userId: number, newGroups: string[] | null) => {
    setAthletes(prev => prev.map(a =>
      a.user_id === userId ? { ...a, event_groups: newGroups } : a
    ))
  }, [])

  // Optimistic update: subgroup deleted
  const handleSubgroupDeleted = useCallback((sgId: number) => {
    setSubgroups(prev => prev.filter(sg => sg.id !== sgId))
  }, [])

  // Optimistic update: group renamed
  const handleGroupUpdated = useCallback((groupId: number, newName: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, group_name: newName } : g
    ))
  }, [])

  // Optimistic update: group deleted
  const handleGroupDeleted = useCallback((groupId: number) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  // Handle bulk operation success
  const handleBulkOperationSuccess = useCallback(() => {
    setSelectedAthletes([])
    loadData()
  }, [loadData])

  // Handle select all for mobile bulk action bar
  const handleSelectAll = useCallback(() => {
    const filteredAthletes = selectedGroupFilter !== null
      ? athletes.filter(a => a.athlete_group_id === selectedGroupFilter)
      : athletes

    if (selectedAthletes.length === filteredAthletes.length) {
      setSelectedAthletes([])
    } else {
      setSelectedAthletes(filteredAthletes.map(a => a.id))
    }
  }, [athletes, selectedAthletes, selectedGroupFilter])

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedAthletes([])
  }, [])

  // Content-area-only loading (route-level loading.tsx handles the full page skeleton)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Get filtered count for mobile bulk action bar
  const filteredAthleteCount = selectedGroupFilter !== null
    ? athletes.filter(a => a.athlete_group_id === selectedGroupFilter).length
    : athletes.length

  return (
    <div className={`space-y-6 ${isMobile && selectedAthletes.length > 0 ? 'pb-32' : ''}`}>
      {/* Inline Invite Form */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <InviteAthleteForm
          groups={groups}
          subgroups={subgroups}
          onSuccess={loadData}
        />
      </div>

      {/* Subgroups */}
      <SubgroupManager
        subgroups={subgroups}
        onSubgroupDeleted={handleSubgroupDeleted}
        onDataReload={loadData}
      />

      {/* Roster & Bulk Actions */}
      <AthleteRosterSection
        athletes={athletes}
        groups={groups}
        subgroups={subgroups}
        selectedAthletes={selectedAthletes}
        onSelectAthletes={setSelectedAthletes}
        onBulkOperation={setBulkOperation}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
        onAthleteSubgroupUpdate={handleAthleteSubgroupUpdate}
        onDataReload={loadData}
      />

      {/* Group Directory */}
      <GroupDirectorySection
        groups={groups}
        athletes={athletes}
        subgroups={subgroups}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
        onGroupUpdated={handleGroupUpdated}
        onGroupDeleted={handleGroupDeleted}
        onDataReload={loadData}
      />

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        bulkOperation={bulkOperation}
        onClose={() => setBulkOperation({ isOpen: false, type: null })}
        selectedAthletes={selectedAthletes}
        groups={groups}
        onSuccess={handleBulkOperationSuccess}
      />

      {/* Mobile: Bulk Action Bar */}
      {isMobile && (
        <MobileBulkActionBar
          selectedCount={selectedAthletes.length}
          totalCount={filteredAthleteCount}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkOperation={setBulkOperation}
        />
      )}
    </div>
  )
}
