/**
 * Lean Athlete Management Page - MVP Implementation
 * Single-page workspace for coaches to invite and manage athletes with minimal UI
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// Server Actions
import { getRosterWithGroupCountsAction } from "@/actions/athletes/athlete-actions"

// Components
import { InviteAthleteForm } from "./invite-athlete-form"
import { AthleteRosterSection } from "./athlete-roster-section"
import { GroupDirectorySection } from "./group-directory-section"
import { BulkOperationsDialog } from "./bulk-operations-dialog"

// Types
import type { 
  AthleteWithDetails, 
  GroupWithCount, 
  BulkOperationState
} from "../types"

export function LeanAthleteManagementPage() {
  const { toast } = useToast()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading athletes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Coach-Only Badge and Invite Form */}
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

      {/* Section 1: Roster & Bulk Actions */}
      <AthleteRosterSection
        athletes={athletes}
        groups={groups}
        selectedAthletes={selectedAthletes}
        onSelectAthletes={setSelectedAthletes}
        onBulkOperation={setBulkOperation}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
      />

      {/* Section 2: Group Directory */}
      <GroupDirectorySection
        groups={groups}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
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
    </div>
  )
}
