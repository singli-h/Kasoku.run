# Sessions Sprint Management

**Feature**: Coach interface for managing group sprint training sessions with PB-based pacing
**Status**: ✅ Phase 1 Complete (Data Foundation) | 🚧 Phase 2 Next (Coach UI)
**Last Updated**: October 27, 2025

---

## Overview

Sessions Sprint Management enables coaches to efficiently manage sprint training for groups of athletes using a dual-interface architecture:

- **Coach Interface** (`/sessions`): Group view for data entry and monitoring across all athletes
- **Athlete Interface** (`/workout`): Individual view for athletes to execute and track their own sessions

Both interfaces share the **same underlying data** (`exercise_training_sessions` table), ensuring real-time synchronization.

---

## Core Concepts

### 1. Single Source of Truth

```
exercise_training_sessions table
├─ Coach View: Filter by preset_group_id (all athletes in session)
└─ Athlete View: Filter by athlete_id (my sessions only)
```

**Not** two separate datasets - one dataset with two different views.

### 2. Personal Best (PB) System

**Table**: `athlete_personal_bests`

Tracks athlete performance records with:
- **Exact distance matching**: Only calculates targets for exact PB distance match
- **Auto-detection**: New PBs automatically detected on session completion
- **Flexible editing**: Both coaches and athletes can manage PBs

**Key Rule**: **NO distance scaling** - only show target if exact distance PB exists.

```typescript
// ✅ CORRECT
Session: 100m @ 95% effort
Athlete PB: 100m = 12.00s
Target: 12.63s (12.00s / 0.95)

// ❌ NO CALCULATION
Session: 300m @ 90% effort
Athlete PBs: 100m = 12.00s, 200m = 24.00s (no 300m)
Target: null (placeholder shows "Enter time")
```

**Why**: Sprint times don't scale linearly. Different distances use different energy systems. Scaling would be misleading.

### 3. Effort Percentage (Guideline, Not Absolute)

The `effort` field (0.70-1.00) is a **training guideline**, not physics:
- 95% effort ≠ 95% of maximum speed
- Athlete may run 96% actual intensity when prescribed 90%
- Used for **target calculation only** when exact PB exists

---

## Database Schema

### athlete_personal_bests

```sql
CREATE TABLE athlete_personal_bests (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL REFERENCES athletes(id),
  exercise_id INTEGER REFERENCES exercises(id),    -- Mutually exclusive with event_id
  event_id INTEGER REFERENCES events(id),          -- Mutually exclusive with exercise_id
  value DECIMAL(10,2) NOT NULL,                    -- Performance value (12.63 seconds, 7.45 meters, 6543 points)
  unit_id INTEGER NOT NULL REFERENCES units(id),   -- Required unit reference
  achieved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_id INTEGER REFERENCES exercise_training_sessions(id),
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  metadata JSONB,                                  -- {wind: "+1.2", location: "outdoor", conditions: "wet"}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (exercise_id IS NOT NULL AND event_id IS NULL) OR
    (exercise_id IS NULL AND event_id IS NOT NULL)
  )
);

-- Partial unique indexes to handle NULLs correctly
CREATE UNIQUE INDEX idx_unique_athlete_exercise_pb
  ON athlete_personal_bests(athlete_id, exercise_id)
  WHERE exercise_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_athlete_event_pb
  ON athlete_personal_bests(athlete_id, event_id)
  WHERE event_id IS NOT NULL;
```

**Design Rationale**:
- **Simplified**: Uses `unit_id` only (no redundant `metric_type`)
- **Normalized**: Distance implicit in exercise (e.g., "100m Sprint" = exercise_id 5)
- **Flexible**: Supports exercises (training) OR events (competitions)
- **Generic**: Handles sprints, jumps, throws, combined events via units table
- **Type-Safe**: `unit_id` required, partial indexes prevent duplicate PBs

**Examples**:
```sql
-- 100m Sprint PB: 12.63 seconds (unit_id 5 = seconds)
INSERT INTO athlete_personal_bests (athlete_id, exercise_id, value, unit_id, achieved_date)
VALUES (1, 5, 12.63, 5, '2025-10-20');  -- exercise_id 5 = "100m Sprint"

-- Long Jump PB: 6.75 meters (unit_id 2 = meters)
INSERT INTO athlete_personal_bests (athlete_id, exercise_id, value, unit_id, achieved_date)
VALUES (1, 10, 6.75, 2, '2025-10-20');  -- exercise_id 10 = "Long Jump"

-- High Jump PB: 1.85m with conditions
INSERT INTO athlete_personal_bests (athlete_id, exercise_id, value, unit_id, metadata, achieved_date)
VALUES (1, 12, 1.85, 2, '{"wind": "+0.8", "location": "indoor"}', '2025-10-20');  -- exercise_id 12 = "High Jump"
```

### exercise_preset_details (Existing)

Uses **existing `effort` field** (not adding `target_intensity`):

```sql
-- No changes needed
exercise_preset_details (
  ...
  effort REAL,  -- 0.70 - 1.00 (70% - 100% intensity guideline)
  ...
)
```

---

## Target Calculation Logic

### Function: `calculateSprintTarget()`

**Location**: `lib/sprint-pacing-utils.ts`

```typescript
/**
 * Calculate sprint target time based on PB and effort percentage
 *
 * RULE: Only calculates if EXACT distance PB exists
 * NO scaling/interpolation between distances
 *
 * @returns Target time in ms, or null if no exact PB match
 */
export function calculateSprintTarget(
  athletePBs: PersonalBest[],
  sessionDistance: number,
  effort: number
): {
  targetTimeMs: number | null
  pbTimeMs: number | null
  note: string
} {
  // Find exact distance match
  const exactPB = athletePBs.find(
    pb => pb.distance === sessionDistance && pb.metric_type === 'time'
  )

  if (!exactPB) {
    return {
      targetTimeMs: null,
      pbTimeMs: null,
      note: `No ${sessionDistance}m PB recorded`
    }
  }

  // Formula: Target = PB / Effort
  const targetTimeMs = Math.round(exactPB.value / effort)

  return {
    targetTimeMs,
    pbTimeMs: exactPB.value,
    note: `${(effort * 100).toFixed(0)}% effort`
  }
}
```

**Example**:
```typescript
// Athlete PBs: 100m = 12000ms, 200m = 24000ms
// Session: 100m @ 95% effort

calculateSprintTarget(pbs, 100, 0.95)
// Returns: { targetTimeMs: 12632, pbTimeMs: 12000, note: "95% effort" }

// Session: 300m @ 90% effort (no 300m PB)
calculateSprintTarget(pbs, 300, 0.90)
// Returns: { targetTimeMs: null, pbTimeMs: null, note: "No 300m PB recorded" }
```

---

## UI Design: Spreadsheet Style

### Layout (Coach `/sessions` Page)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Week 3, Day 2: 100m Sprint Session                                         │
│ Target: 95% Effort • 8 Sets • 3 Athletes                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Athlete      │ PB     │ Set 1  │ Set 2  │ Set 3  │ Set 4  │ Set 5  │ ...   │
├──────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ John Doe     │ 12.00s │ 12.8   │ 12.7   │ 12.6   │ 12.63  │ 12.65  │ ...   │
│              │        │        │        │        │   ↑ placeholder value   │
├──────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Jane Smith   │ 11.50s │ 11.6   │ 11.5   │ 11.4⭐ │ 12.11  │ 12.11  │ ...   │
│              │        │        │        │  ↑ New PB!                       │
├──────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Mike Chen    │ --     │ --     │ --     │ --     │ Enter  │ Enter  │ ...   │
│              │ No PB  │        │        │        │  ↑ No target calc        │
└─────────────────────────────────────────────────────────────────────────────���

ℹ️ Target times calculated as: PB / Effort % (only for exact distance match)
   95% effort on 12.00s PB = 12.63s target
```

### Input Field Behavior

**Empty Set (No Time Entered)**:
```html
<!-- Athlete with PB -->
<input
  placeholder="12.63"        ← Calculated target value only
  value=""                   ← Actually empty
  type="number"
  step="0.01"
/>

<!-- Athlete without PB -->
<input
  placeholder="Enter time"   ← No calculation
  value=""
/>
```

**Tooltip (Info Icon)**:
```
┌────────────────────────────────────────┐
│ 📊 Target Calculation                  │
├────────────────────────────────────────┤
│ PB: 12.00s (100m)                      │
│ Effort: 95%                            │
│ Formula: 12.00s ÷ 0.95 = 12.63s        │
│                                        │
│ This is a guideline - actual times may │
│ vary based on athlete condition.       │
└────────────────────────────────────────┘
```

### Visual Indicators

- ✅ **On target**: Green text (within 2% of target)
- ⚠️ **Close**: Amber text (within 5% of target)
- ❌ **Off target**: Red text (>5% from target)
- ⭐ **New PB**: Star icon + highlight

### Keyboard Navigation

- **Tab**: Next set (horizontal)
- **Enter**: Next athlete (vertical)
- **Shift+Tab**: Previous set
- **Esc**: Cancel edit
- **Auto-save**: On blur (2-second debounce)

---

## Data Flow

### Session Completion with Auto-PB Detection

```
1. Athlete completes workout on /workout page
   ↓
2. Clicks "Complete Session"
   ↓
3. completeTrainingSessionAction() runs:
   - Fetches all exercise_training_details for session
   - Filters for sprint exercises (has distance + performing_time)
   - For each completed set:
     ├─ Checks if new PB (better than current)
     ├─ Creates or updates athlete_personal_bests
     └─ Sets verified = false (needs review)
   ↓
4. Session marked as completed
   ↓
5. Coach opens /sessions
   - Sees all athlete times
   - Sees PB indicators (⭐ for new records)
   - Can edit/correct times if needed
   ↓
6. Edits sync back to exercise_training_details
   ↓
7. Athlete refreshes /workout
   - Sees coach's edits (same data)
```

### Bi-Directional Sync

**No special sync mechanism needed** - both views query the same table:

```typescript
// Coach query (/sessions)
const { data } = await supabase
  .from('exercise_training_sessions')
  .select(`
    *,
    athlete:athletes(name, user:users(first_name, last_name)),
    exercise_training_details(*)
  `)
  .eq('exercise_preset_group_id', presetGroupId)

// Athlete query (/workout)
const { data } = await supabase
  .from('exercise_training_sessions')
  .select(`
    *,
    exercise_training_details(*)
  `)
  .eq('athlete_id', athleteId)
```

Both read/write to `exercise_training_details` - changes are immediately visible to both.

---

## Server Actions

### Personal Best Management

**File**: `actions/athletes/personal-best-actions.ts`

1. **`getAthletePBsAction(athleteId)`** - Fetch all PBs for athlete
2. **`getSpecificPBAction(athleteId, exerciseId, distance)`** - Get exact PB
3. **`createPBAction(pbData)`** - Manual PB creation
4. **`updatePBAction(id, updates)`** - Update existing PB
5. **`deletePBAction(id)`** - Delete PB (coaches only via RLS)
6. **`autoDetectPBAction(...)`** - Auto-detect from session (internal)

### Session Management

**File**: `actions/sessions/training-session-actions.ts`

- **`completeTrainingSessionAction()`** - Enhanced with PB auto-detection
- Runs PB detection in parallel (non-blocking)
- Session completion doesn't fail if PB detection fails

---

## Security (RLS Policies)

### athlete_personal_bests

1. **SELECT**: Athletes see own PBs + coaches see their athletes' PBs
2. **INSERT**: Athletes can create own + coaches can create for athletes
3. **UPDATE**: Athletes can update own + coaches can update for athletes
4. **DELETE**: Coaches only (prevents accidental athlete deletions)

### exercise_training_sessions (Existing)

- Athletes can only view/edit their own sessions
- Coaches can view/edit sessions for their athlete groups

---

## Implementation Phases

### ✅ Phase 1: Data Foundation (COMPLETE)
- Database schema (`athlete_personal_bests` table)
- Server actions (6 PB actions)
- Sprint pacing utilities
- Auto-detection integration

### 🚧 Phase 2: Coach Interface (IN PROGRESS)
- Sessions page UI (spreadsheet layout)
- Group session data query
- Live data entry with auto-save
- PB indicator UI

### ⏳ Phase 3: Athlete Integration
- Ensure athlete /workout page shows coach edits
- Session completion flow
- PB notification system

### ⏳ Phase 4: Polish & Real-time
- Supabase real-time subscriptions
- Keyboard shortcuts
- Bulk data entry mode
- PB management page

---

## Key Design Decisions

### Why Exact Distance Match Only?

**Problem**: Different sprint distances use different energy systems:
- 60m-100m: ATP-PC system (pure power)
- 200m-400m: Lactic system (speed endurance)
- 400m+: Aerobic system (endurance)

**Scaling is misleading**:
```
❌ WRONG: 100m PB = 12s → 200m target = 24s (linear scaling)
   Reality: 200m may be 24.5s+ due to different energy demands

✅ CORRECT: Only show target if athlete has run that exact distance
```

### Why Use `effort` Field?

- **Already exists** in `exercise_preset_details`
- **Standardized** naming across database
- **Context-appropriate**: Represents subjective training intensity guideline

### Why Generic PB Table?

- **Future-proof**: Supports jumps, throws, combined events
- **Flexible**: Handles different metric types (time, distance, height, points)
- **Extensible**: Metadata field for conditions, wind, location

---

## Usage Examples

### Coach Creating Sprint Plan

1. Create macrocycle → mesocycle → microcycle
2. Add session: "100m Sprint Session"
3. Add exercise: "100m Sprint" with 8 sets
4. **Set `effort = 0.95`** (95% intensity guideline)
5. Assign to athlete group
6. System creates `exercise_training_sessions` for each athlete

### Coach Entering Sprint Times

1. Navigate to `/sessions`
2. Select session (e.g., "Week 3, Day 2: 100m Sprints")
3. See spreadsheet with athletes (rows) and sets (columns)
4. For each athlete:
   - If PB exists: Placeholder shows calculated target (e.g., "12.63")
   - If no PB: Placeholder shows "Enter time"
5. Click set → Type actual time → Auto-saves on blur
6. See PB indicators (⭐) for new records

### Athlete Viewing on /workout

1. Navigate to `/workout`
2. See assigned sessions (same data, card layout)
3. Click session → See sets with times coach entered
4. Complete remaining sets → Auto-save
5. Click "Complete Session" → PB auto-detection runs
6. See notification if new PB achieved

---

## Technical Stack

- **Frontend**: Next.js 15 (App Router), React Server Components
- **Backend**: Supabase PostgreSQL + Row Level Security
- **Auth**: Clerk (JWT-based authentication)
- **State**: React Context + Auto-save (2s debounce)
- **Real-time**: Supabase subscriptions (Phase 4)
- **Types**: TypeScript (strict mode)

---

## Files Reference

### Core Implementation
- `apps/web/supabase/migrations/20251026_create_athlete_personal_bests.sql`
- `apps/web/actions/athletes/personal-best-actions.ts`
- `apps/web/actions/sessions/training-session-actions.ts`
- `apps/web/lib/sprint-pacing-utils.ts`
- `apps/web/types/database.ts`

### Documentation
- This file: `docs/features/sessions/sessions-sprint-management.md`

---

**Last Updated**: October 26, 2025
**Status**: Phase 1 Complete | Phase 2 In Progress
