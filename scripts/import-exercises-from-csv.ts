/**
 * Exercise Import Script
 *
 * Imports exercises from exerciselist.csv into Supabase with intelligent merge:
 * - Updates existing exercises (matched by name)
 * - Inserts new exercises
 * - Links exercises to tags via exercise_tags junction table
 *
 * Usage: npx tsx scripts/import-exercises-from-csv.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  console.error('Run with: SUPABASE_SERVICE_ROLE_KEY=your-key npx tsx scripts/import-exercises-from-csv.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Exercise type mapping (CSV name → DB ID)
const EXERCISE_TYPE_MAP: Record<string, number> = {
  'Isometric': 1,
  'Plyometric': 2,
  'Gym': 3,
  'Warmup': 4,
  'Circuit': 5,
  'Sprint': 6,
  'Drill': 7,
  'Mobility': 8,
  'Recovery': 9,
}

// Tag category mapping (CSV column → DB category)
const TAG_CATEGORY_MAP: Record<string, string> = {
  'equipment_tags': 'equipment',
  'region_tag': 'region',
  'goal_tag': 'goal',
  'modality_tag': 'modality',
  'intensity_tag': 'intensity',
  'contraindication_tags': 'contraindication',
}

const REPLACEABLE_TAG_CATEGORIES = new Set(Object.values(TAG_CATEGORY_MAP))

interface CSVRow {
  temp_id: string
  exercise_type: string
  name: string
  description: string
  video_url: string
  visibility: string
  equipment_tags: string
  region_tag: string
  goal_tag: string
  modality_tag: string
  intensity_tag: string
  contraindication_tags: string
}

interface ImportStats {
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  tagLinks: number
}

// Parse CSV (simple parser for our format)
function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',')

  return lines.slice(1).map(line => {
    // Handle commas within fields (basic CSV parsing)
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((header, i) => {
      row[header.trim()] = values[i] || ''
    })

    return row as CSVRow
  })
}

// Get or create tag by name and category
async function getOrCreateTag(name: string, category: string, tagCache: Map<string, number>): Promise<number | null> {
  const cacheKey = `${category}:${name}`

  if (tagCache.has(cacheKey)) {
    return tagCache.get(cacheKey)!
  }

  // Try to find existing tag
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id')
    .eq('name', name)
    .eq('category', category)
    .single()

  if (existingTag) {
    tagCache.set(cacheKey, existingTag.id)
    return existingTag.id
  }

  // Create new tag
  const { data: newTag, error } = await supabase
    .from('tags')
    .insert({ name, category })
    .select('id')
    .single()

  if (error) {
    console.error(`Failed to create tag "${name}" (${category}):`, error.message)
    return null
  }

  tagCache.set(cacheKey, newTag.id)
  return newTag.id
}

// Parse pipe-delimited tags
function parseTags(value: string): string[] {
  if (!value || value.trim() === '') return []
  return value.split('|').map(t => t.trim()).filter(t => t.length > 0)
}

async function importExercises() {
  console.log('🚀 Starting exercise import...\n')

  const stats: ImportStats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    tagLinks: 0,
  }

  // Load CSV
  const csvPath = path.join(process.cwd(), 'exerciselist.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(csvContent)
  console.log(`📄 Loaded ${rows.length} exercises from CSV\n`)

  // Load existing exercises for matching
  const { data: existingExercises } = await supabase
    .from('exercises')
    .select('id, name, visibility')

  const existingMap = new Map<string, number[]>()
  existingExercises?.forEach(e => {
    if (e.visibility !== 'global') return
    const key = e.name.toLowerCase()
    const list = existingMap.get(key) ?? []
    list.push(e.id)
    existingMap.set(key, list)
  })
  console.log(`📊 Found ${existingMap.size} global exercise names in database\n`)

  // Tag cache for performance
  const tagCache = new Map<string, number>()

  // Pre-load existing tags
  const { data: existingTags } = await supabase
    .from('tags')
    .select('id, name, category')

  const replaceableTagIds = new Set<number>()
  existingTags?.forEach(t => {
    tagCache.set(`${t.category}:${t.name}`, t.id)
    if (REPLACEABLE_TAG_CATEGORIES.has(t.category)) {
      replaceableTagIds.add(t.id)
    }
  })
  console.log(`🏷️  Loaded ${tagCache.size} existing tags\n`)

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.name || row.name.trim() === '') {
      stats.skipped++
      continue
    }

    try {
      // Map exercise type to ID
      const exerciseTypeId = EXERCISE_TYPE_MAP[row.exercise_type]
      if (!exerciseTypeId) {
        stats.errors.push(`Unknown exercise type "${row.exercise_type}" for "${row.name}"`)
        continue
      }

      // Prepare exercise data
      const exerciseData = {
        name: row.name.trim(),
        description: row.description?.trim() || null,
        video_url: row.video_url?.trim() || null,
        visibility: row.visibility === 'global' ? 'global' : 'private',
        exercise_type_id: exerciseTypeId,
      }

      let exerciseId: number
      const nameKey = row.name.toLowerCase().trim()
      const existingIds = existingMap.get(nameKey)

      if (existingIds && existingIds.length > 1) {
        stats.errors.push(`Multiple global exercises named "${row.name}" - skipping update`)
        continue
      }

      if (existingIds && existingIds.length === 1) {
        // Update existing exercise
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', existingIds[0])

        if (error) {
          stats.errors.push(`Failed to update "${row.name}": ${error.message}`)
          continue
        }

        exerciseId = existingIds[0]
        stats.updated++
      } else {
        // Insert new exercise
        const { data: newExercise, error } = await supabase
          .from('exercises')
          .insert(exerciseData)
          .select('id')
          .single()

        if (error) {
          stats.errors.push(`Failed to insert "${row.name}": ${error.message}`)
          continue
        }

        exerciseId = newExercise.id
        stats.inserted++
      }

      // Clear existing tags for this exercise in replaceable categories only
      if (replaceableTagIds.size > 0) {
        await supabase
          .from('exercise_tags')
          .delete()
          .eq('exercise_id', exerciseId)
          .in('tag_id', Array.from(replaceableTagIds))
      }

      // Link tags
      const tagLinks: { exercise_id: number; tag_id: number }[] = []

      // Equipment tags (pipe-delimited)
      for (const tagName of parseTags(row.equipment_tags)) {
        const tagId = await getOrCreateTag(tagName, 'equipment', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      // Single value tags
      if (row.region_tag?.trim()) {
        const tagId = await getOrCreateTag(row.region_tag.trim(), 'region', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      if (row.goal_tag?.trim()) {
        const tagId = await getOrCreateTag(row.goal_tag.trim(), 'goal', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      if (row.modality_tag?.trim()) {
        const tagId = await getOrCreateTag(row.modality_tag.trim(), 'modality', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      if (row.intensity_tag?.trim()) {
        const tagId = await getOrCreateTag(row.intensity_tag.trim(), 'intensity', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      // Contraindication tags (pipe-delimited)
      for (const tagName of parseTags(row.contraindication_tags)) {
        const tagId = await getOrCreateTag(tagName, 'contraindication', tagCache)
        if (tagId) tagLinks.push({ exercise_id: exerciseId, tag_id: tagId })
      }

      // Bulk insert tag links
      if (tagLinks.length > 0) {
        const { error: linkError } = await supabase
          .from('exercise_tags')
          .insert(tagLinks)

        if (linkError) {
          stats.errors.push(`Failed to link tags for "${row.name}": ${linkError.message}`)
        } else {
          stats.tagLinks += tagLinks.length
        }
      }

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`⏳ Processed ${i + 1}/${rows.length} exercises...`)
      }

    } catch (error) {
      stats.errors.push(`Error processing "${row.name}": ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Inserted: ${stats.inserted}`)
  console.log(`🔄 Updated:  ${stats.updated}`)
  console.log(`⏭️  Skipped:  ${stats.skipped}`)
  console.log(`🏷️  Tag links: ${stats.tagLinks}`)
  console.log(`❌ Errors:   ${stats.errors.length}`)

  if (stats.errors.length > 0) {
    console.log('\n📋 Errors:')
    stats.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`))
    if (stats.errors.length > 20) {
      console.log(`  ... and ${stats.errors.length - 20} more errors`)
    }
  }

  console.log('\n✨ Import complete!')
}

// Run the import
importExercises().catch(console.error)
