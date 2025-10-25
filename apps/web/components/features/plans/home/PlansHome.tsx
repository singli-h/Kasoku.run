"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Target, Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { MacrocycleTimeline, MacrocyclePhase, RaceAnchor } from "./MacrocycleTimeline"
import { VolumeIntensityChart, ChartDataPoint } from "./VolumeIntensityChart"
import { getMacrocyclesAction } from "@/actions/plans/plan-actions"

type Macrocycle = {
  id: string
  name: string
  state: "Draft" | "Active" | "Archived"
  group?: string
  start: string
  end: string
  raceAnchors: RaceAnchor[]
  phases: MacrocyclePhase[]
  totalVolume: number
  avgIntensity: number
}

export function PlansHome() {
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track selected phase per plan id to avoid leaking selection across cards
  const [selectedPhaseByPlanId, setSelectedPhaseByPlanId] = useState<Record<string, string | undefined>>({})

  // Fetch macrocycles on component mount
  useEffect(() => {
    const fetchMacrocycles = async () => {
      try {
        setLoading(true)
        const result = await getMacrocyclesAction()
        
        if (result.isSuccess && result.data) {
          // Transform the data to match the expected format
          const transformedMacrocycles: Macrocycle[] = result.data.map((macro: any) => {
            // Calculate weeks from start date
            const startDate = new Date(macro.start_date)
            const endDate = new Date(macro.end_date)
            const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
            
            // Transform mesocycles with proper calculations
            const phases = macro.mesocycles?.map((meso: any, index: number) => {
              const mesoStartDate = new Date(meso.start_date)
              const mesoEndDate = new Date(meso.end_date)
              const startWeek = Math.ceil((mesoStartDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
              const endWeek = Math.ceil((mesoEndDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
              const mesoWeeks = endWeek - startWeek + 1
              
              // Use volume and intensity from microcycles
              const microcycles = meso.microcycles || []
              const volume = microcycles.map((micro: any) => micro.volume || 0)
              const intensity = microcycles.map((micro: any) => micro.intensity || 5)
              
              return {
                id: meso.id.toString(),
                name: meso.name,
                startWeek: Math.max(1, startWeek),
                endWeek: Math.min(totalWeeks, endWeek),
                volume: volume.length > 0 ? volume : [5, 6, 7, 5], // Default if no data
                intensity: intensity.length > 0 ? intensity : [5, 6, 7, 5], // Default if no data
                color: meso.metadata?.color || `hsl(${(index * 60) % 360}, 70%, 50%)`
              }
            }) || []
            
            // Calculate total volume and average intensity
            const allVolumes = phases.flatMap(p => p.volume)
            const allIntensities = phases.flatMap(p => p.intensity)
            const totalVolume = allVolumes.reduce((sum, vol) => sum + vol, 0)
            const avgIntensity = allIntensities.length > 0 ? allIntensities.reduce((sum, int) => sum + int, 0) / allIntensities.length : 5
            
            return {
              id: macro.id.toString(),
              name: macro.name,
              state: "Active" as const, // Default state - you can add a state field to your database
              group: macro.athlete_group?.group_name,
              start: macro.start_date,
              end: macro.end_date,
              raceAnchors: [], // TODO: Populate from races data
              phases,
              totalVolume,
              avgIntensity: Math.round(avgIntensity * 10) / 10
            }
          })
          
          setMacrocycles(transformedMacrocycles)
        } else {
          setError(result.message || "Failed to fetch macrocycles")
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error("Error fetching macrocycles:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMacrocycles()
  }, [])

  const filteredMacrocycles = useMemo(() => {
    return macrocycles.filter(mc => {
      const matchesSearch = mc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState = stateFilter === "all" || mc.state === stateFilter
      const matchesGroup = groupFilter === "all" || mc.group === groupFilter
      return matchesSearch && matchesState && matchesGroup
    })
  }, [macrocycles, searchTerm, stateFilter, groupFilter])

  const renderMacrocycleRow = (mc: Macrocycle) => {
    const selectedPhaseId = selectedPhaseByPlanId[mc.id]
    // Convert phases to chart data
    const chartData: ChartDataPoint[] = mc.phases.flatMap(phase => 
      phase.volume.map((volume, idx) => ({
        week: phase.startWeek + idx,
        weekLabel: `W${phase.startWeek + idx}`,
        volume,
        intensity: phase.intensity[idx],
        phaseId: phase.id,
        phaseName: phase.name
      }))
    )

    // Get selected phase data or full macrocycle data
    const displayData = selectedPhaseId 
      ? chartData.filter(d => d.phaseId === selectedPhaseId)
      : chartData

    return (
      <Card key={mc.id} className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-lg lg:text-xl">{mc.name}</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{mc.start} - {mc.end}</span>
                </div>
                {mc.group && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{mc.group}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 flex-shrink-0" />
                  <span>{mc.phases.length} phases · {Math.max(...mc.phases.map(p => p.endWeek))} weeks</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={mc.state === "Active" ? "default" : mc.state === "Draft" ? "secondary" : "outline"}>
                {mc.state}
              </Badge>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                Assign
              </Button>
              <Link href={`/plans/${mc.id}`} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Open
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Split Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            {/* Left Panel: Timeline */}
            <div className="space-y-4">
              <MacrocycleTimeline
                phases={mc.phases}
                raceAnchors={mc.raceAnchors}
                selectedPhaseId={selectedPhaseId}
                onPhaseClick={(phaseId) =>
                  setSelectedPhaseByPlanId(prev => ({ ...prev, [mc.id]: phaseId }))
                }
              />
            </div>

            {/* Right Panel: Chart */}
            <div className="space-y-4">
              <VolumeIntensityChart
                data={displayData}
                selectedPhaseId={selectedPhaseId}
                mode={selectedPhaseId ? 'mesocycle' : 'macrocycle'}
              />
            </div>
          </div>

          {/* Mobile: Stacked Layout */}
          <div className="lg:hidden mt-4">
            {/* Full-width chart on mobile */}
            <div className="-mx-4 px-0 sm:mx-0 sm:px-0">
            <VolumeIntensityChart
              data={displayData}
              selectedPhaseId={selectedPhaseId}
              mode={selectedPhaseId ? 'mesocycle' : 'macrocycle'}
            />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Training Plans</h1>
            <p className="text-muted-foreground">
              Manage your macrocycles with race-anchored timelines
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading training plans...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Training Plans</h1>
            <p className="text-muted-foreground">
              Manage your macrocycles with race-anchored timelines
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error Loading Plans</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get unique groups from actual data
  const availableGroups = Array.from(new Set(macrocycles.map(mc => mc.group).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training Plans</h1>
          <p className="text-muted-foreground">
            Manage your macrocycles with race-anchored timelines
          </p>
        </div>
        <Button asChild>
          <Link href="/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search macrocycles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {availableGroups.map(group => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Macrocycle Cards */}
      <div className="space-y-4">
        {filteredMacrocycles.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No macrocycles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or create a new plan
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </div>
          </Card>
        ) : (
          filteredMacrocycles.map(renderMacrocycleRow)
        )}
      </div>
    </div>
  )
}