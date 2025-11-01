import { getMacrocyclesAction } from "@/actions/plans/plan-actions"
import { getRacesByMacrocycleAction } from "@/actions/plans/race-actions"
import { PlansHomeClient } from "./PlansHomeClient"
import { MacrocyclePhase } from "./MacrocycleTimeline"
import type { MacrocycleWithDetails } from "@/types/training"

type TransformedMacrocycle = {
  id: string
  name: string
  state: "Draft" | "Active" | "Archived"
  group?: string
  start: string
  end: string
  raceAnchors: any[]
  phases: MacrocyclePhase[]
  totalVolume: number
  avgIntensity: number
}

export async function PlansHome() {
  // Fetch data on the server
  const result = await getMacrocyclesAction()

  // Handle error case
  if (!result.isSuccess || !result.data) {
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
            <p className="text-sm text-muted-foreground mt-2">{result.message || "Failed to fetch macrocycles"}</p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch races for all macrocycles in parallel
  const racesPromises = result.data.map((macro: MacrocycleWithDetails) => 
    getRacesByMacrocycleAction(macro.id!)
  )
  const racesResults = await Promise.all(racesPromises)
  
  // Create a map of macrocycle ID to races
  const racesByMacrocycleId = new Map<number, Array<{ id: number; name: string | null; date: string | null; type: string | null }>>()
  racesResults.forEach((racesResult, index) => {
    if (racesResult.isSuccess && racesResult.data) {
      racesByMacrocycleId.set(result.data[index].id!, racesResult.data)
    }
  })

  // Transform the data to match the expected format
  const transformedMacrocycles: TransformedMacrocycle[] = result.data.map((macro: MacrocycleWithDetails) => {
    // Calculate weeks from start date
    const startDate = new Date(macro.start_date!)
    const endDate = new Date(macro.end_date!)
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

    // Transform mesocycles with proper calculations
    const phases = macro.mesocycles?.map((meso, index) => {
      const mesoStartDate = new Date(meso.start_date!)
      const mesoEndDate = new Date(meso.end_date!)
      const startWeek = Math.ceil((mesoStartDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
      const endWeek = Math.ceil((mesoEndDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

      // Use volume and intensity from microcycles
      const microcycles = meso.microcycles || []
      const volume = microcycles
        .map((micro) => micro.volume)
        .filter((v): v is number => v !== null && v !== undefined)
      const intensity = microcycles
        .map((micro) => micro.intensity)
        .filter((i): i is number => i !== null && i !== undefined)

      return {
        id: meso.id!.toString(),
        name: meso.name || `Phase ${index + 1}`,
        startWeek: Math.max(1, startWeek),
        endWeek: Math.min(totalWeeks, endWeek),
        volume: volume.length > 0 ? volume : [],
        intensity: intensity.length > 0 ? intensity : [],
        color: (meso.metadata as any)?.color || `hsl(${(index * 60) % 360}, 70%, 50%)`
      }
    }) || []

    // Calculate total volume and average intensity
    const allVolumes = phases.flatMap(p => p.volume)
    const allIntensities = phases.flatMap(p => p.intensity)
    const totalVolume = allVolumes.reduce((sum, vol) => sum + vol, 0)
    const avgIntensity = allIntensities.length > 0
      ? allIntensities.reduce((sum, int) => sum + int, 0) / allIntensities.length
      : 0

    // Populate race anchors from races data
    // Calculate exact position based on date ratio, not week approximation
    const races = racesByMacrocycleId.get(macro.id!) || []
    const raceAnchors = races.map(race => {
      if (!race.date) return null
      const raceDate = new Date(race.date)
      const totalDays = endDate.getTime() - startDate.getTime()
      const daysFromStart = raceDate.getTime() - startDate.getTime()
      
      // Calculate exact week position (0-based for percentage, then convert to week number)
      const exactPosition = daysFromStart / totalDays
      const week = Math.max(1, Math.min(totalWeeks, Math.ceil(exactPosition * totalWeeks)))
      
      return {
        id: race.id.toString(),
        name: race.name || 'Race',
        date: race.date,
        week, // Store week for backward compatibility, but position will use exact date ratio
        exactPosition, // Store exact position ratio (0-1)
        isPrimary: race.type === 'primary'
      }
    }).filter((anchor): anchor is { id: string; name: string; date: string; week: number; exactPosition: number; isPrimary: boolean } => anchor !== null)

    return {
      id: macro.id!.toString(),
      name: macro.name || "Untitled Plan",
      state: "Active" as const, // Default state - you can add a state field to your database
      group: macro.athlete_group?.group_name || undefined,
      start: macro.start_date!,
      end: macro.end_date!,
      raceAnchors,
      phases,
      totalVolume,
      avgIntensity: Math.round(avgIntensity * 10) / 10
    }
  })

  // Pass data to client component
  return <PlansHomeClient initialMacrocycles={transformedMacrocycles} />
}
