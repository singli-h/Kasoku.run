'use server'

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import supabase from '@/lib/supabase-server'
import type { ActionState } from '@/types'
import { extractPlanningContextText } from '@/lib/utils'

export interface MicrocycleGenerationContext {
  macroContext: string | null
  mesoContext: string | null
  recentInsights: string[]
  athleteSubgroups: string[]
  upcomingRaces: string[]
  scheduleNotes: string | null
  microcycleName: string | null
  groupName: string | null
  otherGroupSessions: string[] // e.g. ["GHS (3x/week): Mon Speed End, Wed Strength, Fri Race Prep"]
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
    const dbUserId = await getDbUserId(userId)

    // 1. Get microcycle + meso + macro chain in one query (scoped to owner)
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
      .eq('user_id', dbUserId)
      .single()

    if (microError || !micro) return { isSuccess: false, message: 'Microcycle not found or access denied' }

    const meso = Array.isArray(micro.mesocycles) ? micro.mesocycles[0] : micro.mesocycles
    const macro = Array.isArray(meso?.macrocycles) ? meso.macrocycles[0] : meso?.macrocycles

    // Queries 2-6 are independent — run in parallel
    const [
      { data: pastMicros },
      { data: athletes },
      { data: races },
      { data: group },
      { data: siblingMicros },
    ] = await Promise.all([
      // 2. Last 3 weekly_insights for this group
      supabase
        .from('microcycles')
        .select('weekly_insights, start_date, name')
        .eq('athlete_group_id', athleteGroupId)
        .not('weekly_insights', 'is', null)
        .lt('start_date', micro.start_date ?? new Date().toISOString())
        .order('start_date', { ascending: false })
        .limit(3),
      // 3. Distinct subgroups for athletes in this group
      supabase
        .from('athletes')
        .select('subgroups')
        .eq('athlete_group_id', athleteGroupId)
        .not('subgroups', 'is', null),
      // 4. Upcoming races within microcycle date range
      supabase
        .from('races')
        .select('name, date, type')
        .gte('date', micro.start_date ?? '')
        .lte('date', micro.end_date ?? '')
        .order('date'),
      // 5. Group name
      supabase
        .from('athlete_groups')
        .select('group_name')
        .eq('id', athleteGroupId)
        .single(),
      // 6. Sibling microcycles for cross-group coherence
      supabase
        .from('microcycles')
        .select('id, athlete_group_id, start_date, end_date, athlete_groups(group_name)')
        .eq('mesocycle_id', meso?.id)
        .neq('athlete_group_id', athleteGroupId),
    ])

    // Filter to overlapping date ranges in JS (Supabase can't do cross-column range filters easily)
    const overlapping = (siblingMicros ?? []).filter(sm => {
      if (!sm.start_date || !sm.end_date || !micro.start_date || !micro.end_date) return false
      return sm.start_date <= micro.end_date && sm.end_date >= micro.start_date
    })

    let otherGroupSessionsFormatted: string[] = []
    if (overlapping.length > 0) {
      const siblingIds = overlapping.map(sm => sm.id)
      const { data: sibSessions } = await supabase
        .from('session_plans')
        .select('name, day, microcycle_id')
        .in('microcycle_id', siblingIds)
        .order('day')

      // Group sessions by microcycle, format as readable strings
      for (const sm of overlapping) {
        const sessions = (sibSessions ?? []).filter(s => s.microcycle_id === sm.id)
        const groupObj = Array.isArray(sm.athlete_groups) ? sm.athlete_groups[0] : sm.athlete_groups
        const gName = groupObj?.group_name ?? `Group ${sm.athlete_group_id}`
        if (sessions.length > 0) {
          const sessionList = sessions.map(s => `Day${s.day ?? '?'} ${s.name ?? 'Session'}`).join(', ')
          otherGroupSessionsFormatted.push(`${gName} (${sessions.length}x/week): ${sessionList}`)
        }
      }
    }

    const macroContext = extractPlanningContextText(macro?.planning_context)
    const mesoContext = extractPlanningContextText(meso?.planning_context)
    // Schedule notes live in the freeform planning_context text -- AI reads them inline
    const scheduleNotes: string | null = null

    const recentInsights = (pastMicros ?? []).map(m => {
      const ins = m.weekly_insights as Record<string, unknown> | null
      return ins?.summary ? `Week ${m.name ?? m.start_date}: ${String(ins.summary)}` : ''
    }).filter(Boolean)

    const athleteSubgroups = [...new Set(
      (athletes ?? []).flatMap(a => a.subgroups ?? []).filter(Boolean)
    )]

    const upcomingRaces = (races ?? []).map(r => `${r.name} — ${r.date}`)

    return {
      isSuccess: true,
      message: 'Context loaded',
      data: {
        macroContext,
        mesoContext,
        recentInsights,
        athleteSubgroups,
        upcomingRaces,
        scheduleNotes,
        microcycleName: micro.name,
        groupName: group?.group_name ?? null,
        otherGroupSessions: otherGroupSessionsFormatted,
      },
    }
  } catch (e) {
    return { isSuccess: false, message: String(e) }
  }
}
