# Supabase MCP Guide: Creating Workout/Plan Data

This guide documents how to use the Supabase MCP tools to create and manage workout plan data in Kasoku.run.

## Table of Contents
1. [Overview](#overview)
2. [Available MCP Tools](#available-mcp-tools)
3. [Database Schema Overview](#database-schema-overview)
4. [Data Hierarchy](#data-hierarchy)
5. [Creating Data - Step by Step](#creating-data---step-by-step)
6. [Special Cases](#special-cases)
7. [Sprint Exercise Taxonomy](#sprint-exercise-taxonomy) ⭐ **Important**
8. [Common Queries](#common-queries)
9. [Best Practices](#best-practices)

---

## Overview

The Supabase MCP provides direct database access for creating and managing workout data. The system uses a **two-domain architecture**:

1. **Coach Planning Domain** (Prescriptions): What the coach assigns
2. **Athlete Recording Domain** (Performance): What the athlete actually does

### Projects

| Project | ID | Purpose |
|---------|-----|---------|
| Sprint (Prod) | `cebppzmljuixanysubyf` | Production database |
| Sprint (Dev) | `pcteaouusthwbgzczoae` | Development/testing |

---

## Available MCP Tools

### Read Operations
- `mcp__supabase__list_tables` - List all tables in schema
- `mcp__supabase__execute_sql` - Run SELECT queries
- `mcp__supabase__list_projects` - List available projects

### Write Operations
- `mcp__supabase__execute_sql` - Run INSERT/UPDATE/DELETE queries
- `mcp__supabase__apply_migration` - Apply DDL changes (schema modifications)

### Key Parameters
```
project_id: "pcteaouusthwbgzczoae" (dev) or "cebppzmljuixanysubyf" (prod)
query: SQL statement to execute
```

---

## Database Schema Overview

### Core Tables

#### Periodization Hierarchy
```
macrocycles (yearly plans)
    ├── mesocycles (training blocks, 2-6 weeks)
    │       └── microcycles (weekly plans)
    │               └── session_plans (daily workouts)
    │                       └── session_plan_exercises
    │                               └── session_plan_sets
    └── races (competition dates)
```

#### Performance Recording
```
workout_logs (actual sessions performed)
    └── workout_log_exercises
            └── workout_log_sets
```

### Key Reference Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, clerk_id, role (coach/athlete/individual) |
| `athletes` | Athlete profiles | id, user_id, athlete_group_id |
| `exercises` | Exercise library | id, name, visibility (global/private) |
| `units` | Measurement units | id, name (kg, m, seconds, etc.) |

### Available Units
| ID | Name | Description |
|----|------|-------------|
| 1 | kg | Kilograms |
| 2 | m | Meters |
| 5 | seconds | Time in seconds |
| 9 | RPE | Rate of Perceived Exertion (1-10) |
| 11 | m/s | Meters per second (velocity) |
| 12 | points | Points for combined events |

---

## Data Hierarchy

### Level 1: Macrocycle (Yearly Plan)
```sql
-- Required fields
INSERT INTO macrocycles (user_id, name, start_date, end_date)
VALUES (1, '2026 Competition Season', '2026-01-01', '2026-12-31');

-- Full example with all fields
INSERT INTO macrocycles (
    user_id,
    athlete_group_id,  -- NULL for individual, set for group
    name,
    description,       -- AI-generated summary
    notes,             -- User training context
    start_date,
    end_date
) VALUES (
    1,
    NULL,
    '2026 Sprint Season',
    'Periodized plan focusing on 100m and 200m development',
    'Focus on acceleration phase in early blocks',
    '2026-01-01',
    '2026-06-30'
);
```

### Level 2: Mesocycle (Training Block)
```sql
INSERT INTO mesocycles (
    macrocycle_id,     -- FK to parent (NULL for standalone blocks)
    user_id,
    name,
    description,
    notes,
    start_date,
    end_date,
    metadata           -- JSONB for additional config
) VALUES (
    1,
    1,
    'General Preparation Phase',
    'Building aerobic base and general strength',
    'Focus on volume over intensity',
    '2026-01-01',
    '2026-02-15',
    '{"focus": "strength", "equipment": ["barbell", "dumbbells"], "createdVia": "manual"}'::jsonb
);
```

#### Mesocycle Metadata Schema
```json
{
  "focus": "strength|endurance|general",
  "equipment": ["bodyweight", "dumbbells", "barbell", "kettlebells", "cables", "machines", "bench"],
  "createdVia": "quick-start|ai-generator|manual|template",
  "aiContext": {
    "model": "gpt-4",
    "generatedAt": "2026-01-01T00:00:00Z"
  }
}
```

### Level 3: Microcycle (Weekly Plan)
```sql
INSERT INTO microcycles (
    mesocycle_id,
    user_id,
    name,
    description,
    notes,
    start_date,
    end_date,
    intensity,         -- 1-10 scale
    volume             -- 1-10 scale
) VALUES (
    1,
    1,
    'Week 1',
    'Introduction week - moderate load',
    'Assess baseline fitness',
    '2026-01-01',
    '2026-01-07',
    5,
    6
);
```

### Level 4: Session Plan (Daily Workout)
```sql
-- Session plans use UUID for id (auto-generated)
INSERT INTO session_plans (
    microcycle_id,
    user_id,
    athlete_group_id,  -- NULL for individual
    name,
    description,
    date,
    day,               -- 1-7 (Monday-Sunday)
    week,              -- Week number in plan
    session_mode,      -- 'individual', 'group', or 'template'
    is_template,       -- true for reusable templates
    deleted            -- soft delete flag
) VALUES (
    1,
    1,
    NULL,
    'Upper Body Strength',
    'Push-pull superset workout',
    '2026-01-02',
    4,  -- Thursday
    1,
    'individual',
    false,
    false
);
```

### Level 5: Session Plan Exercises
```sql
-- Get the session_plan id first
INSERT INTO session_plan_exercises (
    session_plan_id,   -- UUID FK
    exercise_id,       -- FK to exercises table
    exercise_order,    -- Order in workout (1, 2, 3...)
    superset_id,       -- Group exercises with same ID for supersets
    notes
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- session_plan UUID
    11,  -- Bench Press (exercise_id)
    1,
    NULL,
    'Focus on controlled eccentric'
);
```

### Level 6: Session Plan Sets (Prescriptions)
```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,  -- UUID FK
    set_index,                 -- Set number (1, 2, 3...)
    reps,
    weight,
    resistance_unit_id,        -- FK to units (1 = kg)
    rest_time,                 -- Seconds between sets
    rpe,                       -- 1-10 scale
    tempo,                     -- "3-1-2-0" format (ecc-pause-con-pause)
    -- Advanced parameters
    velocity,                  -- Target velocity (m/s) for VBT
    power,                     -- Target power (watts)
    distance,                  -- Distance in meters
    performing_time,           -- Time in seconds
    height,                    -- Jump height in cm
    resistance,                -- Band/chain resistance (kg)
    effort,                    -- Effort percentage
    metadata                   -- JSONB for additional data
) VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',  -- session_plan_exercise UUID
    1,      -- Set 1
    8,      -- 8 reps
    60,     -- 60 kg
    1,      -- kg
    90,     -- 90 seconds rest
    7,      -- RPE 7
    '3-1-2-0',  -- 3s eccentric, 1s pause, 2s concentric, 0s top
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
);
```

---

## Special Cases

### Case 1: Creating Supersets

Supersets group exercises that are performed alternating without rest. Use the same `superset_id` value.

```sql
-- Exercise A1: Bench Press (superset_id = 1)
INSERT INTO session_plan_exercises (
    session_plan_id, exercise_id, exercise_order, superset_id, notes
) VALUES (
    'session-uuid-here', 11, 1, 1, 'A1 - Push'
);

-- Exercise A2: Bent Over Row (superset_id = 1, same as above)
INSERT INTO session_plan_exercises (
    session_plan_id, exercise_id, exercise_order, superset_id, notes
) VALUES (
    'session-uuid-here', 25, 2, 1, 'A2 - Pull'
);

-- Exercise B1: Overhead Press (superset_id = 2, new superset)
INSERT INTO session_plan_exercises (
    session_plan_id, exercise_id, exercise_order, superset_id, notes
) VALUES (
    'session-uuid-here', 12, 3, 2, 'B1 - Push'
);

-- Exercise B2: Pull-ups (superset_id = 2)
INSERT INTO session_plan_exercises (
    session_plan_id, exercise_id, exercise_order, superset_id, notes
) VALUES (
    'session-uuid-here', 13, 4, 2, 'B2 - Pull'
);
```

**Superset Display Logic:**
- Exercises with same `superset_id` are grouped together
- `superset_id = NULL` means standalone exercise
- Use naming convention: A1/A2, B1/B2, C1/C2 in notes

### Case 2: Tri-sets or Giant Sets

Same concept, just add more exercises with the same `superset_id`:

```sql
-- A1: Squat
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 9, 1, 1, 'A1');

-- A2: Romanian Deadlift
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 15, 2, 1, 'A2');

-- A3: Lunges
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 14, 3, 1, 'A3');
```

### Case 3: Velocity-Based Training (VBT)

Use `velocity` and `power` fields for VBT prescriptions:

```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    reps,
    weight,
    resistance_unit_id,
    velocity,          -- Target velocity in m/s
    power,             -- Target power in watts
    rest_time,
    notes
) VALUES (
    'exercise-uuid',
    1,
    5,
    100,  -- 100 kg
    1,
    0.8,  -- Target 0.8 m/s
    NULL,
    180,
    'Stop set if velocity drops below 0.7 m/s'
);
```

### Case 4: Tempo Training

Use the `tempo` field with format: `"eccentric-pause1-concentric-pause2"`

```sql
-- 4-second eccentric, 2-second pause at bottom, 1-second concentric, 0 pause at top
INSERT INTO session_plan_sets (
    session_plan_exercise_id, set_index, reps, weight, resistance_unit_id, tempo
) VALUES (
    'exercise-uuid', 1, 8, 40, 1, '4-2-1-0'
);
```

### Case 5: Timed Sets (AMRAP, EMOM)

Use `performing_time` for time-based prescriptions:

```sql
-- 60-second AMRAP set
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    reps,              -- NULL for AMRAP
    performing_time,   -- 60 seconds
    rest_time,
    metadata
) VALUES (
    'exercise-uuid',
    1,
    NULL,
    60,
    120,
    '{"type": "AMRAP"}'::jsonb
);
```

### Case 6: Distance-Based Sets (Running/Cardio)

```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    distance,          -- Distance in meters
    performing_time,   -- Target time in seconds (optional)
    rest_time,
    rpe
) VALUES (
    'exercise-uuid',
    1,
    400,    -- 400 meters
    75,     -- Target 75 seconds
    180,    -- 3 min rest
    8
);
```

### Case 7: Plyometric Training

Use `height` for jump measurements:

```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    reps,
    height,            -- Target jump height in cm
    rest_time
) VALUES (
    'exercise-uuid',
    1,
    5,
    60,     -- Target 60cm box jump
    120
);
```

### Case 8: Accommodating Resistance (Bands/Chains)

Use `resistance` field for additional band/chain load:

```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    reps,
    weight,            -- Bar weight
    resistance,        -- Band/chain resistance at top
    resistance_unit_id,
    rest_time
) VALUES (
    'exercise-uuid',
    1,
    5,
    80,     -- 80 kg bar weight
    20,     -- +20 kg band tension at top
    1,
    180
);
```

---

## Sprint Exercise Taxonomy

**IMPORTANT:** Do NOT create distance-specific sprint exercises (e.g., "60m Sprint", "Flying 10m"). Instead, use the 12 core sprint types below and store the distance in `session_plan_sets.distance`.

### Core Sprint Exercises (12 Types)

#### Acceleration (Start Types)
| ID | Exercise | Use Case | Distance Range |
|----|----------|----------|----------------|
| 115 | **Block Start Sprint** | From blocks, race simulation | 10-40m |
| 116 | **3-Point Start Sprint** | Hand on ground, common drill | 10-40m |
| 117 | **Standing Start Sprint** | Upright start, tempo/simpler CNS | 10-60m |

#### Max Velocity
| ID | Exercise | Use Case | Distance Range |
|----|----------|----------|----------------|
| 112 | **Flying Sprint** | Max velocity with build-up zone | 10-30m (fly zone) |
| 65 | **Curved Treadmill Sprint** | Indoor max velocity training | N/A (use velocity) |

#### Speed Endurance
| ID | Exercise | Use Case | Distance Range |
|----|----------|----------|----------------|
| 113 | **Speed Endurance Run** | Sub-maximal 60-150m | 60-150m |
| 114 | **Special Endurance Run** | Extended 150-400m | 150-400m |

#### Special Methods
| ID | Exercise | Use Case | Notes |
|----|----------|----------|-------|
| 64 | **Hill Sprint** | Incline acceleration, hamstring-friendly | 20-60m, 5-7% grade |
| 118 | **Resisted Sprint** | Sled, band, parachute | metadata: resistance_type, load_kg |
| 119 | **Overspeed Sprint** | Assisted/downhill supramaximal | metadata: assistance_type |

#### Technical & Testing
| ID | Exercise | Use Case | Notes |
|----|----------|----------|-------|
| 120 | **Wicket Run** | Technical drill with spacing markers | metadata: wicket_spacing, count |
| 121 | **Timing Test Run** | Diagnostic tests (30m FAT, splits) | metadata: splits, timing_method |

### Set-Level Parameters for Sprints

Store sprint details in `session_plan_sets`:

```sql
INSERT INTO session_plan_sets (
    session_plan_exercise_id,
    set_index,
    reps,
    distance,          -- Distance in meters (10, 20, 30, 60, etc.)
    performing_time,   -- Target time in seconds (optional)
    rest_time,         -- Recovery in seconds
    effort,            -- Intensity percentage (92, 95, etc.)
    metadata           -- JSONB for additional context
) VALUES (
    'exercise-uuid',
    1,
    1,                 -- 1 rep = 1 sprint
    30,                -- 30 meters
    NULL,              -- No target time
    300,               -- 5 min rest
    95,                -- 95% intensity
    '{"surface": "track", "intensity_pct": "92-95%"}'::jsonb
);
```

**Note:** Start type is determined by the exercise (Block/3-Point/Standing), not metadata.

### Metadata Schema for Sprints

```json
{
  // Common fields
  "surface": "track|grass|indoor|treadmill",
  "intensity_pct": "92-95%",      // Human-readable intensity range
  "cluster": 1,                   // For cluster sets (1, 2, etc.)
  "rest_type": "walk_back|standing|active",
  "timing_method": "freelap|hand|gates",

  // Flying Sprint specific
  "build_up_distance": 30,        // Build-up zone before timing (meters)
  "target_velocity": 9.5,         // m/s for treadmill/VBT

  // Resisted Sprint specific
  "resistance_type": "sled|band|parachute",
  "load_kg": 15,                  // Resistance load in kg
  "load_pct_bw": 10,              // Or as % of body weight

  // Overspeed Sprint specific
  "assistance_type": "downhill|bungee|tow|treadmill",
  "grade_pct": -3,                // Downhill grade (negative)

  // Wicket Run specific
  "wicket_spacing_m": 1.8,        // Spacing between wickets
  "wicket_count": 8,              // Number of wickets

  // Timing Test specific
  "splits": [1.82, 3.05, 4.03],   // Split times at 10m, 20m, 30m
  "reaction_time": 0.15           // If using starting signal
}
```

### Example: Max Velocity Session (Flying Sprints)

```sql
-- Use Flying Sprint (id=112) for all fly work
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 112, 1, NULL, 'Flying sprints @ 92-95%, full recovery');

-- Add sets with different distances
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, distance, rest_time, effort, metadata)
VALUES
    -- Fly-10 × 3
    ('exercise-uuid', 1, 1, 10, 270, 93, '{"build_up_distance": 30, "intensity_pct": "92-95%"}'::jsonb),
    ('exercise-uuid', 2, 1, 10, 300, 94, '{"build_up_distance": 30, "intensity_pct": "92-95%"}'::jsonb),
    ('exercise-uuid', 3, 1, 10, 300, 95, '{"build_up_distance": 30, "intensity_pct": "92-95%"}'::jsonb),
    -- Fly-20 × 2
    ('exercise-uuid', 4, 1, 20, 420, 93, '{"build_up_distance": 30, "intensity_pct": "92-94%"}'::jsonb),
    ('exercise-uuid', 5, 1, 20, 420, 94, '{"build_up_distance": 30, "intensity_pct": "92-94%"}'::jsonb);
```

### Example: Speed Endurance Session (Cluster Sets)

```sql
-- Use Speed Endurance Run (id=113) for 60-150m work
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 113, 1, NULL, '2 clusters of (60+60+60) @ 88-90%, walk back rest');

-- Add sets with cluster metadata
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, distance, rest_time, effort, metadata)
VALUES
    -- Cluster 1: 3 × 60m with walk-back rest
    ('exercise-uuid', 1, 1, 60, 90, 89, '{"cluster": 1, "rest_type": "walk_back"}'::jsonb),
    ('exercise-uuid', 2, 1, 60, 90, 89, '{"cluster": 1, "rest_type": "walk_back"}'::jsonb),
    ('exercise-uuid', 3, 1, 60, 540, 90, '{"cluster": 1, "rest_between_clusters_min": "8-10"}'::jsonb),
    -- Cluster 2: 3 × 60m with walk-back rest
    ('exercise-uuid', 4, 1, 60, 90, 89, '{"cluster": 2, "rest_type": "walk_back"}'::jsonb),
    ('exercise-uuid', 5, 1, 60, 90, 89, '{"cluster": 2, "rest_type": "walk_back"}'::jsonb),
    ('exercise-uuid', 6, 1, 60, 180, 90, '{"cluster": 2}'::jsonb);
```

### Example: Acceleration Session (Block Starts)

```sql
-- Use Block Start Sprint (id=115) for block work
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 115, 1, NULL, 'Block starts: 3×10m, 3×20m, 2×30m @ 95-100%');

-- Add progressive distance sets
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, distance, rest_time, effort, metadata)
VALUES
    -- 10m × 3
    ('exercise-uuid', 1, 1, 10, 180, 95, '{"surface": "track"}'::jsonb),
    ('exercise-uuid', 2, 1, 10, 180, 97, '{"surface": "track"}'::jsonb),
    ('exercise-uuid', 3, 1, 10, 240, 98, '{"surface": "track"}'::jsonb),
    -- 20m × 3
    ('exercise-uuid', 4, 1, 20, 240, 95, '{"surface": "track"}'::jsonb),
    ('exercise-uuid', 5, 1, 20, 240, 97, '{"surface": "track"}'::jsonb),
    ('exercise-uuid', 6, 1, 20, 300, 98, '{"surface": "track"}'::jsonb),
    -- 30m × 2
    ('exercise-uuid', 7, 1, 30, 300, 97, '{"surface": "track"}'::jsonb),
    ('exercise-uuid', 8, 1, 30, 300, 98, '{"surface": "track"}'::jsonb);
```

### Example: Resisted Sprint Session (Sled Work)

```sql
-- Use Resisted Sprint (id=118) for sled pulls
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 118, 1, NULL, 'Sled sprints: 4×20m @ 10% BW');

INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, distance, rest_time, effort, metadata)
VALUES
    ('exercise-uuid', 1, 1, 20, 180, 95, '{"resistance_type": "sled", "load_pct_bw": 10}'::jsonb),
    ('exercise-uuid', 2, 1, 20, 180, 95, '{"resistance_type": "sled", "load_pct_bw": 10}'::jsonb),
    ('exercise-uuid', 3, 1, 20, 180, 95, '{"resistance_type": "sled", "load_pct_bw": 10}'::jsonb),
    ('exercise-uuid', 4, 1, 20, 180, 95, '{"resistance_type": "sled", "load_pct_bw": 10}'::jsonb);
```

### Example: Timing Test Session

```sql
-- Use Timing Test Run (id=121) for diagnostics
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('session-uuid', 121, 1, NULL, '30m FAT test × 3, full recovery');

INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, distance, rest_time, effort, metadata)
VALUES
    ('exercise-uuid', 1, 1, 30, 360, 100, '{"timing_method": "freelap", "splits": [10, 20, 30]}'::jsonb),
    ('exercise-uuid', 2, 1, 30, 360, 100, '{"timing_method": "freelap", "splits": [10, 20, 30]}'::jsonb),
    ('exercise-uuid', 3, 1, 30, 360, 100, '{"timing_method": "freelap", "splits": [10, 20, 30]}'::jsonb);
```

### Sprint Taxonomy Rules

1. **Never create distance-specific exercises** - use core types with distance in sets
2. **Use specific start type exercises** - Block (115), 3-Point (116), Standing (117) - don't mix in metadata
3. **One exercise entry per sprint type per session** - use multiple sets for distance variations
4. **Store intensity in `effort` field** - as percentage (88, 92, 95, etc.)
5. **Use metadata for context** - surface, cluster info, resistance details
6. **Rest times in seconds** - convert minutes (5 min = 300s)

### Quick Reference: Which Exercise to Use?

| Training Goal | Exercise ID | Exercise Name |
|---------------|-------------|---------------|
| Race starts from blocks | 115 | Block Start Sprint |
| Acceleration drills | 116 | 3-Point Start Sprint |
| Tempo/easy starts | 117 | Standing Start Sprint |
| Max velocity work | 112 | Flying Sprint |
| Indoor max velocity | 65 | Curved Treadmill Sprint |
| 60-150m at 85-95% | 113 | Speed Endurance Run |
| 150-400m at 85-95% | 114 | Special Endurance Run |
| Uphill sprints | 64 | Hill Sprint |
| Sled/band work | 118 | Resisted Sprint |
| Downhill/assisted | 119 | Overspeed Sprint |
| Wicket drills | 120 | Wicket Run |
| Testing/time trials | 121 | Timing Test Run |

---

## Creating Complete Workout - Full Example

Here's a complete example creating a full session with supersets:

```sql
-- Step 1: Ensure user and microcycle exist
-- (Assuming user_id = 13, microcycle_id = 1)

-- Step 2: Create Session Plan
INSERT INTO session_plans (
    microcycle_id, user_id, name, description, date, day, week, session_mode, is_template, deleted
) VALUES (
    1, 13, 'Push Day', 'Chest and shoulders focus', '2026-01-20', 1, 1, 'individual', false, false
) RETURNING id;
-- Returns: e.g., 'abc123-def456-...'

-- Step 3: Add Exercises with Supersets
-- A1: Bench Press
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('abc123-def456-...', 11, 1, 1, 'A1 - Bench Press');
-- Returns exercise UUID: 'ex1-uuid'

-- A2: Dumbbell Row
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('abc123-def456-...', 25, 2, 1, 'A2 - DB Row');
-- Returns exercise UUID: 'ex2-uuid'

-- B: Overhead Press (standalone)
INSERT INTO session_plan_exercises (session_plan_id, exercise_id, exercise_order, superset_id, notes)
VALUES ('abc123-def456-...', 12, 3, NULL, 'B - OHP');
-- Returns exercise UUID: 'ex3-uuid'

-- Step 4: Add Sets for each exercise
-- Bench Press: 4 sets of 8 @ 70kg
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, weight, resistance_unit_id, rest_time, rpe)
VALUES
    ('ex1-uuid', 1, 8, 70, 1, 60, 7),
    ('ex1-uuid', 2, 8, 70, 1, 60, 7),
    ('ex1-uuid', 3, 8, 70, 1, 60, 8),
    ('ex1-uuid', 4, 8, 70, 1, 90, 8);

-- DB Row: 4 sets of 10 @ 25kg
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, weight, resistance_unit_id, rest_time, rpe)
VALUES
    ('ex2-uuid', 1, 10, 25, 1, 60, 7),
    ('ex2-uuid', 2, 10, 25, 1, 60, 7),
    ('ex2-uuid', 3, 10, 25, 1, 60, 8),
    ('ex2-uuid', 4, 10, 25, 1, 90, 8);

-- OHP: 3 sets of 6 @ 50kg with tempo
INSERT INTO session_plan_sets (session_plan_exercise_id, set_index, reps, weight, resistance_unit_id, rest_time, rpe, tempo)
VALUES
    ('ex3-uuid', 1, 6, 50, 1, 120, 8, '3-1-1-0'),
    ('ex3-uuid', 2, 6, 50, 1, 120, 8, '3-1-1-0'),
    ('ex3-uuid', 3, 6, 50, 1, 120, 9, '3-1-1-0');
```

---

## Recording Workout Performance

When an athlete performs a workout, create records in the workout_log tables:

```sql
-- Step 1: Create Workout Log
INSERT INTO workout_logs (
    session_plan_id,   -- Reference to the plan
    athlete_id,
    date_time,
    session_mode,
    session_status,    -- 'assigned', 'ongoing', 'completed', 'cancelled'
    notes
) VALUES (
    'session-plan-uuid',
    1,  -- athlete_id
    '2026-01-20T10:00:00Z',
    'individual',
    'completed',
    'Felt strong today'
) RETURNING id;
-- Returns: 'workout-log-uuid'

-- Step 2: Add Performed Exercises
INSERT INTO workout_log_exercises (
    workout_log_id,
    session_plan_exercise_id,  -- Link to prescription
    exercise_id,
    exercise_order,
    superset_id,
    notes
) VALUES (
    'workout-log-uuid',
    'session-plan-exercise-uuid',  -- The prescribed exercise
    11,  -- Bench Press
    1,
    1,
    'Warmed up well'
) RETURNING id;
-- Returns: 'workout-log-exercise-uuid'

-- Step 3: Record Actual Sets
INSERT INTO workout_log_sets (
    workout_log_id,
    workout_log_exercise_id,
    session_plan_exercise_id,  -- Reference to prescription
    set_index,
    completed,
    reps,
    weight,
    resistance_unit_id,
    rest_time,
    rpe,
    tempo,
    velocity,
    power
) VALUES (
    'workout-log-uuid',
    'workout-log-exercise-uuid',
    'session-plan-exercise-uuid',
    1,
    true,
    8,      -- Actual reps
    72.5,   -- Actual weight (slightly more than prescribed)
    1,
    65,     -- Actual rest
    7,      -- Actual RPE
    '3-1-2-0',
    NULL,
    NULL
);
```

---

## Common Queries

### Get User's Active Training Block
```sql
SELECT m.*,
       (SELECT COUNT(*) FROM microcycles WHERE mesocycle_id = m.id) as week_count
FROM mesocycles m
WHERE m.user_id = 13
  AND m.start_date <= CURRENT_DATE
  AND m.end_date >= CURRENT_DATE
ORDER BY m.start_date DESC
LIMIT 1;
```

### Get Full Session with Exercises and Sets
```sql
SELECT
    sp.id as session_id,
    sp.name as session_name,
    sp.date,
    spe.id as exercise_id,
    spe.exercise_order,
    spe.superset_id,
    e.name as exercise_name,
    sps.set_index,
    sps.reps,
    sps.weight,
    sps.rest_time,
    sps.rpe,
    sps.tempo
FROM session_plans sp
JOIN session_plan_exercises spe ON sp.id = spe.session_plan_id
JOIN exercises e ON spe.exercise_id = e.id
LEFT JOIN session_plan_sets sps ON spe.id = sps.session_plan_exercise_id
WHERE sp.id = 'session-uuid'
ORDER BY spe.exercise_order, sps.set_index;
```

### Get Sessions for a Week (Microcycle)
```sql
SELECT
    sp.id,
    sp.name,
    sp.date,
    sp.day,
    COUNT(DISTINCT spe.id) as exercise_count,
    COUNT(sps.id) as total_sets
FROM session_plans sp
LEFT JOIN session_plan_exercises spe ON sp.id = spe.session_plan_id
LEFT JOIN session_plan_sets sps ON spe.id = sps.session_plan_exercise_id
WHERE sp.microcycle_id = 1
  AND sp.deleted = false
GROUP BY sp.id, sp.name, sp.date, sp.day
ORDER BY sp.day;
```

### Compare Prescribed vs Actual Performance
```sql
SELECT
    e.name as exercise,
    sps.set_index,
    sps.reps as prescribed_reps,
    sps.weight as prescribed_weight,
    wls.reps as actual_reps,
    wls.weight as actual_weight,
    wls.completed,
    wls.rpe as actual_rpe
FROM session_plan_exercises spe
JOIN exercises e ON spe.exercise_id = e.id
JOIN session_plan_sets sps ON spe.id = sps.session_plan_exercise_id
LEFT JOIN workout_log_sets wls ON spe.id = wls.session_plan_exercise_id
    AND sps.set_index = wls.set_index
WHERE spe.session_plan_id = 'session-uuid'
ORDER BY spe.exercise_order, sps.set_index;
```

### Find Available Exercises
```sql
SELECT id, name, description, visibility
FROM exercises
WHERE (visibility = 'global' OR owner_user_id = 13)
  AND is_archived = false
ORDER BY name;
```

---

## Best Practices

### 1. Always Use Transactions for Multi-Step Inserts
When creating a full session with exercises and sets, use transactions:
```sql
BEGIN;
-- Insert session_plan
-- Insert session_plan_exercises
-- Insert session_plan_sets
COMMIT;
```

### 2. Validate Date Hierarchies
Ensure dates cascade properly:
- Microcycle dates must fall within mesocycle dates
- Session dates must fall within microcycle dates

### 3. Use UUIDs Correctly
- `session_plans.id`, `session_plan_exercises.id`, `session_plan_sets.id` are UUIDs
- They auto-generate via `gen_random_uuid()`
- Use `RETURNING id` to get the generated UUID

### 4. Soft Delete Pattern
Use `deleted = true` instead of hard deletes for session_plans:
```sql
UPDATE session_plans SET deleted = true WHERE id = 'uuid';
```

### 5. Session Status Flow
```
assigned → ongoing → completed
                  ↘ cancelled
```

### 6. Superset ID Convention
- Use sequential integers starting from 1
- NULL = standalone exercise
- Same number = exercises performed together

### 7. Required Foreign Keys
Before inserting, ensure these exist:
- `user_id` → `users.id`
- `athlete_id` → `athletes.id`
- `exercise_id` → `exercises.id`
- `microcycle_id` → `microcycles.id`
- `mesocycle_id` → `mesocycles.id`

---

## Quick Reference: Field Types

### Set Parameters by Training Type

| Training Type | Key Fields |
|---------------|------------|
| Strength | reps, weight, rest_time, rpe |
| Hypertrophy | reps, weight, tempo, rest_time |
| Power/VBT | reps, weight, velocity, power |
| Plyometrics | reps, height, rest_time |
| Cardio/Running | distance, performing_time, rest_time |
| Timed Sets | performing_time, rest_time |
| AMRAP | performing_time (reps = NULL) |

### Status Enums
- **session_status**: `'assigned'`, `'ongoing'`, `'completed'`, `'cancelled'`
- **role**: `'coach'`, `'athlete'`, `'individual'`
- **visibility**: `'global'`, `'private'`

---

## Troubleshooting

### Common Errors

**Foreign Key Violation**
```
ERROR: insert or update violates foreign key constraint
```
→ Ensure referenced record exists (user, athlete, exercise, etc.)

**UUID Format Error**
```
ERROR: invalid input syntax for type uuid
```
→ Use proper UUID format: `'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'`

**RLS Policy Denied**
```
ERROR: new row violates row-level security policy
```
→ Ensure user has permission to insert (check RLS policies)

### Checking Constraints
```sql
-- View table constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'session_plan_sets'::regclass;
```
