'use server'

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import supabase from '@/lib/supabase-server'
import type { ActionState } from '@/types'

export interface MicrocycleGenerationContext {
  macroContext: string | null
  mesoContext: string | null
  recentInsights: string[]
  athleteEventGroups: string[]
  upcomingRaces: string[]
  scheduleNotes: string | null
  microcycleName: string | null
  groupName: string | null
}

/**
 * Fetch the full AI context chain for generating a microcycle.
 * Call this before opening the Generate Week AI chat.
 */
export async function getMicrocycleGenerationContextAction(
  microcycleId: number,
  athleteGroupId: number
): Promise<ActionState<MicrocycleGenerationContext>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }
    await getDbUserId(userId)

    // 1. Get microcycle + meso + macro chain in one query
    const { data: micro, error: microError } = await supabase
      .from('microcycles')
      .select(`
        id, name, start_date, end_date,
        mesocycles!inner (
          id, metadata, planning_context,
          macrocycles!inner (
            id, planning_context
          )
        )
      `)
      .eq('id', microcycleId)
      .single()

    if (microError || !micro) return { isSuccess: false, message: 'Microcycle not found' }

    const meso = Array.isArray(micro.mesocycles) ? micro.mesocycles[0] : micro.mesocycles
    const macro = Array.isArray(meso?.macrocycles) ? meso.macrocycles[0] : meso?.macrocycles

    // 2. Last 3 weekly_insights for this group (completed microcycles before this one)
    const { data: pastMicros } = await supabase
      .from('microcycles')
      .select('weekly_insights, start_date, name')
      .eq('athlete_group_id', athleteGroupId)
      .not('weekly_insights', 'is', null)
      .lt('start_date', micro.start_date ?? new Date().toISOString())
      .order('start_date', { ascending: false })
      .limit(3)

    // 3. Distinct event_groups for athletes in this group
    const { data: athletes } = await supabase
      .from('athletes')
      .select('event_group')
      .eq('athlete_group_id', athleteGroupId)
      .not('event_group', 'is', null)

    // 4. Upcoming races within microcycle date range
    const { data: races } = await supabase
      .from('races')
      .select('name, date, type')
      .gte('date', micro.start_date ?? '')
      .lte('date', micro.end_date ?? '')
      .order('date')

    // 5. Group name
    const { data: group } = await supabase
      .from('athlete_groups')
      .select('group_name')
      .eq('id', athleteGroupId)
      .single()

    // Extract planning_context text from macrocycle (dedicated JSONB column)
    const macroCtx = macro?.planning_context
    const macroContext = macroCtx
      ? (typeof macroCtx === 'string' ? macroCtx : (macroCtx as Record<string, unknown>)?.text as string ?? JSON.stringify(macroCtx))
      : null

    // Extract planning_context from mesocycle's dedicated column (not metadata)
    const mesoCtx = meso?.planning_context as Record<string, unknown> | null
    const mesoContext = mesoCtx?.text ? String(mesoCtx.text) : null
    // Schedule notes live in the freeform planning_context text -- AI reads them inline
    const scheduleNotes: string | null = null

    const recentInsights = (pastMicros ?? []).map(m => {
      const ins = m.weekly_insights as Record<string, unknown> | null
      return ins?.summary ? `Week ${m.name ?? m.start_date}: ${String(ins.summary)}` : ''
    }).filter(Boolean)

    const athleteEventGroups = [...new Set(
      (athletes ?? []).map(a => a.event_group).filter(Boolean) as string[]
    )]

    const upcomingRaces = (races ?? []).map(r => `${r.name} — ${r.date}`)

    return {
      isSuccess: true,
      message: 'Context loaded',
      data: {
        macroContext,
        mesoContext,
        recentInsights,
        athleteEventGroups,
        upcomingRaces,
        scheduleNotes,
        microcycleName: micro.name,
        groupName: group?.group_name ?? null,
      },
    }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
