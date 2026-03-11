/**
 * Lean Athlete Management Page - MVP Implementation
 * Single-page workspace for coaches to invite and manage athletes
 * Responsive: Mobile-first with FAB + bottom sheets, desktop with inline forms
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"

// Server Actions
import { getRosterWithGroupCountsAction } from "@/actions/athletes/athlete-actions"

// Components
import { InviteAthleteForm } from "./invite-athlete-form"
import { AthleteRosterSection } from "./athlete-roster-section"
import { GroupDirectorySection } from "./group-directory-section"
import { BulkOperationsDialog } from "./bulk-operations-dialog"
import { MobileInviteFAB } from "./mobile-invite-fab"
import { MobileBulkActionBar } from "./mobile-bulk-action-bar"

// Types
import type {
  AthleteWithDetails,
  GroupWithCount,
  BulkOperationState
} from "../types"

export function LeanAthleteManagementPage() {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Data state
  const [athletes, setAthletes] = useState<AthleteWithDetails[]>([])
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | null>(null)

  // Bulk operations
  const [bulkOperation, setBulkOperation] = useState<BulkOperationState>({
    isOpen: false,
    type: null
  })

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getRosterWithGroupCountsAction()

      if (result.isSuccess && result.data) {
        setAthletes(result.data.athletes)
        setGroups(result.data.groups)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
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
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle bulk operation success
  const handleBulkOperationSuccess = useCallback(() => {
    setSelectedAthletes([])
    setBulkOperation({ isOpen: false, type: null })
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
      {/* Desktop: Coach-Only Badge and Invite Form */}
      {!isMobile && (
        <div className="flex flex-col md:flex-row md:items-start gap-4 p-6 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Coach Only
              </Badge>
            </div>
          </div>

          {/* Quick Invite Form */}
          <InviteAthleteForm
            groups={groups}
            onSuccess={loadData}
          />
        </div>
      )}

      {/* Section 1: Roster & Bulk Actions */}
      <AthleteRosterSection
        athletes={athletes}
        groups={groups}
        selectedAthletes={selectedAthletes}
        onSelectAthletes={setSelectedAthletes}
        onBulkOperation={setBulkOperation}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
        onDataReload={loadData}
      />

      {/* Desktop: Section 2: Group Directory */}
      {!isMobile && (
        <GroupDirectorySection
          groups={groups}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
          onDataReload={loadData}
        />
      )}

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        bulkOperation={bulkOperation}
        onClose={() => setBulkOperation({ isOpen: false, type: null })}
        selectedAthletes={selectedAthletes}
        groups={groups}
        onSuccess={handleBulkOperationSuccess}
      />

      {/* Mobile: Floating Action Button for Invite */}
      {isMobile && (
        <MobileInviteFAB
          groups={groups}
          onSuccess={loadData}
          isHidden={selectedAthletes.length > 0}
        />
      )}

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
