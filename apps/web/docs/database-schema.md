# Database Schema Documentation

> **Last Updated**: 2025-12-24  
> **Verified Against**: Sprint (Dev) Project (`pcteaouusthwbgzczoae`)  
> **Schema Status**: Current as of 2025-12-24  
> **Schema Optimization**: Completed (specs/003-database-schema-optimization)

This document provides a comprehensive overview of the Kasoku database schema as implemented in Supabase.

## Overview

The Kasoku database is designed to support a comprehensive training management system for athletes and coaches. The schema is built around the core concepts of users, athletes, coaches, training plans, and exercise tracking, with advanced AI/ML capabilities for intelligent exercise recommendations and memory management.

## Database Project Information

- **Project ID**: `pcteaouusthwbgzczoae`
- **Project Name**: Sprint (Dev)
- **Region**: eu-west-2
- **Status**: ACTIVE_HEALTHY
- **PostgreSQL Version**: 15.8.1.102

## Core Tables

### Users & Authentication

#### `users`
Primary user table storing all user information and authentication data.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `username` | `text` | Unique username | NOT NULL, UNIQUE |
| `email` | `text` | User email address | NOT NULL, UNIQUE |
| `first_name` | `text` | User's first name | NULLABLE |
| `last_name` | `text` | User's last name | NULLABLE |
| `sex` | `character varying` | User's gender | NULLABLE |
| `subscription_status` | `character varying` | Subscription level | NOT NULL, DEFAULT 'free' |
| `timezone` | `text` | User's timezone | NOT NULL |
| `clerk_id` | `text` | Clerk authentication ID | NOT NULL, UNIQUE |
| `avatar_url` | `text` | Profile picture URL | NULLABLE |
| `role` | `text` | User role (athlete/coach/admin) | NOT NULL |
| `metadata` | `jsonb` | Additional user data | NULLABLE |
| `created_at` | `timestamptz` | Account creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |
| `deleted_at` | `timestamptz` | Soft delete timestamp | NULLABLE |
| `onboarding_completed` | `boolean` | Onboarding status | NULLABLE, DEFAULT false |
| `birthdate` | `date` | User's birth date | NULLABLE |

**RLS**: Enabled
**Indexes**: Primary key on `id`, unique on `username`, unique on `email`

#### `athletes`
Athlete-specific profile information linked to users.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `user_id` | `integer` | Foreign key to users | NOT NULL |
| `athlete_group_id` | `bigint` | Foreign key to athlete_groups | NULLABLE |
| `weight` | `real` | Athlete's weight | NULLABLE |
| `height` | `real` | Athlete's height | NULLABLE |
| `experience` | `text` | Training experience level | NULLABLE |
| `training_goals` | `text` | Athlete's training objectives | NULLABLE |
| `events` | `jsonb` | Event participation data | NULLABLE |

**RLS**: Enabled  
**Note**: Missing `created_at` and `updated_at` columns (to be added per schema optimization spec)
**Relationships**: 
- One-to-one with `users` via `user_id`
- Many-to-one with `athlete_groups` via `athlete_group_id`

#### `coaches`
Coach-specific profile information linked to users.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `user_id` | `integer` | Foreign key to users | NULLABLE, UNIQUE |
| `speciality` | `text` | Coaching speciality | NULLABLE |
| `sport_focus` | `text` | Primary sport focus | NULLABLE |
| `philosophy` | `text` | Coaching philosophy | NULLABLE |
| `experience` | `text` | Coaching experience | NULLABLE |

**RLS**: Enabled  
**Relationships**: One-to-one with `users` via `user_id`

### Training Organization

#### `athlete_groups`
Groups of athletes managed by coaches.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary key | Auto-increment, NOT NULL |
| `coach_id` | `integer` | Foreign key to coaches | NULLABLE |
| `group_name` | `text` | Name of the group | NULLABLE |
| `created_at` | `timestamptz` | Group creation time | NULLABLE, DEFAULT now() |

**RLS**: Enabled  
**Relationships**: Many-to-one with `coaches` via `coach_id`

#### `athlete_group_histories`
Historical tracking of athlete group memberships.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_id` | `integer` | Foreign key to athletes | NULLABLE |
| `group_id` | `integer` | Foreign key to athlete_groups | NULLABLE |
| `created_by` | `integer` | User who created the record | NULLABLE |
| `created_at` | `timestamptz` | Record creation time | NULLABLE, DEFAULT now() |
| `notes` | `text` | Additional notes | NULLABLE |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `athletes` via `athlete_id`
- Many-to-one with `athlete_groups` via `group_id`

### Training Cycles

#### `macrocycles`
Long-term training cycles (typically 3-12 months).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_group_id` | `integer` | Foreign key to athlete_groups | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `name` | `character varying` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Enabled  
**Relationships**: 
- Many-to-one with `athlete_groups` via `athlete_group_id`
- Many-to-one with `users` via `user_id` (ON DELETE CASCADE)

#### `mesocycles`
Medium-term training cycles (typically 3-6 weeks).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `macrocycle_id` | `integer` | Foreign key to macrocycles | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `name` | `character varying` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `metadata` | `jsonb` | Additional cycle data | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Enabled  
**Note**: Missing `updated_at` column (to be added per schema optimization spec)
**Relationships**: 
- Many-to-one with `macrocycles` via `macrocycle_id`
- Many-to-one with `users` via `user_id`

#### `microcycles`
Short-term training cycles (typically 1 week).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `mesocycle_id` | `integer` | Foreign key to mesocycles | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `name` | `character varying` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |
| `volume` | `integer` | Weekly training volume (1-10 scale) | NULLABLE, DEFAULT 0, CHECK (volume >= 1 AND volume <= 10) |
| `intensity` | `integer` | Weekly training intensity (1-10 RPE scale) | NULLABLE, DEFAULT 5, CHECK (intensity >= 1 AND intensity <= 10) |

**RLS**: Enabled  
**Note**: Missing `updated_at` column (to be added per schema optimization spec)  
**Relationships**: 
- Many-to-one with `mesocycles` via `mesocycle_id`
- Many-to-one with `users` via `user_id`

#### `athlete_cycles`
Links athletes to specific training cycles.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_id` | `integer` | Foreign key to athletes | NULLABLE |
| `macrocycle_id` | `integer` | Foreign key to macrocycles | NULLABLE |
| `mesocycle_id` | `integer` | Foreign key to mesocycles | NULLABLE |
| `created_at` | `timestamptz` | Link creation time | NULLABLE |

**RLS**: Enabled  
**Relationships**: 
- Many-to-one with `athletes` via `athlete_id` (ON DELETE CASCADE)
- Many-to-one with `macrocycles` via `macrocycle_id` (ON DELETE CASCADE)
- Many-to-one with `mesocycles` via `mesocycle_id`

### Exercise Management

#### `exercise_types`
Categories of exercises (e.g., strength, cardio, flexibility).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `type` | `character varying` | Exercise type name | NULLABLE |
| `description` | `text` | Type description | NULLABLE |

**RLS**: Enabled

#### `exercises`
Master list of exercises available in the system with AI/ML capabilities.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_type_id` | `integer` | Foreign key to exercise_types | NULLABLE |
| `unit_id` | `integer` | Foreign key to units | NULLABLE |
| `name` | `character varying` | Exercise name | NULLABLE |
| `description` | `character varying` | Exercise description | NULLABLE |
| `video_url` | `character varying` | Instructional video URL | NULLABLE |
| `embedding` | `vector` | AI embedding for similarity search | NULLABLE |
| `search_tsv` | `tsvector` | Full-text search vector | Generated column |
| `owner_user_id` | `integer` | Foreign key to users (creator) | NULLABLE |
| `visibility` | `exercise_visibility_type` | Visibility scope | NULLABLE, DEFAULT 'global' |
| `is_archived` | `boolean` | Archive status | NULLABLE, DEFAULT false |

**RLS**: Enabled  
**Security**: RLS policy updated to filter by `visibility` and `owner_user_id` ✅
**Relationships**: 
- Many-to-one with `exercise_types` via `exercise_type_id`
- Many-to-one with `units` via `unit_id`
- Many-to-one with `users` via `owner_user_id`

#### `units`
Measurement units for exercises (kg, lbs, reps, etc.).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `character varying` | Unit name | NULLABLE |
| `description` | `text` | Unit description | NULLABLE |

**RLS**: Enabled

#### `tags`
Categorization tags for exercises with structured categories.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `character varying` | Tag name | NULLABLE |
| `category` | `text` | Tag category | NULLABLE, CHECK constraint |

**RLS**: Enabled
**Valid Categories**: 'region', 'goal', 'modality', 'intensity', 'contraindication'

#### `exercise_tags`
Many-to-many relationship between exercises and tags.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary key | Auto-increment, NOT NULL |
| `exercise_id` | `integer` | Foreign key to exercises | NULLABLE |
| `tag_id` | `integer` | Foreign key to tags | NULLABLE |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `exercises` via `exercise_id`
- Many-to-one with `tags` via `tag_id`

### Training Sessions

#### `session_plans` (Coach Planning Domain)
Training session templates created by coaches. Previously named `exercise_preset_groups`.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_group_id` | `bigint` | Foreign key to athlete_groups | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `microcycle_id` | `integer` | Foreign key to microcycles | NULLABLE |
| `name` | `text` | Session name | NULLABLE |
| `description` | `text` | Session description | NULLABLE |
| `session_mode` | `text` | Session type (individual/group) | NULLABLE |
| `week` | `integer` | Week number | NULLABLE |
| `day` | `integer` | Day number | NULLABLE |
| `date` | `date` | Session date | NULLABLE |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `deleted` | `boolean` | Soft delete flag | NULLABLE, DEFAULT false |
| `is_template` | `boolean` | Template flag | NULLABLE, DEFAULT false |

**RLS**: Enabled
**Relationships**:
- Many-to-one with `athlete_groups` via `athlete_group_id`
- Many-to-one with `users` via `user_id`
- Many-to-one with `microcycles` via `microcycle_id`
- One-to-many with `session_plan_exercises` via `id`

#### `session_plan_exercises` (Coach Planning Domain)
Individual exercises within a session plan. Previously named `exercise_presets`.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `session_plan_id` | `integer` | Foreign key to session_plans | NULLABLE |
| `exercise_id` | `integer` | Foreign key to exercises | NULLABLE |
| `exercise_order` | `integer` | Order within session | NULLABLE |
| `superset_id` | `bigint` | Superset grouping | NULLABLE |
| `notes` | `text` | Exercise notes | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled
**Relationships**:
- Many-to-one with `session_plans` via `session_plan_id`
- Many-to-one with `exercises` via `exercise_id`
- One-to-many with `session_plan_sets` via `id`

#### `session_plan_sets` (Coach Planning Domain)
Set prescriptions for exercises in session plans. Previously named `exercise_preset_details`.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `session_plan_exercise_id` | `integer` | Foreign key to session_plan_exercises | NULLABLE |
| `resistance_unit_id` | `integer` | Foreign key to units | NULLABLE |
| `reps` | `integer` | Number of repetitions | NULLABLE |
| `weight` | `real` | Weight amount | NULLABLE |
| `power` | `real` | Power output | NULLABLE |
| `velocity` | `real` | Movement velocity | NULLABLE |
| `effort` | `real` | Effort level | NULLABLE |
| `distance` | `real` | Distance covered | NULLABLE |
| `performing_time` | `real` | Time to perform | NULLABLE |
| `rest_time` | `integer` | Rest between sets | NULLABLE |
| `tempo` | `text` | Movement tempo | NULLABLE |
| `set_index` | `integer` | Set number | NULLABLE |
| `height` | `real` | Height measurement | NULLABLE |
| `resistance` | `real` | Resistance amount | NULLABLE |
| `rpe` | `integer` | Rate of Perceived Exertion | NULLABLE |
| `metadata` | `jsonb` | Additional parameters | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled
**Schema Optimization**: Columns `height`, `effort`, `tempo`, `resistance` are kept as explicit columns for direct SQL analytics (e.g., `AVG(height)`, `WHERE resistance > X`). PostgreSQL NULL handling is efficient (1 bit per NULL in bitmap).
**Relationships**:
- Many-to-one with `session_plan_exercises` via `session_plan_exercise_id`
- Many-to-one with `units` via `resistance_unit_id`

#### `workout_logs` (Athlete Recording Domain)
Actual workout sessions performed by athletes. Previously named `exercise_training_sessions`.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_group_id` | `integer` | Foreign key to athlete_groups | NULLABLE |
| `athlete_id` | `integer` | Foreign key to athletes | NULLABLE |
| `session_plan_id` | `integer` | Foreign key to session_plans | NULLABLE |
| `date_time` | `timestamptz` | Session date and time | NULLABLE |
| `session_mode` | `text` | Session type | NULLABLE |
| `notes` | `text` | Session notes | NULLABLE |
| `description` | `text` | Session description | NULLABLE |
| `session_status` | `session_status` | Session status enum | NOT NULL |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled
**Valid Status Values**: 'assigned', 'ongoing', 'completed', 'cancelled'
**Relationships**:
- Many-to-one with `athlete_groups` via `athlete_group_id`
- Many-to-one with `athletes` via `athlete_id` (ON DELETE CASCADE)
- Many-to-one with `session_plans` via `session_plan_id`
- One-to-many with `workout_log_exercises` via `id`
- One-to-many with `workout_log_sets` via `id`

#### `workout_log_exercises` (Athlete Recording Domain)
Exercises performed in a workout session. Tracks which exercises are in the workout, including exercises added by athletes that weren't in the original plan.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `workout_log_id` | `integer` | Foreign key to workout_logs | NOT NULL, ON DELETE CASCADE |
| `exercise_id` | `integer` | Foreign key to exercises | NOT NULL, ON DELETE RESTRICT |
| `session_plan_exercise_id` | `integer` | Foreign key to session_plan_exercises | NULLABLE, ON DELETE SET NULL |
| `exercise_order` | `integer` | Order within workout | NOT NULL |
| `superset_id` | `bigint` | Superset grouping | NULLABLE |
| `notes` | `text` | Workout-specific exercise notes | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |

**RLS**: Enabled
**Unique Constraint**: `(workout_log_id, exercise_order)` - ensures unique ordering per workout
**Relationships**:
- Many-to-one with `workout_logs` via `workout_log_id` (ON DELETE CASCADE)
- Many-to-one with `exercises` via `exercise_id` (ON DELETE RESTRICT)
- Many-to-one with `session_plan_exercises` via `session_plan_exercise_id` (ON DELETE SET NULL)
- One-to-many with `workout_log_sets` via `id`

#### `workout_log_sets` (Athlete Recording Domain)
Actual set performance data for exercises in workout sessions. Previously named `exercise_training_details`.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `workout_log_id` | `integer` | Foreign key to workout_logs | NULLABLE, ON DELETE CASCADE |
| `workout_log_exercise_id` | `integer` | Foreign key to workout_log_exercises | NULLABLE, ON DELETE CASCADE |
| `session_plan_exercise_id` | `integer` | Foreign key to session_plan_exercises | NULLABLE, ON DELETE SET NULL |
| `resistance_unit_id` | `integer` | Foreign key to units | NULLABLE |
| `reps` | `integer` | Actual repetitions performed | NULLABLE |
| `weight` | `real` | Weight amount (kg) | NULLABLE |
| `distance` | `real` | Distance covered (meters) | NULLABLE |
| `completed` | `boolean` | Completion status | NULLABLE |
| `power` | `real` | Power output achieved (watts) - VBT metric | NULLABLE |
| `velocity` | `real` | Velocity achieved (m/s) - VBT metric | NULLABLE |
| `effort` | `real` | Effort level | NULLABLE |
| `performing_time` | `real` | Time to perform (seconds) | NULLABLE |
| `rest_time` | `integer` | Rest between sets (seconds) | NULLABLE |
| `tempo` | `text` | Actual tempo | NULLABLE |
| `height` | `real` | Height measurement (cm) | NULLABLE |
| `resistance` | `real` | Resistance amount (kg) | NULLABLE |
| `rpe` | `integer` | Rate of Perceived Exertion (1-10) | NULLABLE |
| `metadata` | `jsonb` | Additional performance data | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `set_index` | `integer` | Set number | NULLABLE |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled
**Schema Optimization**: Columns `height`, `effort`, `tempo`, `resistance` are kept as explicit columns for direct SQL analytics (e.g., `AVG(height)`, `WHERE resistance > X`). PostgreSQL NULL handling is efficient (1 bit per NULL in bitmap).
**Relationships**:
- Many-to-one with `workout_logs` via `workout_log_id` (ON DELETE CASCADE)
- Many-to-one with `workout_log_exercises` via `workout_log_exercise_id` (ON DELETE CASCADE)
- Many-to-one with `session_plan_exercises` via `session_plan_exercise_id` (ON DELETE SET NULL - for backward compatibility)
- Many-to-one with `units` via `resistance_unit_id`

### Performance Tracking

#### `athlete_personal_bests`
Tracks personal best performance records for all exercise types (sprints, jumps, throws, combined events) and competition events.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_id` | `integer` | Foreign key to athletes | NOT NULL |
| `exercise_id` | `integer` | Foreign key to exercises (training PBs) | NULLABLE, Mutually exclusive with event_id |
| `event_id` | `integer` | Foreign key to events (competition PBs) | NULLABLE, Mutually exclusive with exercise_id |
| `value` | `numeric` | Performance value in unit_id | NOT NULL |
| `unit_id` | `integer` | Foreign key to units | NOT NULL |
| `metadata` | `jsonb` | Additional context (wind, location, weather, equipment, verified_by) | NULLABLE |
| `achieved_date` | `date` | Date PB was achieved | NOT NULL, DEFAULT CURRENT_DATE |
| `session_id` | `integer` | Foreign key to exercise_training_sessions | NULLABLE |
| `verified` | `boolean` | Whether PB verified by coach | NULLABLE, DEFAULT false |
| `notes` | `text` | Additional notes | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled  
**Relationships**: 
- Many-to-one with `athletes` via `athlete_id`
- Many-to-one with `exercises` via `exercise_id` (for training PBs)
- Many-to-one with `events` via `event_id` (for competition PBs)
- Many-to-one with `units` via `unit_id`
- Many-to-one with `exercise_training_sessions` via `session_id`

### Events & Races

#### `events`
Competition and event information.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `text` | Event name | NULLABLE |
| `category` | `text` | Event category | NULLABLE |
| `type` | `text` | Event type | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |
| `updated_at` | `timestamptz` | Last update time | NULLABLE |

**RLS**: Enabled

#### `races`
Tracks races and competitions associated with training macrocycles.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary key | Auto-increment, NOT NULL |
| `macrocycle_id` | `bigint` | Foreign key to macrocycles | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NOT NULL |
| `name` | `text` | Race name | NOT NULL |
| `date` | `date` | Race date | NOT NULL |
| `type` | `text` | Race type (primary/secondary) | NOT NULL, DEFAULT 'secondary' |
| `location` | `text` | Race location | NULLABLE |
| `notes` | `text` | Additional notes | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NULLABLE, DEFAULT now() |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `macrocycles` via `macrocycle_id`
- Many-to-one with `users` via `user_id`
**Valid Types**: 'primary', 'secondary'

### Knowledge Base System

#### `knowledge_base_categories`
Categories for organizing knowledge base articles by coaches.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `coach_id` | `integer` | Foreign key to coaches | NOT NULL |
| `name` | `text` | Category name | NOT NULL |
| `color` | `text` | Hex color code | NOT NULL |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |
| `article_count` | `integer` | Number of articles in category | NULLABLE, DEFAULT 0 |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `coaches` via `coach_id`
- One-to-many with `knowledge_base_articles` via `id`
**Constraints**: Unique combination of `coach_id` and `name`
**Auto-updates**: `article_count` automatically updated via triggers

#### `knowledge_base_articles`
Rich text articles stored in TipTap JSON format for the knowledge base.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `coach_id` | `integer` | Foreign key to coaches | NOT NULL |
| `title` | `text` | Article title | NOT NULL |
| `content` | `jsonb` | TipTap JSON content | NOT NULL |
| `category_id` | `integer` | Foreign key to knowledge_base_categories | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `coaches` via `coach_id`
- Many-to-one with `knowledge_base_categories` via `category_id`
**Content Format**: TipTap JSON structure for rich text editing
**AI Ready**: JSONB format enables AI context extraction and processing

### AI/ML Memory System

#### `ai_memories`
AI-powered memory system for storing contextual information about athletes, coaches, and groups.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `bigint` | Primary key | Auto-increment, NOT NULL |
| `coach_id` | `integer` | Foreign key to coaches table | NULLABLE, FK to coaches(id) |
| `athlete_id` | `integer` | Foreign key to athletes table | NULLABLE, FK to athletes(id) |
| `group_id` | `integer` | Foreign key to athlete_groups table | NULLABLE, FK to athlete_groups(id) |
| `memory_type` | `memory_type` | Type of memory | NOT NULL |
| `title` | `text` | Memory title | NULLABLE |
| `content` | `text` | Memory content | NOT NULL |
| `metadata` | `jsonb` | Additional metadata | NULLABLE |
| `embedding` | `vector` | AI embedding for similarity search | NULLABLE |
| `created_by` | `integer` | User who created the memory | NOT NULL |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |

**RLS**: Enabled  
**Note**: RLS enabled, no policies (service-role only access per CLAUDE.md)  
**Memory Types**: 'preference', 'philosophy', 'injury', 'profile', 'note', 'session_summary'  
**Constraints**: Exactly one of coach_id, athlete_id, or group_id must be populated  
**Cascade Deletes**: Memories are automatically deleted when their subject is deleted (CASCADE on delete)

## Database Functions

### `get_user_role_data(_clerk_id text)`
Returns user role information including athlete and coach IDs.

**Parameters:**
- `_clerk_id`: Clerk authentication ID

**Returns:**
- `user_id`: Database user ID
- `role`: User role (athlete/coach/admin)
- `athlete_id`: Athlete profile ID (if applicable)
- `athlete_group_id`: Athlete group ID (if applicable)
- `coach_id`: Coach profile ID (if applicable)

### `unuse()`
Utility function that returns the current JWT subject.

**Returns:**
- `text`: JWT subject from auth context

## Row Level Security (RLS)

### RLS Status Summary

**Last Verified**: 2025-12-24 (via Supabase MCP)  
**Total Tables**: 25  
**RLS Enabled**: 25 (100%)  
**RLS Disabled**: 0

All tables in the database have Row Level Security enabled. This provides comprehensive data isolation and access control across the entire schema.

### Complete RLS Status by Table

| Table Name | RLS Status | Notes |
|------------|-----------|-------|
| `users` | ✅ Enabled | User profile access control |
| `athletes` | ✅ Enabled | Athlete data isolation |
| `coaches` | ✅ Enabled | Coach data isolation |
| `athlete_groups` | ✅ Enabled | Group membership access |
| `athlete_group_histories` | ✅ Enabled | Historical tracking |
| `athlete_cycles` | ✅ Enabled | Cycle assignment access |
| `athlete_personal_bests` | ✅ Enabled | Performance data access |
| `macrocycles` | ✅ Enabled | Long-term cycle access |
| `mesocycles` | ✅ Enabled | Medium-term cycle access |
| `microcycles` | ✅ Enabled | Short-term cycle access |
| `exercise_types` | ✅ Enabled | Public read, authenticated write |
| `exercises` | ✅ Enabled | Exercise library access (RLS policy needs update - currently public read) |
| `units` | ✅ Enabled | Public read, authenticated write |
| `tags` | ✅ Enabled | Public read, authenticated write |
| `exercise_tags` | ✅ Enabled | Tag relationship access |
| `session_plans` | ✅ Enabled | Session plan access |
| `session_plan_exercises` | ✅ Enabled | Session exercise access |
| `session_plan_sets` | ✅ Enabled | Session set access |
| `workout_logs` | ✅ Enabled | Workout log access |
| `workout_log_exercises` | ✅ Enabled | Workout exercise access |
| `workout_log_sets` | ✅ Enabled | Workout set access |
| `events` | ✅ Enabled | Event data access |
| `races` | ✅ Enabled | Race data access |
| `knowledge_base_categories` | ✅ Enabled | Coach-specific categories |
| `knowledge_base_articles` | ✅ Enabled | Coach-specific articles |
| `ai_memories` | ✅ Enabled | AI memory system (policies need verification) |

### RLS Policy Patterns

**User-Scoped Tables**: Access based on `user_id` matching authenticated user
- `users`, `athletes`, `coaches`, `macrocycles`, `mesocycles`, `microcycles`, `races`

**Group-Scoped Tables**: Access based on `athlete_group_id` membership
- `athlete_groups`, `session_plans`, `workout_logs`

**Coach-Scoped Tables**: Access based on `coach_id` ownership
- `knowledge_base_categories`, `knowledge_base_articles`

**Public Read Tables**: Authenticated users can read, owners can write
- `exercises`, `exercise_types`, `units`, `tags`, `events`

**Relationship Tables**: Access based on related entity permissions
- `exercise_tags`, `session_plan_exercises`, `session_plan_sets`, `workout_log_exercises`, `workout_log_sets`

### Security Notes

- **All tables verified**: RLS status confirmed via Supabase MCP tools (December 2025)
- **Policy optimization**: 50+ RLS policies identified by Supabase advisors for potential optimization
- **Access patterns**: Policies follow coach-athlete relationship model with proper data isolation
- **AI Memory System**: `ai_memories` table has RLS enabled but policies need verification
- **Exercises Table**: Current RLS policy allows public read access - needs update to filter by `visibility` and `owner_user_id`
- **Macrocycles Table**: RLS policy needs update to include coach access via `athlete_group_id`

## Data Types

### Custom Types
- `Json`: Flexible JSON type for storing structured data
- `UserRole`: Enum for user roles (athlete, coach, admin)
- `SessionMode`: Enum for session types (individual, group)
- `SessionStatus`: Enum for session statuses (planned, in_progress, completed, cancelled)
- `ExperienceLevel`: Enum for experience levels (beginner, intermediate, advanced, elite)
- `Gender`: Enum for gender options (male, female, other)
- `SubscriptionStatus`: Enum for subscription levels (free, premium, pro, cancelled)

### AI/ML Enums
- `exercise_visibility_type`: Exercise visibility scope ('global', 'coach', 'group', 'user')
- `memory_type`: Memory content types ('preference', 'philosophy', 'injury', 'profile', 'note', 'session_summary')

## AI/ML Capabilities

### Vector Search
The database includes advanced vector search capabilities powered by pgvector:

- **Exercise Embeddings**: The `exercises.embedding` column stores vector embeddings for semantic search
- **Memory Embeddings**: The `memories.embedding` column enables contextual memory retrieval
- **Full-Text Search**: The `exercises.search_tsv` column provides PostgreSQL full-text search capabilities

### Vector Functions
The database includes comprehensive vector operations:
- Distance calculations (L2, cosine, inner product)
- Vector normalization and aggregation
- Similarity search and ranking
- Vector indexing with HNSW and IVFFlat algorithms

### Memory System
The AI memory system enables:
- Contextual information storage about athletes, coaches, and groups
- Semantic search across memories using vector embeddings
- Structured memory types for different use cases
- Metadata storage for rich context

## Indexes and Performance

### Primary Keys
All tables have auto-incrementing integer primary keys on the `id` column.

### Vector Indexes
- HNSW indexes on vector columns for fast similarity search
- IVFFlat indexes for approximate nearest neighbor search
- Full-text search indexes on `search_tsv` columns

### Foreign Key Constraints
All foreign key relationships are properly constrained with appropriate cascade behaviors.

### RLS Policies
Row Level Security policies are implemented to ensure data isolation and proper access control based on user roles and relationships.

## Schema Optimization Status

### Timestamp Columns (Completed)
All timestamp columns have been added and updated:
- ✅ **Added both**: `athletes`, `coaches`, `exercises`, `session_plan_exercises`
- ✅ **Added `updated_at`**: `athlete_groups`, `session_plan_sets`, `workout_log_sets`, `macrocycles`, `mesocycles`, `microcycles`
- ✅ **Added defaults**: All nullable `created_at`/`updated_at` columns now have `DEFAULT now()`
- ✅ **Fixed type**: `workout_logs.updated_at` converted from `timestamp` to `timestamptz`
- ✅ **Triggers**: Auto-update triggers added for all `updated_at` columns

### Schema Optimization
Per `specs/003-database-schema-optimization/spec.md`:

#### Table Renaming (Completed)
Table names have been updated to clearly distinguish between coach-created plans and athlete-recorded workouts:

| Domain | Old Name | New Name | Status |
|--------|----------|----------|--------|
| **Coach Planning** | `exercise_preset_groups` | `session_plans` | ✅ Complete |
| **Coach Planning** | `exercise_presets` | `session_plan_exercises` | ✅ Complete |
| **Coach Planning** | `exercise_preset_details` | `session_plan_sets` | ✅ Complete |
| **Athlete Recording** | `exercise_training_sessions` | `workout_logs` | ✅ Complete |
| **Athlete Recording** | `exercise_training_details` | `workout_log_sets` | ✅ Complete |

#### New Table: `workout_log_exercises`
Added to support athletes adding/replacing exercises in workouts. Mirrors `session_plan_exercises` structure for consistency.

#### Column Renaming (Completed)
- `preset_order` → `exercise_order` in `session_plan_exercises` ✅
- `exercise_preset_group_id` → `session_plan_id` ✅
- `exercise_preset_id` → `session_plan_exercise_id` ✅
- `exercise_training_session_id` → `workout_log_id` ✅

#### Column Decisions (Completed)
- **KEPT explicit columns**: `height`, `effort`, `tempo`, `resistance` remain as explicit columns for direct SQL analytics (e.g., `AVG(height)`, `WHERE resistance > X`). PostgreSQL efficiently handles NULL values via the null bitmap (1 bit per NULL column).
- **VARCHAR to TEXT**: All `character varying` columns converted to `text` ✅
- **Cascade deletes**: Foreign keys updated with `ON DELETE CASCADE` where appropriate ✅

### RLS Policy Updates (Completed)
- ✅ `exercises` table: Policy updated to filter by `visibility` and `owner_user_id`
- ✅ `macrocycles` table: Coach access added via `athlete_group_id`
- ✅ `ai_memories` table: Documented as service-role only (RLS enabled, no policies)
- ✅ `workout_log_exercises` table: RLS policies added for athletes and coaches

## Migration Notes

This schema represents the current state of the database as of the latest migration. When making changes:

1. Always test migrations on a development environment first
2. Ensure RLS policies are updated to match schema changes
3. Update TypeScript types in `apps/web/types/database.ts` to match schema changes
4. Update this documentation to reflect any modifications
5. Reference `specs/003-database-schema-optimization/spec.md` for optimization details

## Related Documentation

- [API Architecture](./development/api-architecture.md)
- [Supabase Integration](./integrations/supabase-integration.md)
- [Security Overview](./security/README.md)
