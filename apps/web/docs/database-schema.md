# Database Schema Documentation

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
Master list of exercises available in the system with AI/ML capabilities.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `exercise_type_id` | `integer` | Foreign key to exercise_types | NULLABLE |
| `unit_id` | `integer` | Foreign key to units | NULLABLE |
| `name` | `varchar` | Exercise name | NULLABLE |
| `description` | `varchar` | Exercise description | NULLABLE |
| `video_url` | `varchar` | Instructional video URL | NULLABLE |
| `embedding` | `vector` | AI embedding for similarity search | NULLABLE |
| `search_tsv` | `tsvector` | Full-text search vector | Generated column |
| `owner_user_id` | `integer` | Foreign key to users (creator) | NULLABLE |
| `visibility` | `exercise_visibility_type` | Visibility scope | NULLABLE, DEFAULT 'global' |
| `is_archived` | `boolean` | Archive status | NULLABLE, DEFAULT false |

**RLS**: Disabled
**Relationships**: 
- Many-to-one with `exercise_types` via `exercise_type_id`
- Many-to-one with `units` via `unit_id`
- Many-to-one with `users` via `owner_user_id`

#### `units`
Measurement units for exercises (kg, lbs, reps, etc.).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `varchar` | Unit name | NULLABLE |
| `description` | `text` | Unit description | NULLABLE |

**RLS**: Disabled

#### `tags`
Categorization tags for exercises with structured categories.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | `integer` | Primary key | Auto-increment, NOT NULL |
| `name` | `varchar` | Tag name | NULLABLE |
| `category` | `text` | Tag category | NULLABLE, CHECK constraint |

**RLS**: Disabled
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
| `user_id` | `bigint` | Foreign key to users | NOT NULL |
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
| `name` | `varchar(100)` | Category name | NOT NULL |
| `color` | `varchar(7)` | Hex color code | NOT NULL, DEFAULT '#3B82F6' |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |

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
| `title` | `varchar(200)` | Article title | NOT NULL |
| `content` | `jsonb` | TipTap JSON content | NOT NULL |
| `category_id` | `integer` | Foreign key to knowledge_base_categories | NOT NULL |
| `created_at` | `timestamptz` | Creation time | NOT NULL, DEFAULT now() |
| `updated_at` | `timestamptz` | Last update time | NOT NULL, DEFAULT now() |

**RLS**: Enabled
**Relationships**: 
- Many-to-one with `coaches` via `coach_id`
- Many-to-one with `knowledge_base_categories` via `category_id`
**Content Format**: TipTap JSON structure for rich text editing
**AI Ready**: JSONB format enables AI context extraction and processing

### AI/ML Memory System

#### `memories`
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

**RLS**: Disabled
**Memory Types**: 'preference', 'philosophy', 'injury', 'profile', 'note', 'session_summary'
**Constraints**: Exactly one of coach_id, athlete_id, or group_id must be populated
**Cascade Deletes**: Memories are automatically deleted when their subject is deleted

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
- `knowledge_base_articles`
- `knowledge_base_categories`
- `races`
- `users`

**Note**: The `memories` table has RLS disabled as it requires complex cross-table access patterns for AI/ML operations.

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
