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
import { Calendar, Users, UserMinus, Plus, Search, MoreVertical, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { MacrocycleTimeline, MacrocyclePhase, RaceAnchor } from "./MacrocycleTimeline"
import { VolumeIntensityChart, ChartDataPoint } from "./VolumeIntensityChart"
import { AssignmentView } from "../workspace/AssignmentView"
import { DeletePlanDialog } from "./DeletePlanDialog"
import { unassignPlanFromAthletesAction } from "@/actions/plans/plan-assignment-actions"

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
      return matchesSearch && matchesState
    })
  }, [initialMacrocycles, searchTerm, stateFilter])

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
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="text-lg lg:text-xl">{mc.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={mc.state === "Active" ? "default" : mc.state === "Draft" ? "secondary" : "outline"} className="shrink-0">
                  {mc.state}
                </Badge>
                <span className="text-muted-foreground/40">·</span>
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{mc.start} – {mc.end}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="default" className="px-4">
                <Link href={`/plans/${mc.id}`}>
                  Open
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedPlanForAssignment(mc.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    Assign to Groups...
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Unassign all athletes from "${mc.name}"? This will remove all sessions that haven't been started yet.`
                      )
                      if (!confirmed) return
                      try {
                        const result = await unassignPlanFromAthletesAction({ macrocycleId: Number(mc.id) })
                        if (result.isSuccess) {
                          router.refresh()
                        } else {
                          alert(result.message)
                        }
                      } catch {
                        alert('Failed to unassign plan. Please try again.')
                      }
                    }}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Unassign All...
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

      {/* Filters */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:gap-4">
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
