# Workout Data Seeding Scripts

This directory contains scripts for seeding workout-related data for development and testing purposes.

## Available Scripts

### `seed-workout-data.ts`

Comprehensive script that seeds the database with realistic workout data including:

- **Exercise Types**: Strength, Cardio, Flexibility, Balance, Plyometric
- **Units**: Reps, seconds, minutes, meters, kilometers, pounds, kilograms
- **Exercises**: 25+ exercises across different categories
- **Exercise Preset Groups**: 8 different workout routines
- **Exercise Presets**: 3-7 exercises per group with realistic durations
- **Exercise Preset Details**: Sets, reps, weights, rest times for each exercise
- **Training Sessions**: 20 sessions with different statuses (assigned, ongoing, completed, cancelled)
- **Performance Data**: Realistic performance records for completed sessions

## Usage

### Prerequisites

1. Ensure you have the required environment variables in your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Script

#### Development Mode
```bash
npm run seed:workout:dev
```

#### Production Mode
```bash
npm run seed:workout
```

#### Direct Execution
```bash
npx tsx scripts/seed-workout-data.ts
```

## What Gets Seeded

### Exercise Types (5)
- Strength
- Cardio
- Flexibility
- Balance
- Plyometric

### Units (7)
- reps, seconds, minutes, meters, kilometers, pounds, kilograms

### Exercises (25+)
- **Strength**: Push-ups, Squats, Pull-ups, Deadlifts, Bench Press, etc.
- **Cardio**: Running, Cycling, Swimming, Jump Rope, Burpees, etc.
- **Flexibility**: Downward Dog, Pigeon Pose, Forward Fold, etc.
- **Balance**: Single Leg Stand, Tree Pose, Heel-to-Toe Walk
- **Plyometric**: Box Jumps, Jump Squats, Clap Push-ups

### Exercise Preset Groups (8)
- Morning Strength Routine
- Cardio Blast
- Flexibility Flow
- Full Body HIIT
- Upper Body Focus
- Lower Body Power
- Core Strength
- Recovery Session

### Training Sessions (20)
- Mix of assigned, ongoing, completed, and cancelled sessions
- Dates spanning from 30 days ago to 7 days in the future
- Realistic week/day assignments
- Varied notes and descriptions

### Performance Data
- Realistic performance records for completed sessions
- Slight variations in reps, weights, and rest times
- Notes about form and completion

## Data Relationships

The script creates a complete workout ecosystem with proper relationships:

```
Exercise Types
    ↓
Exercises ← Exercise Preset Groups
    ↓           ↓
Exercise Presets → Training Sessions
    ↓
Exercise Preset Details → Performance Data
```

## Customization

You can modify the script to:

1. **Add more exercises**: Edit the `exercises` array
2. **Create different workout groups**: Modify the `exercisePresetGroups` array
3. **Adjust session counts**: Change the loop count in the training sessions section
4. **Modify date ranges**: Update the `startDate` and `endDate` variables
5. **Add more performance data**: Extend the performance data creation logic

## Safety

- The script uses `upsert` operations, so it's safe to run multiple times
- It won't duplicate data due to unique constraints
- All operations are wrapped in try-catch blocks for error handling
- The script provides detailed logging of what's being created

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Ensure your `.env.local` file has the required Supabase credentials
2. **Permission errors**: Make sure your service role key has the necessary permissions
3. **Database constraints**: Check that your database schema matches the expected structure

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm run seed:workout:dev
```

## Cleanup

To remove seeded data, you can run:

```sql
-- Remove performance data
DELETE FROM exercise_training_details;

-- Remove training sessions
DELETE FROM exercise_training_sessions;

-- Remove exercise preset details
DELETE FROM exercise_preset_details;

-- Remove exercise presets
DELETE FROM exercise_presets;

-- Remove exercise preset groups
DELETE FROM exercise_preset_groups;

-- Remove exercises
DELETE FROM exercises;

-- Remove units
DELETE FROM units;

-- Remove exercise types
DELETE FROM exercise_types;
```

**Note**: Be careful when running cleanup queries in production!
