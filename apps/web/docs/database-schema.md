# Database Schema Documentation

This document provides a comprehensive overview of the Kasoku database schema as implemented in Supabase.

## Overview

The Kasoku database is designed to support a comprehensive training management system for athletes and coaches. The schema is built around the core concepts of users, athletes, coaches, training plans, and exercise tracking.

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
| `username` | `varchar` | Unique username | NOT NULL |
| `email` | `varchar` | User email address | NOT NULL |
| `first_name` | `text` | User's first name | NULLABLE |
| `last_name` | `text` | User's last name | NULLABLE |
| `sex` | `varchar` | User's gender | NULLABLE |
| `subscription_status` | `varchar` | Subscription level | NOT NULL, DEFAULT 'free' |
| `timezone` | `text` | User's timezone | NOT NULL |
| `clerk_id` | `text` | Clerk authentication ID | NULLABLE |
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
| `user_id` | `integer` | Foreign key to users | NULLABLE, UNIQUE |
| `athlete_group_id` | `bigint` | Foreign key to athlete_groups | NULLABLE |
| `weight` | `real` | Athlete's weight | NULLABLE |
| `height` | `real` | Athlete's height | NULLABLE |
| `experience` | `text` | Training experience level | NULLABLE |
| `training_goals` | `text` | Athlete's training objectives | NULLABLE |
| `events` | `jsonb` | Event participation data | NULLABLE |

**RLS**: Enabled
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

**RLS**: Disabled
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
| `name` | `varchar` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `athlete_groups` via `athlete_group_id`
- Many-to-one with `users` via `user_id`

#### `mesocycles`
Medium-term training cycles (typically 3-6 weeks).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `macrocycle_id` | `integer` | Foreign key to macrocycles | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `name` | `varchar` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `metadata` | `jsonb` | Additional cycle data | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Disabled
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
| `name` | `varchar` | Cycle name | NULLABLE |
| `description` | `text` | Cycle description | NULLABLE |
| `start_date` | `date` | Cycle start date | NULLABLE |
| `end_date` | `date` | Cycle end date | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Disabled
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

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `athletes` via `athlete_id`
- Many-to-one with `macrocycles` via `macrocycle_id`
- Many-to-one with `mesocycles` via `mesocycle_id`

### Exercise Management

#### `exercise_types`
Categories of exercises (e.g., strength, cardio, flexibility).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `type` | `varchar` | Exercise type name | NULLABLE |
| `description` | `text` | Type description | NULLABLE |

**RLS**: Disabled

#### `exercises`
Master list of exercises available in the system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_type_id` | `integer` | Foreign key to exercise_types | NULLABLE |
| `unit_id` | `integer` | Foreign key to units | NULLABLE |
| `name` | `varchar` | Exercise name | NULLABLE |
| `description` | `varchar` | Exercise description | NULLABLE |
| `video_url` | `varchar` | Instructional video URL | NULLABLE |

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `exercise_types` via `exercise_type_id`
- Many-to-one with `units` via `unit_id`

#### `units`
Measurement units for exercises (kg, lbs, reps, etc.).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `varchar` | Unit name | NULLABLE |
| `description` | `text` | Unit description | NULLABLE |

**RLS**: Disabled

#### `tags`
Categorization tags for exercises.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `varchar` | Tag name | NULLABLE |

**RLS**: Disabled

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

#### `exercise_preset_groups`
Groups of exercise presets for training sessions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_group_id` | `bigint` | Foreign key to athlete_groups | NULLABLE |
| `user_id` | `integer` | Foreign key to users | NULLABLE |
| `microcycle_id` | `integer` | Foreign key to microcycles | NULLABLE |
| `name` | `text` | Group name | NULLABLE |
| `description` | `text` | Group description | NULLABLE |
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

#### `exercise_presets`
Individual exercises within a preset group.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_preset_group_id` | `integer` | Foreign key to exercise_preset_groups | NULLABLE |
| `exercise_id` | `integer` | Foreign key to exercises | NULLABLE |
| `preset_order` | `integer` | Order within group | NULLABLE |
| `superset_id` | `bigint` | Superset grouping | NULLABLE |
| `notes` | `text` | Exercise notes | NULLABLE |

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `exercise_preset_groups` via `exercise_preset_group_id`
- Many-to-one with `exercises` via `exercise_id`

#### `exercise_preset_details`
Detailed parameters for each exercise preset.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_preset_id` | `integer` | Foreign key to exercise_presets | NULLABLE |
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
| `created_at` | `timestamptz` | Creation time | NULLABLE |

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `exercise_presets` via `exercise_preset_id`
- Many-to-one with `units` via `resistance_unit_id`

#### `exercise_training_sessions`
Actual training sessions performed by athletes.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `athlete_group_id` | `integer` | Foreign key to athlete_groups | NULLABLE |
| `athlete_id` | `integer` | Foreign key to athletes | NULLABLE |
| `exercise_preset_group_id` | `integer` | Foreign key to exercise_preset_groups | NULLABLE |
| `date_time` | `timestamptz` | Session date and time | NULLABLE |
| `session_mode` | `text` | Session type | NULLABLE |
| `notes` | `varchar` | Session notes | NULLABLE |
| `description` | `text` | Session description | NULLABLE |
| `status` | `text` | Session status | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |
| `updated_at` | `timestamp` | Last update time | NULLABLE |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `athlete_groups` via `athlete_group_id`
- Many-to-one with `athletes` via `athlete_id`
- Many-to-one with `exercise_preset_groups` via `exercise_preset_group_id`

#### `exercise_training_details`
Actual performance data for each exercise in a training session.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_training_session_id` | `integer` | Foreign key to exercise_training_sessions | NULLABLE |
| `exercise_preset_id` | `integer` | Foreign key to exercise_presets | NULLABLE |
| `resistance_unit_id` | `integer` | Foreign key to units | NULLABLE |
| `reps` | `integer` | Actual repetitions performed | NULLABLE |
| `distance` | `real` | Distance covered | NULLABLE |
| `duration` | `interval` | Time duration | NULLABLE |
| `completed` | `boolean` | Completion status | NULLABLE |
| `power` | `real` | Power output achieved | NULLABLE |
| `velocity` | `real` | Velocity achieved | NULLABLE |
| `tempo` | `text` | Actual tempo | NULLABLE |
| `metadata` | `jsonb` | Additional performance data | NULLABLE |
| `created_at` | `timestamptz` | Creation time | NULLABLE |
| `set_index` | `integer` | Set number | NULLABLE |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `exercise_training_sessions` via `exercise_training_session_id`
- Many-to-one with `exercise_presets` via `exercise_preset_id`
- Many-to-one with `units` via `resistance_unit_id`

### Events

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

The following tables have RLS enabled:
- `athlete_groups`
- `athletes`
- `coaches`
- `events`
- `exercise_preset_groups`
- `exercise_tags`
- `exercise_training_details`
- `exercise_training_sessions`
- `users`

## Data Types

### Custom Types
- `Json`: Flexible JSON type for storing structured data
- `UserRole`: Enum for user roles (athlete, coach, admin)
- `SessionMode`: Enum for session types (individual, group)
- `SessionStatus`: Enum for session statuses (planned, in_progress, completed, cancelled)
- `ExperienceLevel`: Enum for experience levels (beginner, intermediate, advanced, elite)
- `Gender`: Enum for gender options (male, female, other)
- `SubscriptionStatus`: Enum for subscription levels (free, premium, pro, cancelled)

## Indexes and Performance

### Primary Keys
All tables have auto-incrementing integer primary keys on the `id` column.

### Foreign Key Constraints
All foreign key relationships are properly constrained with appropriate cascade behaviors.

### RLS Policies
Row Level Security policies are implemented to ensure data isolation and proper access control based on user roles and relationships.

## Migration Notes

This schema represents the current state of the database as of the latest migration. When making changes:

1. Always test migrations on a development environment first
2. Ensure RLS policies are updated to match schema changes
3. Update TypeScript types in `apps/web/types/database.ts` to match schema changes
4. Update this documentation to reflect any modifications

## Related Documentation

- [API Architecture](./development/api-architecture.md)
- [Supabase Integration](./integrations/supabase-integration.md)
- [Security Overview](./security/README.md)
