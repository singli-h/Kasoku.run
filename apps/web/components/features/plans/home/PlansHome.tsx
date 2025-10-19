"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Target, Plus, Search } from "lucide-react"
import Link from "next/link"
import { MacrocycleTimeline, MacrocyclePhase, RaceAnchor } from "./MacrocycleTimeline"
import { VolumeIntensityChart, ChartDataPoint } from "./VolumeIntensityChart"

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

// TODO: Replace with actual data fetching from Supabase
const DEMO_MACROCYCLES: Macrocycle[] = []

export function PlansHome() {
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  // Track selected phase per plan id to avoid leaking selection across cards
  const [selectedPhaseByPlanId, setSelectedPhaseByPlanId] = useState<Record<string, string | undefined>>({})

  const filteredMacrocycles = useMemo(() => {
    return DEMO_MACROCYCLES.filter(mc => {
      const matchesSearch = mc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState = stateFilter === "all" || mc.state === stateFilter
      const matchesGroup = groupFilter === "all" || mc.group === groupFilter
      return matchesSearch && matchesState && matchesGroup
    })
  }, [searchTerm, stateFilter, groupFilter])

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

  return (
    <div className="space-y-6">
      {/* New Plan Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Plan
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
            <SelectItem value="Varsity Sprint Team">Varsity Sprint Team</SelectItem>
            <SelectItem value="Distance Squad">Distance Squad</SelectItem>
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