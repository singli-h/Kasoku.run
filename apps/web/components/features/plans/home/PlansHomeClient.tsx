"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Users, Target, Plus, Search, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import { MacrocycleTimeline, MacrocyclePhase, RaceAnchor } from "./MacrocycleTimeline"
import { VolumeIntensityChart, ChartDataPoint } from "./VolumeIntensityChart"
import { AssignmentView } from "../workspace/AssignmentView"
import { DeletePlanDialog } from "./DeletePlanDialog"

type TransformedMacrocycle = {
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

interface PlansHomeClientProps {
  initialMacrocycles: TransformedMacrocycle[]
}

export function PlansHomeClient({ initialMacrocycles }: PlansHomeClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  // Track selected phase per plan id to avoid leaking selection across cards
  const [selectedPhaseByPlanId, setSelectedPhaseByPlanId] = useState<Record<string, string | undefined>>({})
  // Track which plan is selected for assignment
  const [selectedPlanForAssignment, setSelectedPlanForAssignment] = useState<string | null>(null)
  // Track which plan is selected for deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState<{ id: string; name: string } | null>(null)

  const filteredMacrocycles = useMemo(() => {
    return initialMacrocycles.filter(mc => {
      const matchesSearch = mc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState = stateFilter === "all" || mc.state === stateFilter
      const matchesGroup = groupFilter === "all" || mc.group === groupFilter
      return matchesSearch && matchesState && matchesGroup
    })
  }, [initialMacrocycles, searchTerm, stateFilter, groupFilter])

  const renderMacrocycleRow = (mc: TransformedMacrocycle) => {
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
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate">{mc.start} - {mc.end}</span>
                </div>
                {mc.group && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">{mc.group}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 shrink-0" />
                  <span>{mc.phases.length} phases{mc.phases.length > 0 ? ` · ${Math.max(...mc.phases.map(p => p.endWeek))} weeks` : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={mc.state === "Active" ? "default" : mc.state === "Draft" ? "secondary" : "outline"}>
                {mc.state}
              </Badge>
              <Link href={`/plans/${mc.id}`} className="flex-1 sm:flex-none">
                <Button variant="default" size="sm" className="w-full sm:w-auto">
                  Open
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedPlanForAssignment(mc.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    Assign to Groups...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setSelectedPlanForDelete({ id: mc.id, name: mc.name })
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        </CardContent>
      </Card>
    )
  }

  // Get unique groups from actual data
  const availableGroups = Array.from(new Set(initialMacrocycles.map(mc => mc.group).filter((g): g is string => Boolean(g))))

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1" />
        <Button asChild>
          <Link href="/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Filters - Compact single row on mobile: 50% search, 25% state, 25% group */}
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-row sm:gap-4">
        <div className="relative col-span-2 sm:flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 text-sm"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="col-span-1 text-xs sm:text-sm sm:w-[180px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="col-span-1 text-xs sm:text-sm sm:w-[180px]">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {availableGroups.map(group => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
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
                {initialMacrocycles.length === 0
                  ? "Get started by creating your first training plan"
                  : "Try adjusting your search or filters"}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/plans/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          filteredMacrocycles.map(renderMacrocycleRow)
        )}
      </div>

      {/* Delete Plan Dialog */}
      {selectedPlanForDelete && (
        <DeletePlanDialog
          macrocycleId={Number(selectedPlanForDelete.id)}
          planName={selectedPlanForDelete.name}
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setSelectedPlanForDelete(null)
          }}
          onDeleted={() => router.refresh()}
        />
      )}

      {/* Assignment Dialog */}
      <Dialog open={selectedPlanForAssignment !== null} onOpenChange={(open) => !open && setSelectedPlanForAssignment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Training Plan</DialogTitle>
            <DialogDescription>
              Select athletes or groups to assign this training plan to.
            </DialogDescription>
          </DialogHeader>
          {selectedPlanForAssignment && (
            <AssignmentView 
              macrocycleId={Number(selectedPlanForAssignment)} 
              onAssignmentComplete={() => {
                setSelectedPlanForAssignment(null)
                // Optionally refresh the page or revalidate data
                router.refresh()
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
