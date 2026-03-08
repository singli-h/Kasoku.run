/**
 * Migration Script: Update Freelap metadata to new field naming convention
 *
 * Run with: npx tsx apps/web/scripts/migrate-freelap-metadata.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface OldFreeelapMetrics {
  // Various legacy field names
  time_seconds?: number
  time_s?: number  // Alternative name
  time?: number
  frequency_hz?: number
  frequency?: number  // Alternative name
  stride_length_m?: number
  stride_length?: number  // Alternative name
  steps?: number
  speed?: number
}

interface OldFreeelapMetadata extends OldFreeelapMetrics {
  note?: string
  freelap_frequency?: number  // Alternative name for frequency
  freelap_first_20m?: OldFreeelapMetrics
  freelap_second_20m?: OldFreeelapMetrics
  freelap_third_20m?: OldFreeelapMetrics
}

interface NewFreeelapSplit {
  distance: number
  time: number
  speed?: number
  frequency?: number
  stride_length?: number
  steps?: number
}

interface NewFreeelapMetadata {
  note?: string
  time?: number
  speed?: number
  frequency?: number
  stride_length?: number
  steps?: number
  splits?: NewFreeelapSplit[]
}

function convertMetrics(old: OldFreeelapMetrics): Partial<NewFreeelapSplit> {
  return {
    time: old.time_seconds ?? old.time_s ?? old.time,
    speed: old.speed,
    frequency: old.frequency_hz ?? old.frequency,
    stride_length: old.stride_length_m ?? old.stride_length,
    steps: old.steps,
  }
}

function migrateMetadata(old: OldFreeelapMetadata): NewFreeelapMetadata {
  const baseMetrics = convertMetrics(old)

  // Also check for freelap_frequency at top level
  const newMeta: NewFreeelapMetadata = {
    note: old.note,
    ...baseMetrics,
    frequency: baseMetrics.frequency ?? old.freelap_frequency,
  }

  // Convert legacy split format to splits array
  if (old.freelap_first_20m || old.freelap_second_20m) {
    const splits: NewFreeelapSplit[] = []

    if (old.freelap_first_20m) {
      splits.push({
        distance: 20,
        time: old.freelap_first_20m.time_seconds ?? 0,
        ...convertMetrics(old.freelap_first_20m),
      })
    }

    if (old.freelap_second_20m) {
      splits.push({
        distance: 20,
        time: old.freelap_second_20m.time_seconds ?? 0,
        ...convertMetrics(old.freelap_second_20m),
      })
    }

    if (splits.length > 0) {
      newMeta.splits = splits
    }
  }

  // Remove undefined values
  return JSON.parse(JSON.stringify(newMeta))
}

async function main() {
  console.log('🚀 Starting Freelap metadata migration...\n')

  // Fetch all sets with Freelap metadata
  const { data: sets, error: fetchError } = await supabase
    .from('workout_log_sets')
    .select('id, set_index, workout_log_id, metadata')
    .not('metadata', 'is', null)
    .or('metadata->steps.neq.null,metadata->freelap_first_20m.neq.null')

  if (fetchError) {
    console.error('❌ Error fetching sets:', fetchError)
    process.exit(1)
  }

  console.log(`📊 Found ${sets?.length ?? 0} sets with Freelap metadata\n`)

  if (!sets || sets.length === 0) {
    console.log('✅ No sets to migrate')
    return
  }

  let migratedCount = 0
  let errorCount = 0

  for (const set of sets) {
    const oldMeta = set.metadata as OldFreeelapMetadata

    // Check if already migrated (has new field names)
    if ('frequency' in oldMeta && !('frequency_hz' in oldMeta) && !('freelap_first_20m' in oldMeta)) {
      console.log(`⏭️  Set ${set.id} (workout ${set.workout_log_id}, set ${set.set_index}): Already migrated`)
      continue
    }

    const newMeta = migrateMetadata(oldMeta)

    console.log(`\n🔄 Migrating Set ${set.id} (workout ${set.workout_log_id}, set ${set.set_index}):`)
    console.log('   Old:', JSON.stringify(oldMeta))
    console.log('   New:', JSON.stringify(newMeta))

    const { error: updateError } = await supabase
      .from('workout_log_sets')
      .update({ metadata: newMeta })
      .eq('id', set.id)

    if (updateError) {
      console.error(`   ❌ Error updating set ${set.id}:`, updateError)
      errorCount++
    } else {
      console.log(`   ✅ Updated successfully`)
      migratedCount++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ Migration complete!`)
  console.log(`   Migrated: ${migratedCount}`)
  console.log(`   Errors: ${errorCount}`)
  console.log(`   Skipped: ${sets.length - migratedCount - errorCount}`)
}

main().catch(console.error)
