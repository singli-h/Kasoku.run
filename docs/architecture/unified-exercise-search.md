# Unified Exercise Search Architecture

> **Status**: Design Document
> **Author**: AI Assistant
> **Date**: 2026-01-20
> **Priority**: High - Production Ready

## Executive Summary

This document defines the architecture for a unified exercise search system that consolidates 4 existing implementations into a single, robust, scalable module. The design prioritizes:

- **Performance**: Optimized queries with proper indexing
- **Consistency**: Single source of truth for search logic
- **Extensibility**: Easy to add full-text search, caching, or new filters
- **Type Safety**: Strong TypeScript types throughout

---

## Current State (Problems)

### 4 Separate Implementations

| Location | Consumer | Equipment Filter | Text Search | Pagination |
|----------|----------|------------------|-------------|------------|
| `/api/exercises/search` | Init pipeline | ✅ Tag-based | ilike | ✅ |
| `searchExercisesAction` | UI Picker | ✅ Tag-based | ilike | ✅ |
| `executeSearchExercisesForPlan` | Plan Generator AI | ❌ Ignores | ilike | limit only |
| `searchExercises` (read-impl) | Session Assistant AI | ❌ None | ilike | limit only |

### Issues

1. **Inconsistent behavior**: Same query returns different results across consumers
2. **Duplicated logic**: Equipment tag lookup repeated in multiple places
3. **Missing features**: AI tools can't filter by equipment
4. **Maintenance burden**: Bug fixes need 4 updates
5. **No optimization path**: Hard to add caching or full-text search

---

## Target Architecture

```
apps/web/lib/exercises/
├── index.ts              # Public exports
├── search.ts             # Core search logic
├── types.ts              # Type definitions
├── filters.ts            # Filter building utilities
└── constants.ts          # Equipment aliases, limits
```

### Dependency Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                                │
├─────────────────────────────────────────────────────────────────┤
│  /api/exercises/search    searchExercisesAction                 │
│  (Init Pipeline)          (UI Picker)                           │
│                                                                  │
│  executeSearchExercisesForPlan    searchExercises               │
│  (Plan Generator AI)              (Session Assistant AI)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/exercises/search.ts                            │
│                                                                  │
│  searchExercises(options: ExerciseSearchOptions)                │
│    → ExerciseSearchResult                                       │
│                                                                  │
│  Features:                                                       │
│  • Equipment tag filtering (via exercise_tags)                  │
│  • Text search (ilike, upgradeable to FTS)                     │
│  • Exercise type filtering                                      │
│  • Visibility rules (global + user private)                     │
│  • Pagination with total count                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase / PostgreSQL                        │
│                                                                  │
│  Tables: exercises, exercise_tags, tags, exercise_types         │
│  Indexes: See "Database Optimization" section                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### `types.ts`

```typescript
/**
 * Input options for exercise search
 */
export interface ExerciseSearchOptions {
  // === Text Search ===
  /** Search query for name/description (ilike) */
  query?: string

  // === Filters ===
  /** Filter by exercise type ID */
  exerciseTypeId?: number

  /** Filter by equipment tag IDs (OR logic - matches any) */
  equipmentTagIds?: number[]

  /** Filter by equipment tag names (resolved to IDs internally) */
  equipmentTags?: string[]

  /** Exclude exercises with these equipment tag IDs */
  excludeEquipmentTagIds?: number[]

  // === Visibility ===
  /**
   * User ID for visibility rules.
   * - If provided: returns global + user's private exercises
   * - If omitted: returns only global exercises
   */
  userId?: string

  // === Pagination ===
  /** Max results to return (default: 20, max: 200) */
  limit?: number

  /** Offset for pagination (default: 0) */
  offset?: number

  // === Output Control ===
  /** Include total count for pagination (default: true) */
  includeCount?: boolean

  /** Fields to include in response (for performance) */
  fields?: ExerciseFieldSet
}

/**
 * Field sets for different use cases
 */
export type ExerciseFieldSet =
  | 'minimal'      // id, name only (for dropdowns)
  | 'picker'       // id, name, description, exercise_type
  | 'full'         // All fields including tags
  | 'ai'           // id, name, description, exercise_type, equipment tags

/**
 * Single exercise result
 */
export interface ExerciseSearchItem {
  id: number
  name: string
  description: string | null

  // Optional based on field set
  exerciseType?: {
    id: number
    type: string
    description: string | null
  }
  equipment?: string[]        // Tag names
  equipmentTagIds?: number[]  // Tag IDs
  videoUrl?: string
  visibility?: 'global' | 'private'
}

/**
 * Paginated search result
 */
export interface ExerciseSearchResult {
  exercises: ExerciseSearchItem[]

  // Pagination metadata
  total: number
  limit: number
  offset: number
  hasMore: boolean

  // Debug info (only in development)
  debug?: {
    queryTimeMs: number
    equipmentFilterApplied: boolean
    resolvedEquipmentTagIds?: number[]
  }
}

/**
 * Error result
 */
export interface ExerciseSearchError {
  code: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'TAG_RESOLUTION_FAILED'
  message: string
  details?: unknown
}
```

---

## Core Implementation

### `search.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ExerciseSearchOptions,
  ExerciseSearchResult,
  ExerciseSearchItem,
  ExerciseFieldSet
} from './types'
import { EQUIPMENT_TAG_ALIASES, MAX_LIMIT, DEFAULT_LIMIT } from './constants'

/**
 * Unified exercise search function.
 *
 * Used by all consumers:
 * - API routes (init pipeline)
 * - Server actions (UI picker)
 * - AI tool handlers (plan generator, session assistant)
 *
 * @example
 * // Basic search
 * const result = await searchExercises(supabase, { query: 'squat' })
 *
 * @example
 * // With equipment filter
 * const result = await searchExercises(supabase, {
 *   equipmentTagIds: [10, 11],  // barbell, dumbbell
 *   userId: 'user_123',
 *   limit: 50
 * })
 *
 * @example
 * // For AI tools (minimal fields, equipment context)
 * const result = await searchExercises(supabase, {
 *   query: 'chest press',
 *   fields: 'ai',
 *   limit: 10
 * })
 */
export async function searchExercises(
  supabase: SupabaseClient,
  options: ExerciseSearchOptions = {}
): Promise<ExerciseSearchResult> {
  const startTime = Date.now()

  // === Normalize Options ===
  const {
    query,
    exerciseTypeId,
    equipmentTagIds: inputTagIds,
    equipmentTags,
    excludeEquipmentTagIds,
    userId,
    limit = DEFAULT_LIMIT,
    offset = 0,
    includeCount = true,
    fields = 'picker'
  } = options

  const effectiveLimit = Math.min(limit, MAX_LIMIT)

  // === Resolve Equipment Tags ===
  let resolvedEquipmentTagIds: number[] | null = null

  if (inputTagIds?.length) {
    resolvedEquipmentTagIds = inputTagIds
  } else if (equipmentTags?.length) {
    resolvedEquipmentTagIds = await resolveEquipmentTagNames(supabase, equipmentTags)
  }

  // === Get Filtered Exercise IDs (if equipment filter active) ===
  let equipmentFilteredIds: number[] | null = null

  if (resolvedEquipmentTagIds?.length) {
    equipmentFilteredIds = await getExerciseIdsByEquipmentTags(
      supabase,
      resolvedEquipmentTagIds,
      excludeEquipmentTagIds
    )

    // No matches - return empty result early
    if (equipmentFilteredIds.length === 0) {
      return {
        exercises: [],
        total: 0,
        limit: effectiveLimit,
        offset,
        hasMore: false,
        debug: process.env.NODE_ENV === 'development' ? {
          queryTimeMs: Date.now() - startTime,
          equipmentFilterApplied: true,
          resolvedEquipmentTagIds: resolvedEquipmentTagIds ?? undefined
        } : undefined
      }
    }
  }

  // === Build Select Fields ===
  const selectFields = buildSelectFields(fields)

  // === Build Main Query ===
  let queryBuilder = supabase
    .from('exercises')
    .select(selectFields, { count: includeCount ? 'exact' : undefined })
    .eq('is_archived', false)

  // === Apply Visibility Filter ===
  if (userId) {
    queryBuilder = queryBuilder.or(
      `visibility.eq.global,and(visibility.eq.private,owner_user_id.eq.${userId})`
    )
  } else {
    queryBuilder = queryBuilder.eq('visibility', 'global')
  }

  // === Apply Equipment Filter (pre-computed IDs) ===
  if (equipmentFilteredIds) {
    queryBuilder = queryBuilder.in('id', equipmentFilteredIds)
  }

  // === Apply Text Search ===
  if (query?.trim()) {
    const safeQuery = sanitizeSearchQuery(query)
    if (safeQuery) {
      const searchTerm = `%${safeQuery}%`
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm}`
      )
    }
  }

  // === Apply Exercise Type Filter ===
  if (exerciseTypeId) {
    queryBuilder = queryBuilder.eq('exercise_type_id', exerciseTypeId)
  }

  // === Execute Query ===
  const { data, error, count } = await queryBuilder
    .order('name', { ascending: true })
    .range(offset, offset + effectiveLimit - 1)

  if (error) {
    console.error('[searchExercises] Database error:', error)
    throw new Error(`Exercise search failed: ${error.message}`)
  }

  // === Transform Results ===
  const exercises = transformExercises(data || [], fields)
  const total = count ?? exercises.length

  return {
    exercises,
    total,
    limit: effectiveLimit,
    offset,
    hasMore: offset + effectiveLimit < total,
    debug: process.env.NODE_ENV === 'development' ? {
      queryTimeMs: Date.now() - startTime,
      equipmentFilterApplied: !!resolvedEquipmentTagIds?.length,
      resolvedEquipmentTagIds: resolvedEquipmentTagIds ?? undefined
    } : undefined
  }
}

// === Helper Functions ===

/**
 * Resolve equipment tag names to IDs, with alias support
 */
async function resolveEquipmentTagNames(
  supabase: SupabaseClient,
  tagNames: string[]
): Promise<number[]> {
  // Expand aliases (e.g., "dumbbells" → ["dumbbell", "dumbbells"])
  const expandedNames = tagNames.flatMap(name => {
    const normalized = name.trim().toLowerCase()
    return EQUIPMENT_TAG_ALIASES[normalized] ?? [normalized]
  })

  const uniqueNames = [...new Set(expandedNames)]

  const { data, error } = await supabase
    .from('tags')
    .select('id')
    .eq('category', 'equipment')
    .in('name', uniqueNames)

  if (error) {
    console.error('[searchExercises] Tag resolution error:', error)
    throw new Error('Failed to resolve equipment tags')
  }

  return (data || []).map(t => t.id)
}

/**
 * Get exercise IDs that have specific equipment tags
 */
async function getExerciseIdsByEquipmentTags(
  supabase: SupabaseClient,
  includeTagIds: number[],
  excludeTagIds?: number[]
): Promise<number[]> {
  // Get exercises that have ANY of the included tags
  const { data: includeData, error: includeError } = await supabase
    .from('exercise_tags')
    .select('exercise_id')
    .in('tag_id', includeTagIds)

  if (includeError) {
    console.error('[searchExercises] Include tag lookup error:', includeError)
    throw new Error('Failed to filter by equipment tags')
  }

  let exerciseIds = new Set(
    (includeData || [])
      .map(row => row.exercise_id)
      .filter((id): id is number => id !== null)
  )

  // Exclude exercises that have ANY of the excluded tags
  if (excludeTagIds?.length && exerciseIds.size > 0) {
    const { data: excludeData, error: excludeError } = await supabase
      .from('exercise_tags')
      .select('exercise_id')
      .in('tag_id', excludeTagIds)
      .in('exercise_id', [...exerciseIds])

    if (excludeError) {
      console.error('[searchExercises] Exclude tag lookup error:', excludeError)
      // Non-fatal - continue without exclusion
    } else {
      const excludeIds = new Set(
        (excludeData || []).map(row => row.exercise_id)
      )
      exerciseIds = new Set([...exerciseIds].filter(id => !excludeIds.has(id)))
    }
  }

  return [...exerciseIds]
}

/**
 * Build SELECT fields based on field set
 */
function buildSelectFields(fields: ExerciseFieldSet): string {
  switch (fields) {
    case 'minimal':
      return 'id, name'

    case 'picker':
      return `
        id,
        name,
        description,
        video_url,
        exercise_type_id,
        visibility,
        exercise_type:exercise_types(id, type, description)
      `

    case 'ai':
      return `
        id,
        name,
        description,
        exercise_type:exercise_types(id, type),
        tags:exercise_tags(
          tag:tags(id, name, category)
        )
      `

    case 'full':
      return `
        id,
        name,
        description,
        video_url,
        exercise_type_id,
        unit_id,
        visibility,
        owner_user_id,
        exercise_type:exercise_types(id, type, description),
        unit:units(id, name),
        tags:exercise_tags(
          tag:tags(id, name, category)
        )
      `

    default:
      return 'id, name, description'
  }
}

/**
 * Sanitize search query to prevent PostgREST injection
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[(),]/g, ' ')  // Remove characters that break or(...) filters
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .trim()
}

/**
 * Transform raw database results to typed ExerciseSearchItem
 */
function transformExercises(
  data: any[],
  fields: ExerciseFieldSet
): ExerciseSearchItem[] {
  return data.map(row => {
    const item: ExerciseSearchItem = {
      id: row.id,
      name: row.name ?? 'Unknown Exercise',
      description: row.description ?? null
    }

    if (fields !== 'minimal') {
      if (row.exercise_type) {
        item.exerciseType = {
          id: row.exercise_type.id,
          type: row.exercise_type.type,
          description: row.exercise_type.description ?? null
        }
      }

      if (row.video_url) {
        item.videoUrl = row.video_url
      }

      if (row.visibility) {
        item.visibility = row.visibility
      }
    }

    // Extract equipment tags for 'ai' and 'full' field sets
    if ((fields === 'ai' || fields === 'full') && row.tags) {
      const equipmentTags = (row.tags || [])
        .map((t: any) => t.tag)
        .filter((tag: any) => tag?.category === 'equipment')

      item.equipment = equipmentTags.map((t: any) => t.name).filter(Boolean)
      item.equipmentTagIds = equipmentTags.map((t: any) => t.id).filter(Boolean)
    }

    return item
  })
}
```

### `constants.ts`

```typescript
/**
 * Equipment tag name aliases for fuzzy matching
 * Allows users to search "dumbbells" and match "dumbbell" tag
 */
export const EQUIPMENT_TAG_ALIASES: Record<string, string[]> = {
  bodyweight: ['bodyweight'],
  dumbbells: ['dumbbell', 'dumbbells'],
  dumbbell: ['dumbbell', 'dumbbells'],
  barbell: ['barbell', 'barbells'],
  barbells: ['barbell', 'barbells'],
  kettlebells: ['kettlebell', 'kettlebells'],
  kettlebell: ['kettlebell', 'kettlebells'],
  cables: ['cable', 'cables'],
  cable: ['cable', 'cables'],
  machines: ['machine', 'machines'],
  machine: ['machine', 'machines'],
  bench: ['bench'],
  'resistance band': ['resistance band'],
  'resistance bands': ['resistance band'],
  'pull-up bar': ['pull-up bar'],
  'pullup bar': ['pull-up bar'],
  'medicine ball': ['medicine ball'],
}

/**
 * Pagination limits
 */
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 200

/**
 * Cache TTLs (for future use with React Query or similar)
 */
export const CACHE_TTL = {
  EQUIPMENT_TAGS: 60 * 60 * 1000,    // 1 hour
  EXERCISE_TYPES: 60 * 60 * 1000,    // 1 hour
  SEARCH_RESULTS: 5 * 60 * 1000,     // 5 minutes
}
```

### `index.ts`

```typescript
// Core search function
export { searchExercises } from './search'

// Types
export type {
  ExerciseSearchOptions,
  ExerciseSearchResult,
  ExerciseSearchItem,
  ExerciseSearchError,
  ExerciseFieldSet,
} from './types'

// Constants
export {
  EQUIPMENT_TAG_ALIASES,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  CACHE_TTL,
} from './constants'
```

---

## Migration Plan

### Phase 1: Create Unified Module (Day 1)

1. Create `lib/exercises/` directory
2. Implement `types.ts`, `constants.ts`, `search.ts`, `index.ts`
3. Add unit tests for search function

### Phase 2: Migrate Consumers (Day 1-2)

#### 2.1 Update `searchExercisesAction` (Server Action)

```typescript
// Before
let query = supabase.from('exercises')...
// ... 70 lines of query building

// After
import { searchExercises } from '@/lib/exercises'

export async function searchExercisesAction(filters?: ExerciseFilters) {
  const result = await searchExercises(supabase, {
    query: filters?.search,
    exerciseTypeId: filters?.exercise_type_id,
    equipmentTagIds: filters?.equipment_tag_ids,
    userId: dbUserId,
    limit: filters?.limit,
    offset: filters?.offset,
    fields: 'picker'
  })

  return {
    isSuccess: true,
    data: {
      exercises: result.exercises,
      total: result.total,
      hasMore: result.hasMore
    }
  }
}
```

#### 2.2 Update `/api/exercises/search` (API Route)

```typescript
// Before
// ... 150 lines of custom query logic

// After
import { searchExercises } from '@/lib/exercises'

export async function POST(req: Request) {
  const { equipment_tags, equipment_tag_ids, limit } = await req.json()

  const result = await searchExercises(supabase, {
    equipmentTags: equipment_tags,
    equipmentTagIds: equipment_tag_ids,
    userId: dbUserId,
    limit,
    fields: 'ai'  // Include equipment info for AI
  })

  return Response.json({
    exercises: result.exercises.map(e => ({
      id: String(e.id),
      name: e.name,
      description: e.description,
      exercise_type: e.exerciseType?.type ?? null,
      equipment: e.equipment ?? [],
      contraindications: e.contraindications ?? []
    })),
    total: result.total,
    filteredByTags: result.debug?.equipmentFilterApplied ?? false
  })
}
```

#### 2.3 Update `executeSearchExercisesForPlan` (Plan Generator AI)

```typescript
// Before
// Equipment param is ignored!

// After
import { searchExercises } from '@/lib/exercises'

async function executeSearchExercisesForPlan(input, supabase, userId) {
  const result = await searchExercises(supabase, {
    query: input.query,
    equipmentTags: input.equipment,
    excludeEquipmentTagIds: await resolveExcludeEquipment(input.exclude_equipment),
    userId,
    limit: input.limit,
    fields: 'ai'
  })

  return result.exercises.map(e => ({
    id: String(e.id),
    name: e.name,
    description: e.description,
    exercise_type: e.exerciseType?.type ?? null,
    equipment: e.equipment ?? [],
    contraindications: e.contraindications ?? []
  }))
}
```

#### 2.4 Update `searchExercises` in read-impl.ts (Session Assistant AI)

```typescript
// Before
// No equipment filter at all

// After
import { searchExercises } from '@/lib/exercises'

async function searchExercisesImpl(input, supabase, userId) {
  const result = await searchExercises(supabase, {
    query: input.query,
    equipmentTags: input.equipment,  // Now supported!
    userId,
    limit: input.limit,
    fields: 'ai'
  })

  return result.exercises
}
```

### Phase 3: Remove Old Code (Day 2)

1. Delete inline query building from each consumer
2. Remove duplicate `EQUIPMENT_TAG_ALIASES` definitions
3. Update imports

### Phase 4: Add Tests (Day 2-3)

```typescript
describe('searchExercises', () => {
  it('returns all exercises when no filters', async () => {})
  it('filters by equipment tag IDs', async () => {})
  it('filters by equipment tag names with aliases', async () => {})
  it('excludes equipment tags', async () => {})
  it('applies visibility rules for authenticated user', async () => {})
  it('returns only global exercises for unauthenticated', async () => {})
  it('paginates correctly', async () => {})
  it('handles empty results gracefully', async () => {})
})
```

---

## Database Optimization

### Recommended Indexes

```sql
-- For equipment tag filtering (high priority)
CREATE INDEX IF NOT EXISTS idx_exercise_tags_tag_id
ON exercise_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_exercise_tags_exercise_id
ON exercise_tags(exercise_id);

-- For text search (medium priority)
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
ON exercises USING gin(name gin_trgm_ops);

-- For visibility filtering (medium priority)
CREATE INDEX IF NOT EXISTS idx_exercises_visibility_owner
ON exercises(visibility, owner_user_id)
WHERE is_archived = false;

-- For exercise type filtering (low priority - already indexed via FK)
-- exercise_type_id already has FK index
```

### Future: Full-Text Search

When ilike becomes a bottleneck:

```sql
-- Add tsvector column
ALTER TABLE exercises ADD COLUMN search_tsv tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Add GIN index
CREATE INDEX idx_exercises_search_tsv ON exercises USING gin(search_tsv);
```

Then update search function:

```typescript
// In searchExercises, upgrade text search path
if (query?.trim()) {
  const safeQuery = sanitizeSearchQuery(query)
  if (safeQuery) {
    // Use full-text search if available
    if (useFullTextSearch) {
      queryBuilder = queryBuilder.textSearch('search_tsv', safeQuery)
    } else {
      // Fallback to ilike
      const searchTerm = `%${safeQuery}%`
      queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},...`)
    }
  }
}
```

---

## Performance Considerations

### Query Execution Order

The two-phase approach (equipment IDs first, then main query) is intentional:

1. **Phase 1**: `SELECT exercise_id FROM exercise_tags WHERE tag_id IN (...)`
   - Fast: Uses index on `tag_id`
   - Returns ~10-50 IDs typically

2. **Phase 2**: `SELECT * FROM exercises WHERE id IN (...) AND ...`
   - Fast: Uses primary key index
   - Limited result set from Phase 1

### Alternative: Single Query with JOIN

```sql
SELECT DISTINCT e.*
FROM exercises e
JOIN exercise_tags et ON e.id = et.exercise_id
WHERE et.tag_id IN (10, 11, 12)
  AND e.visibility = 'global'
  AND e.is_archived = false
```

**Trade-offs**:
- Single query (fewer round trips)
- But: DISTINCT can be expensive for large datasets
- Current approach is clearer and equally fast at MVP scale

### Caching Strategy (Future)

```typescript
// At the React Query / hook level
const { data } = useQuery({
  queryKey: ['exercises', 'search', filters],
  queryFn: () => searchExercises(supabase, filters),
  staleTime: CACHE_TTL.SEARCH_RESULTS,
  gcTime: 30 * 60 * 1000,
})

// Equipment tags rarely change - cache aggressively
const { data: equipmentTags } = useQuery({
  queryKey: ['equipmentTags'],
  queryFn: getEquipmentTagsAction,
  staleTime: CACHE_TTL.EQUIPMENT_TAGS,
})
```

---

## Error Handling

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `UNAUTHORIZED` | No user ID for private exercises | Return only global |
| `INVALID_INPUT` | Malformed filter values | Return validation error |
| `DATABASE_ERROR` | Supabase query failed | Log + return 500 |
| `TAG_RESOLUTION_FAILED` | Equipment tag names not found | Continue without filter |

### Graceful Degradation

```typescript
// If equipment tag resolution fails, continue without filter
try {
  resolvedEquipmentTagIds = await resolveEquipmentTagNames(...)
} catch (err) {
  console.warn('[searchExercises] Tag resolution failed, continuing without filter')
  resolvedEquipmentTagIds = null
}
```

---

## Success Metrics

### Before (Baseline)
- 4 separate implementations
- Equipment filter works in 2/4 places
- ~150 lines duplicated across files

### After (Target)
- 1 unified implementation
- Equipment filter works in 4/4 places
- ~250 lines total (single source)
- Type-safe throughout
- Easy to add caching, FTS, new filters

---

## Equipment Tag Taxonomy

### Canonical Equipment Categories

The equipment taxonomy is based on `VALID_EQUIPMENT_CATEGORIES` from `types/training.ts` and `EQUIPMENT_CATEGORIES` from `EquipmentSelector.tsx`:

| Category ID | Label | Description | DB Tag | Examples |
|-------------|-------|-------------|--------|----------|
| `bodyweight` | Bodyweight | No equipment needed | `bodyweight` | Pull-up bar, Dip station, Resistance bands |
| `dumbbells` | Dumbbells | Free weight essentials | `dumbbell` | Fixed dumbbells, Adjustable dumbbells |
| `barbell` | Barbell | Olympic lifting | `barbell` | Olympic bar, Weight plates, Squat rack |
| `kettlebells` | Kettlebells | Dynamic training | `kettlebell` | Various weights |
| `cables` | Cables | Cable machines | `cable` | Cable machine, Functional trainer |
| `machines` | Machines | Gym machines | `machine` | Leg press, Chest press, Lat pulldown |
| `bench` | Bench | Weight bench | `bench` | Flat bench, Incline bench, Adjustable |

### Additional Tags (Not in Wizard)

These tags exist in the database but are not part of the wizard equipment selection:

| Tag | Usage | Recommendation |
|-----|-------|----------------|
| `pull-up bar` | 2 exercises | **Merge into `bodyweight`** - it's an accessory for bodyweight exercises |
| `medicine ball` | 0 exercises | **Keep** - distinct training tool, useful for athletic training |
| `resistance band` | 0 exercises | **Keep** - distinct training tool, widely used for rehab/warmup |

### Track & Field Specific Equipment

Additional equipment categories for track and field training:

| Tag | Description | Exercise Types |
|-----|-------------|----------------|
| `hurdles` | Standard track hurdles | Sprint, Drill, Plyometric |
| `cones` | Markers/cones for drills | Drill, Warmup, Sprint |
| `agility ladder` | Speed ladder for footwork | Drill, Warmup |
| `plyo box` | Plyometric boxes (various heights) | Plyometric, Gym |
| `sled` | Sprint sled/prowler for resistance | Sprint, Gym |
| `starting blocks` | Track starting blocks | Sprint |

These should be added to the database when needed:

```sql
INSERT INTO tags (name, category, description) VALUES
  ('hurdles', 'equipment', 'Standard track hurdles for sprint and drill training'),
  ('cones', 'equipment', 'Markers/cones for drills and agility work'),
  ('agility ladder', 'equipment', 'Speed ladder for footwork drills'),
  ('plyo box', 'equipment', 'Plyometric boxes for jump training'),
  ('sled', 'equipment', 'Sprint sled/prowler for resistance training'),
  ('starting blocks', 'equipment', 'Track starting blocks for sprint starts')
ON CONFLICT DO NOTHING;
```

### Tag Resolution Rules

1. **Singular/Plural Aliases**: The system accepts both forms
   - `dumbbell` ↔ `dumbbells`
   - `barbell` ↔ `barbells`
   - `cable` ↔ `cables`
   - `machine` ↔ `machines`
   - `kettlebell` ↔ `kettlebells`

2. **Bodyweight Accessories**: Exercises using pull-up bars or dip stations are tagged as `bodyweight`
   - The accessory does not change the primary resistance (body weight)

3. **Multi-Equipment Exercises**: An exercise can have multiple equipment tags
   - Example: "Dumbbell Bench Press" → `dumbbell` + `bench`

4. **Compound Equipment Categories**:
   - `bench` is often used WITH other equipment (dumbbells, barbells)
   - It's kept separate because some exercises are bench-only (e.g., step-ups)

### Preset Mappings

From `EQUIPMENT_PRESETS` in EquipmentSelector:

| Preset | Equipment Categories |
|--------|---------------------|
| Bodyweight Only | `bodyweight` |
| Home Gym | `bodyweight`, `dumbbells`, `bench`, `kettlebells` |
| Full Gym | All 7 categories |

### Database Cleanup (Migration)

```sql
-- Merge 'pull-up bar' exercises into 'bodyweight'
INSERT INTO exercise_tags (exercise_id, tag_id)
SELECT et.exercise_id, (SELECT id FROM tags WHERE name = 'bodyweight' AND category = 'equipment')
FROM exercise_tags et
JOIN tags t ON et.tag_id = t.id
WHERE t.name = 'pull-up bar' AND t.category = 'equipment'
ON CONFLICT DO NOTHING;

-- Optionally remove the pull-up bar tag
-- DELETE FROM tags WHERE name = 'pull-up bar' AND category = 'equipment';
```

---

## Appendix: File Changes Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `lib/exercises/types.ts` | Create | +80 |
| `lib/exercises/constants.ts` | Create | +30 |
| `lib/exercises/search.ts` | Create | +200 |
| `lib/exercises/index.ts` | Create | +20 |
| `actions/library/exercise-actions.ts` | Refactor | -70, +20 |
| `app/api/exercises/search/route.ts` | Refactor | -120, +30 |
| `lib/changeset/plan-generator/tool-handlers.ts` | Refactor | -60, +20 |
| `lib/ai-tools/session-assistant/read-impl.ts` | Refactor | -30, +15 |

**Net**: ~150 lines removed, ~400 lines added (but single source of truth)

---

## Questions for Review

1. **Field Sets**: Are the proposed field sets (`minimal`, `picker`, `ai`, `full`) sufficient?

2. **Exclude Equipment**: Should AI tools support excluding equipment (e.g., "no machines")?

3. **Ordering**: Currently alphabetical. Should we support relevance ordering for text search?

4. **Rate Limiting**: Should we add per-user rate limiting at this layer?
