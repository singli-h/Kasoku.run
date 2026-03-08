# Data Model: Frontend Responsive Design Fixes

**Feature**: 001-frontend-responsive-design
**Date**: 2025-12-03
**Phase**: 1 (Design & Contracts)

---

## Overview

**No new entities or schema changes.** This feature is CSS-only and leverages existing Supabase database schema.

---

## Existing Entities (Reference Only)

These tables are used for browser testing verification but are NOT modified by this feature:

### macrocycles
**Purpose**: Training plan macrocycles (coach creates via Plans page)

**Key Fields**:
- `id` (uuid, PK)
- `name` (text)
- `user_id` (uuid, FK → users)
- `start_date` (date)
- `end_date` (date)
- `created_at` (timestamptz)

**Browser Test Verification**: After creating macrocycle in Plans page, verify row exists in this table

---

### mesocycles
**Purpose**: Training phases within macrocycles

**Key Fields**:
- `id` (uuid, PK)
- `macrocycle_id` (uuid, FK → macrocycles)
- `name` (text)
- `start_date` (date)
- `end_date` (date)
- `volume` (numeric)
- `intensity` (numeric)

**Browser Test Verification**: After creating mesocycle, verify row exists and `macrocycle_id` is correct

---

### microcycles
**Purpose**: Weekly training cycles within mesocycles

**Key Fields**:
- `id` (uuid, PK)
- `mesocycle_id` (uuid, FK → mesocycles)
- `week_number` (integer)
- `start_date` (date)

**Browser Test Verification**: After creating microcycle, verify row exists and `mesocycle_id` is correct

---

### exercise_preset_groups
**Purpose**: Session templates (created in Session Planner)

**Key Fields**:
- `id` (uuid, PK)
- `name` (text)
- `microcycle_id` (uuid, FK → microcycles)
- `session_type` (text)
- `created_at` (timestamptz)

**Browser Test Verification**: After creating session with exercises, verify row exists

---

### exercise_presets
**Purpose**: Exercises within a session template

**Key Fields**:
- `id` (uuid, PK)
- `exercise_preset_group_id` (uuid, FK → exercise_preset_groups)
- `exercise_id` (uuid, FK → exercises)
- `order` (integer)
- `superset_group` (integer, nullable)

**Browser Test Verification**: After adding exercises to session, verify rows exist with correct order and superset_group

---

### exercise_preset_details
**Purpose**: Set parameters for exercises (reps, weight, etc.)

**Key Fields**:
- `id` (uuid, PK)
- `exercise_preset_id` (uuid, FK → exercise_presets)
- `set_number` (integer)
- `reps` (integer, nullable)
- `weight` (numeric, nullable)
- `time` (numeric, nullable)
- `distance` (numeric, nullable)

**Browser Test Verification**: After editing set parameters, verify rows exist with correct values

---

### exercise_training_sessions
**Purpose**: Actual workout sessions (athlete completes via Workout page)

**Key Fields**:
- `id` (uuid, PK)
- `athlete_id` (uuid, FK → athletes)
- `exercise_preset_group_id` (uuid, FK → exercise_preset_groups, nullable)
- `session_date` (date)
- `status` (text: 'assigned' | 'ongoing' | 'completed' | 'cancelled')
- `started_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)

**Browser Test Verification**:
- After starting session, verify status changes from 'assigned' → 'ongoing'
- After completing session, verify status changes to 'completed' and `completed_at` is set

---

### exercise_training_details
**Purpose**: Performance data for completed exercises

**Key Fields**:
- `id` (uuid, PK)
- `exercise_training_session_id` (uuid, FK → exercise_training_sessions)
- `exercise_id` (uuid, FK → exercises)
- `set_number` (integer)
- `reps_completed` (integer, nullable)
- `weight_used` (numeric, nullable)
- `time_seconds` (numeric, nullable)

**Browser Test Verification**: After athlete logs performance, verify rows exist with correct data

---

## Relationships (No Changes)

```
users (coaches)
  ↓ (1:N)
macrocycles
  ↓ (1:N)
mesocycles
  ↓ (1:N)
microcycles
  ↓ (1:N)
exercise_preset_groups (sessions)
  ↓ (1:N)
exercise_presets
  ↓ (1:N)
exercise_preset_details (set parameters)

---

athletes
  ↓ (1:N)
exercise_training_sessions (workouts)
  ↓ (1:N)
exercise_training_details (performance data)
```

---

## State Transitions (Reference Only)

### exercise_training_sessions.status

```
'assigned' → 'ongoing' → 'completed'
           ↓
        'cancelled'
```

**Browser Test Verification**: Verify status transitions occur correctly in database after UI actions

---

## Validation Rules (Existing - No Changes)

All validation rules are already implemented in server actions. Browser tests will verify they still work after CSS changes:

1. **RLS Policies**: All tables filter by user_id automatically
2. **Date Validation**: start_date must be before end_date
3. **Ownership**: Users can only modify their own data
4. **Cascading Deletes**: Deleting macrocycle cascades to mesocycles → microcycles → sessions

---

## Summary

**No data model changes.** This document serves as a reference for browser testing to verify database integrity after CSS modifications don't break existing CRUD functionality.
