# Performance Analytics Feature Analysis

> **Created**: 2026-01-01
> **Status**: Analysis Complete
> **Related**: Freelap CSV Import, Workout Logs, Sprint Timing Data

---

## Executive Summary

This document analyzes the requirements and approach for building a comprehensive **Performance Analytics** page that serves two distinct use cases:

1. **Gym/Strength Analytics** - General workout performance tracking (volume, intensity, 1RM progression)
2. **Sprint Analytics** - Professional sprint performance analysis using Freelap timing data

These two domains require different UI/UX approaches, metrics, and visualization strategies.

---

## Current State Analysis

### Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Freelap Types | ✅ Complete | `apps/web/types/freelap.ts` |
| Freelap Display Component | ✅ Complete | `components/features/workout/components/exercise/freelap-metrics-table.tsx` |
| Performance Analytics Shell | 🟡 Scaffolded (disabled) | `components/features/performance/` |
| Performance Types | ✅ Defined | `components/features/performance/types/performance-types.ts` |
| Chart Library | ✅ Installed | Recharts 2.15.0 |
| Workout Log Sets | ✅ Has metadata field | `workout_log_sets.metadata` (JSONB) |

### Data Available for Analysis

**From `workout_log_sets` table:**
- `reps`, `weight`, `distance`, `performing_time`
- `power`, `velocity` (VBT metrics)
- `rpe` (Rate of Perceived Exertion)
- `metadata` (JSONB) - Contains Freelap sprint data

**From `athlete_personal_bests` table:**
- Exercise-specific PBs
- Event/Competition PBs
- Verification status, dates, metadata

---

## Freelap Data Structure Analysis

### CSV Export Format (from MyFreelap)

```
Date;Time;Exercise;Team;N° of athletes
12/30/2025;16:18;Sprint;;1

N;ID;REACTION TIME;TIME;GAP;TOTAL;DIST. (m);SPEED (m/s);FQ (s/s);LENGTH (m);NUMBER;L1 - 20.0;TOTAL 1;SPD 1;FQ (s/s);LENGTH (m);NUMBER;L2 - 20.0;TOTAL 2;SPD 2;FQ (s/s);LENGTH (m);NUMBER
2;SING;0.194s;05.63 (2);+00.02;12.97;40;7.10;4.35;1.69;24.4;03.39;03.39;5.90;4.22;1.40;14.3;02.24;05.63;8.93;4.50;1.98;10.1
```

### Stored Metadata Structure (TypeScript)

```typescript
interface FreeelapMetadata {
  // Overall sprint metrics
  time?: number              // Total time (seconds)
  speed?: number             // Average speed (m/s)
  distance?: number          // Total distance (meters)
  frequency?: number         // Step frequency (Hz)
  stride_length?: number     // Stride length (meters)
  steps?: number             // Total step count
  reaction_time?: number     // Reaction time (seconds)
  gap?: string               // Gap to best time
  note?: string

  // Multi-split data (for 40m, 60m, 100m sprints)
  splits?: FreeelapSplit[]
}

interface FreeelapSplit {
  distance: number           // Split distance (e.g., 20m)
  time: number               // Split time (seconds)
  cumulative_time?: number   // Cumulative time to this point
  speed?: number             // Speed for this segment
  frequency?: number         // Cadence for this segment
  stride_length?: number     // Stride length for this segment
  steps?: number             // Steps for this segment
}
```

---

## Sprint Analytics Requirements

### Key Sprint Phases (100m Sprint)

Based on biomechanics research, the 100m sprint divides into:

| Phase | Distance | Key Characteristics |
|-------|----------|---------------------|
| **Initial Acceleration** | 0-12m | Constant stride length increase, explosive start |
| **Main Acceleration** | 12-35m | Building momentum, technique refinement |
| **Transition** | 35-60m | Elite-only phase, reaching peak velocity |
| **Maximum Velocity** | 50-70m | Peak stride length, frequency, and speed |
| **Deceleration** | 80-100m | Speed maintenance, minimizing velocity loss |

### Reference Data (from screenshots)

#### Cumulative Split Standards

| Distance | 11.00s Runner | 10.00s Runner | Typical Difference |
|----------|---------------|---------------|-------------------|
| 10m | 1.85-1.90s | 1.80-1.83s | 0.04-0.07s |
| 20m | 3.10-3.20s | 3.00-3.05s | 0.10-0.15s |
| 30m | 4.15-4.25s | 3.95-4.05s | 0.18-0.25s |
| 40m | 5.30-5.40s | 5.05-5.15s | 0.25-0.35s |
| 50m | 6.40-6.55s | 6.05-6.15s | 0.35-0.45s |
| 60m | 7.45-7.60s | 6.85-6.95s | 0.50-0.60s |
| 70m | 8.55-8.70s | 7.95-8.05s | 0.55-0.70s |
| 80m | 9.65-9.80s | 8.85-8.95s | 0.65-0.80s |
| 90m | 10.35-10.50s | 9.55-9.65s | 0.75-0.90s |
| 100m | 11.00s | 10.00s | 1.00s |

#### Performance Parameters (11.00s vs 10.00s Sprinters)

| Parameter | 11.00s Sprinter | 10.00s Sprinter | Key Difference |
|-----------|-----------------|-----------------|----------------|
| Reaction Time | 0.17-0.19s | 0.13-0.15s | Faster neural response |
| 0-30m Phase | 4.05-4.15s | 3.95-4.05s | Higher horizontal force |
| 30-60m Phase | 3.05-3.15s | 2.85-2.95s | Better power & stiffness |
| 60-100m Phase | 3.75-3.90s | 3.20-3.35s | Max-velocity maintenance |
| Top Speed | 9.8-10.2 m/s | 11.2-11.6 m/s | +12-18% velocity |
| Stride Length | 2.20-2.35m | 2.50-2.70m | More force per contact |
| Stride Frequency | 4.2-4.4 Hz | 4.6-4.9 Hz | Faster neural cycling |
| Ground Contact (max-V) | 0.095-0.105s | 0.080-0.088s | Greater stiffness |
| Peak Vertical Force* | 3.5-4x BW | 4.5-5x BW | Stronger elastic system |

### Sprint Analytics User Stories

#### For Athletes

| ID | User Story | Priority |
|----|------------|----------|
| SA-1 | As an athlete, I want to see my split progression over time so I can identify which phase of my sprint needs work | High |
| SA-2 | As an athlete, I want to compare my splits against reference standards (11.00s, 10.00s) to understand my level | High |
| SA-3 | As an athlete, I want to see my reaction time trend to track start improvement | Medium |
| SA-4 | As an athlete, I want to visualize my velocity curve throughout a sprint | High |
| SA-5 | As an athlete, I want to see stride frequency vs stride length relationship over distance | Medium |
| SA-6 | As an athlete, I want to track my personal bests for different distances (10m, 20m, 40m, 60m) | High |
| SA-7 | As an athlete, I want to identify my deceleration pattern to minimize speed loss | Medium |

#### For Coaches

| ID | User Story | Priority |
|----|------------|----------|
| SC-1 | As a coach, I want to compare multiple athletes' sprint profiles side-by-side | High |
| SC-2 | As a coach, I want to see group average splits vs individual athletes | High |
| SC-3 | As a coach, I want to identify each athlete's strength/weakness phase | High |
| SC-4 | As a coach, I want to track an athlete's progression over a training cycle | High |
| SC-5 | As a coach, I want to flag athletes who may be overtraining based on declining metrics | Medium |
| SC-6 | As a coach, I want to set target splits for athletes and track progress toward them | Medium |
| SC-7 | As a coach, I want to export sprint reports for athlete meetings | Low |

### Sprint Analytics Visualizations

1. **Split Time Chart** (Line/Bar)
   - X-axis: Distance (10m, 20m, 30m, 40m...)
   - Y-axis: Split time
   - Overlay: Reference lines for 11.00s/10.00s standards
   - Multiple sessions for progression

2. **Velocity Profile Chart** (Area/Line)
   - X-axis: Distance or Time
   - Y-axis: Velocity (m/s)
   - Show acceleration, peak velocity, deceleration zones

3. **Stride Analysis Chart** (Dual-axis)
   - Stride Length vs Stride Frequency over distance
   - Identify optimal balance point

4. **Phase Analysis Cards**
   - 0-30m: Acceleration score
   - 30-60m: Top speed maintenance score
   - 60-100m: Deceleration index

5. **Session Comparison Table**
   - Recent sessions with all metrics
   - Delta indicators (faster/slower)
   - Best times highlighted

6. **Benchmark Comparison Radar Chart**
   - Multiple parameters plotted
   - Athlete vs reference standard overlay

---

## Gym/Strength Analytics Requirements

### Key Metrics for Strength Training

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Volume** | Sets × Reps × Weight | Total training stress |
| **Intensity** | % of 1RM | Load relative to max |
| **Estimated 1RM** | Weight × (1 + Reps/30) | Epley formula |
| **Volume Load** | Total volume per muscle group | Balance tracking |
| **Training Frequency** | Sessions per week | Recovery optimization |
| **RPE Trend** | Average RPE over time | Fatigue monitoring |
| **Progressive Overload** | Week-over-week volume/intensity increase | Growth indicator |

### Gym Analytics User Stories

#### For Athletes

| ID | User Story | Priority |
|----|------------|----------|
| GA-1 | As an athlete, I want to see my volume and intensity trends over time | High |
| GA-2 | As an athlete, I want to track my estimated 1RM for key lifts | High |
| GA-3 | As an athlete, I want to see my personal records for each exercise | High |
| GA-4 | As an athlete, I want to visualize muscle group balance (push vs pull, upper vs lower) | Medium |
| GA-5 | As an athlete, I want to track my consistency (workouts per week) | Medium |
| GA-6 | As an athlete, I want to set strength goals and track progress toward them | Medium |
| GA-7 | As an athlete, I want to see exercise-specific progression charts | High |

#### For Coaches

| ID | User Story | Priority |
|----|------------|----------|
| GC-1 | As a coach, I want to see all athletes' volume compliance in one view | High |
| GC-2 | As a coach, I want to identify athletes who may be plateauing | High |
| GC-3 | As a coach, I want to compare athlete strength levels to benchmarks | Medium |
| GC-4 | As a coach, I want to see RPE trends to monitor fatigue | Medium |
| GC-5 | As a coach, I want to track progressive overload adherence | High |
| GC-6 | As a coach, I want to generate training reports per mesocycle | Low |

### Gym Analytics Visualizations

1. **Volume & Intensity Timeline** (Already exists in PlansHome)
   - Mesocycle-level aggregation
   - Bars for volume, line for intensity

2. **1RM Progression Chart** (Line)
   - X-axis: Date
   - Y-axis: Estimated/Actual 1RM
   - Per exercise with trend line

3. **Exercise History Table**
   - Recent sets with weight, reps, RPE
   - PR indicators
   - Volume calculations

4. **Muscle Group Distribution** (Pie/Radar)
   - Volume by muscle group
   - Balance assessment

5. **Workout Consistency Heatmap**
   - GitHub-style contribution grid
   - Shows training frequency patterns

6. **Benchmark Cards**
   - Beginner → Intermediate → Advanced → Elite
   - Position based on key lifts (squat, bench, deadlift)

---

## Proposed Architecture

### Page Structure

```
/performance
├── /performance           # Dashboard overview (role-aware)
├── /performance/sprint    # Sprint-specific analytics
├── /performance/strength  # Gym/strength analytics
├── /performance/compare   # Comparative analytics (existing)
└── /performance/goals     # Goal tracking
```

### Component Architecture

```
components/features/performance/
├── components/
│   ├── shared/
│   │   ├── TimeRangeSelector.tsx
│   │   ├── ExerciseFilter.tsx
│   │   ├── ExportButton.tsx
│   │   └── BenchmarkCard.tsx
│   ├── sprint/
│   │   ├── SplitTimeChart.tsx
│   │   ├── VelocityProfileChart.tsx
│   │   ├── StrideAnalysisChart.tsx
│   │   ├── PhaseAnalysisCards.tsx
│   │   ├── SprintSessionTable.tsx
│   │   ├── SprintBenchmarkRadar.tsx
│   │   └── SprintProgressionChart.tsx
│   ├── strength/
│   │   ├── VolumeIntensityChart.tsx (refactor existing)
│   │   ├── OneRMProgressionChart.tsx
│   │   ├── ExerciseHistoryTable.tsx
│   │   ├── MuscleGroupDistribution.tsx
│   │   ├── ConsistencyHeatmap.tsx
│   │   └── StrengthBenchmarkCards.tsx
│   └── dashboard/
│       ├── PerformanceDashboard.tsx
│       ├── AthleteOverviewCard.tsx
│       └── QuickStatsRow.tsx
├── hooks/
│   ├── use-sprint-analytics.ts
│   ├── use-strength-analytics.ts
│   └── use-performance-data.ts
├── utils/
│   ├── sprint-calculations.ts     # Velocity, splits, phases
│   ├── strength-calculations.ts   # 1RM, volume load
│   └── benchmark-data.ts          # Reference standards
├── types/
│   ├── sprint-analytics-types.ts
│   ├── strength-analytics-types.ts
│   └── performance-types.ts       # (existing)
└── data/
    ├── sprint-benchmarks.ts       # 10.00s, 11.00s standards
    └── strength-benchmarks.ts     # Beginner to Elite levels
```

### Data Flow

```
Supabase Tables
    ↓
Server Actions (fetch workout data)
    ↓
React Query (caching, state management)
    ↓
Analytics Hooks (calculations, transformations)
    ↓
Chart Components (Recharts visualization)
    ↓
Dashboard / Page Components
```

---

## Sprint Benchmark Data File

```typescript
// data/sprint-benchmarks.ts

export const SPRINT_LEVELS = {
  ELITE: { label: 'Elite', color: 'purple', men100m: 10.20, women100m: 11.20 },
  ADVANCED: { label: 'Advanced', color: 'green', men100m: 10.80, women100m: 11.80 },
  INTERMEDIATE: { label: 'Intermediate', color: 'blue', men100m: 11.50, women100m: 12.50 },
  BEGINNER: { label: 'Beginner', color: 'orange', men100m: 12.50, women100m: 13.50 },
} as const

export const CUMULATIVE_SPLIT_STANDARDS = {
  '10.00': {
    label: '10.00s Runner',
    splits: {
      10: { min: 1.80, max: 1.83 },
      20: { min: 3.00, max: 3.05 },
      30: { min: 3.95, max: 4.05 },
      40: { min: 5.05, max: 5.15 },
      50: { min: 6.05, max: 6.15 },
      60: { min: 6.85, max: 6.95 },
      70: { min: 7.95, max: 8.05 },
      80: { min: 8.85, max: 8.95 },
      90: { min: 9.55, max: 9.65 },
      100: { min: 10.00, max: 10.00 },
    }
  },
  '11.00': {
    label: '11.00s Runner',
    splits: {
      10: { min: 1.85, max: 1.90 },
      20: { min: 3.10, max: 3.20 },
      30: { min: 4.15, max: 4.25 },
      40: { min: 5.30, max: 5.40 },
      50: { min: 6.40, max: 6.55 },
      60: { min: 7.45, max: 7.60 },
      70: { min: 8.55, max: 8.70 },
      80: { min: 9.65, max: 9.80 },
      90: { min: 10.35, max: 10.50 },
      100: { min: 11.00, max: 11.00 },
    }
  }
} as const

export const PERFORMANCE_PARAMETERS = {
  reactionTime: {
    label: 'Reaction Time',
    unit: 's',
    '10.00': { min: 0.13, max: 0.15 },
    '11.00': { min: 0.17, max: 0.19 },
    description: 'Faster neural response'
  },
  phase0_30: {
    label: '0-30m Phase',
    unit: 's',
    '10.00': { min: 3.95, max: 4.05 },
    '11.00': { min: 4.05, max: 4.15 },
    description: 'Higher horizontal force'
  },
  phase30_60: {
    label: '30-60m Phase',
    unit: 's',
    '10.00': { min: 2.85, max: 2.95 },
    '11.00': { min: 3.05, max: 3.15 },
    description: 'Better power & stiffness'
  },
  phase60_100: {
    label: '60-100m Phase',
    unit: 's',
    '10.00': { min: 3.20, max: 3.35 },
    '11.00': { min: 3.75, max: 3.90 },
    description: 'Max-velocity maintenance'
  },
  topSpeed: {
    label: 'Top Speed',
    unit: 'm/s',
    '10.00': { min: 11.2, max: 11.6 },
    '11.00': { min: 9.8, max: 10.2 },
    description: '+12-18% velocity difference'
  },
  strideLength: {
    label: 'Stride Length',
    unit: 'm',
    '10.00': { min: 2.50, max: 2.70 },
    '11.00': { min: 2.20, max: 2.35 },
    description: 'More force per contact'
  },
  strideFrequency: {
    label: 'Stride Frequency',
    unit: 'Hz',
    '10.00': { min: 4.6, max: 4.9 },
    '11.00': { min: 4.2, max: 4.4 },
    description: 'Faster neural cycling'
  },
  groundContact: {
    label: 'Ground Contact (max-V)',
    unit: 's',
    '10.00': { min: 0.080, max: 0.088 },
    '11.00': { min: 0.095, max: 0.105 },
    description: 'Greater stiffness'
  }
} as const
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create sprint benchmark data files
- [ ] Create strength benchmark data files
- [ ] Set up performance analytics route structure
- [ ] Implement data fetching hooks
- [ ] Enable existing performance components

### Phase 2: Sprint Analytics (Week 3-4)
- [ ] Build SplitTimeChart with reference overlays
- [ ] Build VelocityProfileChart
- [ ] Build PhaseAnalysisCards
- [ ] Implement sprint session comparison table
- [ ] Add CSV import flow for Freelap data

### Phase 3: Strength Analytics (Week 5-6)
- [ ] Build 1RM Progression chart
- [ ] Build Exercise History table
- [ ] Build Muscle Group Distribution chart
- [ ] Implement consistency heatmap
- [ ] Add strength benchmark cards

### Phase 4: Dashboard & Polish (Week 7-8)
- [ ] Create unified performance dashboard
- [ ] Add coach-specific views
- [ ] Implement export functionality
- [ ] Mobile responsiveness pass
- [ ] Performance optimization

---

## Key Decisions Needed

1. **Freelap CSV Import UX**
   - Upload directly in workout session?
   - Separate import page?
   - Auto-match to existing sessions?

2. **Benchmark Data Source**
   - Hardcode initial standards (from screenshots)?
   - Allow coach customization?
   - Pull from external API?

3. **Coach vs Athlete Views**
   - Same page with role-based filtering?
   - Separate routes?
   - Tab-based switching?

4. **Historical Data Depth**
   - How far back to aggregate?
   - Session-level vs set-level granularity?
   - Data retention policies?

---

## Research Sources

- [STATSports Sprint Split Analysis](https://statsports.com/article/introducing-statsports-sprint-split-analysis)
- [SimpliFaster Biomechanics Software](https://simplifaster.com/articles/biomechanics-software-hi-tech-meets-hi-speed/)
- [SprintPRO Sprint Profiling App](https://complementarytraining.com/introducing-sprintpro-the-ultimate-sprint-profiling-app/)
- [PMC: Elite 100m Sprint Performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC8847979/)
- [World Athletics Sprint Biomechanics](https://worldathletics.org/download/downloadnsa?filename=24d13356-c773-4aba-ade4-54c51d7cf37c.pdf)
- [Hevy Workout Tracker](https://www.hevyapp.com/)
- [Strong App](https://www.strong.app/)
- [TeamBuildr](https://www.teambuildr.com)
- [Jefit Stimulus Volume Engine](https://www.jefit.com/wp/guide/the-stimulus-volume-engine/)
- [NSCA Training Load Chart](https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf)
