# Sprint Analytics: Competition PBs Enhancement

## Overview

Add competition PB tracking to Sprint Analytics, showing both training (Freelap) and competition (race results) performance side by side.

**User Story:**
> As an athlete, I want to see my competition PBs alongside my training PBs so I can track how my training translates to race performance.

**Expected Display:**
```
┌─────────────────────────────────────────┐
│  Best 100m                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Training:     10.85s (Freelap)         │
│  Competition:  10.52s (-0.33s) ✓        │
│                        ↑ wind-legal      │
└─────────────────────────────────────────┘
```

---

## Implementation Approach

### Minimal Change Strategy

**Why this approach works:**
1. Reuse existing `SprintQuickStats` card format - just extend the "Best Time" card
2. Single query addition to `getSprintAnalyticsAction` - fetch competition results in same action
3. No new components - extend existing types and display logic
4. Progressive enhancement - gracefully degrades when no competition data exists

---

## Phase 1: Data Layer Changes

### 1.1 Extend Type Definitions

**File:** `apps/web/actions/performance/performance-actions.ts`

```typescript
// Add to AthleteSprintMetrics
export interface AthleteSprintMetrics {
  // ... existing fields ...

  // Competition PB (best wind-legal result for sprint events)
  competitionPB?: {
    eventId: number           // 1=100m, 2=200m, 27=150m, etc.
    eventName: string         // "100m", "200m", etc.
    value: number             // Time in seconds
    date: string              // ISO date (YYYY-MM-DD)
    windLegal: boolean        // Was wind ≤2.0 m/s?
    wind?: number             // Wind reading if available
    indoor: boolean           // Indoor vs outdoor
  }
}

// Add to SprintQuickStats
export interface SprintQuickStats {
  // ... existing fields ...

  // Competition comparison
  competitionPBTime?: number      // Best competition time (wind-legal preferred)
  competitionEventName?: string   // "100m" for display
  competitionVsTraining?: number  // Delta: negative = competition faster
}
```

### 1.2 Query Competition Results

**Logic in `getSprintAnalyticsAction`:**

```typescript
// Sprint event IDs: 60m(24), 100m(1), 150m(27), 200m(2), 300m(28), 400m(3)
const SPRINT_EVENT_IDS = [24, 1, 27, 2, 28, 3]

// Query competition PBs
const { data: competitionResults } = await supabase
  .from('athlete_personal_bests')
  .select('id, value, achieved_date, event_id, metadata')
  .eq('athlete_id', athlete.id)
  .in('event_id', SPRINT_EVENT_IDS)
  .order('value', { ascending: true })  // Best time first

// Filter to competition source only
const competitionPBs = (competitionResults || [])
  .filter(r => {
    const meta = r.metadata as RaceResultMetadata | null
    return meta?.source === 'competition'
  })

// Find best wind-legal result (prefer over wind-assisted)
const windLegalPBs = competitionPBs.filter(r => {
  const meta = r.metadata as RaceResultMetadata | null
  return meta?.wind_legal !== false // wind_legal undefined = assume legal
})

const bestCompetitionPB = windLegalPBs[0] || competitionPBs[0]
```

### 1.3 Build Competition PB Data

```typescript
if (bestCompetitionPB) {
  const meta = bestCompetitionPB.metadata as RaceResultMetadata | null

  // Get event name from events table or map
  const eventName = EVENT_ID_TO_NAME[bestCompetitionPB.event_id] || 'Sprint'

  athleteMetrics.competitionPB = {
    eventId: bestCompetitionPB.event_id,
    eventName,
    value: bestCompetitionPB.value,
    date: bestCompetitionPB.achieved_date,
    windLegal: meta?.wind_legal !== false,
    wind: meta?.wind ?? undefined,
    indoor: meta?.indoor ?? false,
  }

  // Add to quick stats
  quickStats.competitionPBTime = bestCompetitionPB.value
  quickStats.competitionEventName = eventName

  // Calculate delta vs training (if same distance or approximate)
  if (bestSession && matchesDistance(bestSession.distance, bestCompetitionPB.event_id)) {
    quickStats.competitionVsTraining = bestCompetitionPB.value - bestSession.totalTime
  }
}
```

---

## Phase 2: UI Layer Changes

### 2.1 Update SprintQuickStats Display

**File:** `apps/web/components/features/performance/components/sprint/SprintQuickStats.tsx`

Extend the `SprintStat` type to support dual values:

```typescript
export interface SprintStat {
  id: string
  label: string
  value: string
  unit?: string
  change?: { /* ... existing ... */ }
  subtitle?: string

  // NEW: Competition comparison
  secondaryValue?: {
    label: string       // "Competition"
    value: string       // "10.52"
    unit?: string       // "s"
    delta?: string      // "-0.33s"
    isImprovement?: boolean  // true if competition < training
    badge?: string      // "wind-legal" or "wind-assisted"
  }
}
```

**Render logic:**
```tsx
{stat.secondaryValue && (
  <div className="mt-2 pt-2 border-t border-border/30">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {stat.secondaryValue.label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold tabular-nums">
          {stat.secondaryValue.value}
          {stat.secondaryValue.unit}
        </span>
        {stat.secondaryValue.delta && (
          <span className={cn(
            "text-xs font-medium",
            stat.secondaryValue.isImprovement ? "text-green-500" : "text-amber-500"
          )}>
            ({stat.secondaryValue.delta})
          </span>
        )}
      </div>
    </div>
    {stat.secondaryValue.badge && (
      <Badge variant="outline" className="mt-1 text-[10px]">
        {stat.secondaryValue.badge}
      </Badge>
    )}
  </div>
)}
```

### 2.2 Update buildQuickStats in Dashboard

**File:** `apps/web/components/features/performance/components/sprint/SprintAnalyticsDashboard.tsx`

```typescript
function buildQuickStats(data: SprintAnalyticsData): SprintStat[] {
  const { quickStats, athleteMetrics } = data

  const bestTimeCard: SprintStat = {
    id: 'best-time',
    label: 'Best Time',
    value: quickStats.bestTime40m?.toFixed(2) ?? 'N/A',
    unit: quickStats.bestTime40m ? 's' : '',
    subtitle: 'Training (Freelap)',
    // ... existing change logic ...
  }

  // Add competition comparison if available
  if (athleteMetrics.competitionPB) {
    const compPB = athleteMetrics.competitionPB
    bestTimeCard.secondaryValue = {
      label: `Competition ${compPB.eventName}`,
      value: compPB.value.toFixed(2),
      unit: 's',
      delta: quickStats.competitionVsTraining
        ? `${quickStats.competitionVsTraining > 0 ? '+' : ''}${quickStats.competitionVsTraining.toFixed(2)}s`
        : undefined,
      isImprovement: (quickStats.competitionVsTraining ?? 0) < 0,
      badge: compPB.indoor
        ? 'indoor'
        : compPB.windLegal
          ? 'wind-legal'
          : 'wind-assisted',
    }
  }

  return [bestTimeCard, /* ... other stats ... */]
}
```

### 2.3 Update BenchmarkReferenceCard

**File:** `apps/web/components/features/performance/components/sprint/BenchmarkReferenceCard.tsx`

Add competition PB as a row in the metrics table:

```typescript
// In buildMetricRows()
if (athleteMetrics.competitionPB) {
  const compPB = athleteMetrics.competitionPB
  const distStandard = getDistanceStandard(getDistanceFromEventId(compPB.eventId))

  if (distStandard) {
    rows.push({
      key: 'competitionPB',
      label: `${compPB.eventName} (Race)`,
      athleteValue: formatSprintTime(compPB.value),
      standard11: `${distStandard.standards['11.00'].min.toFixed(2)}-${distStandard.standards['11.00'].max.toFixed(2)}s`,
      standard10: `${distStandard.standards['10.00'].min.toFixed(2)}-${distStandard.standards['10.00'].max.toFixed(2)}s`,
      status: getComparisonStatus(compPB.value, distStandard, '11.00'),
    })
  }
}
```

---

## Edge Cases & Rules

### 1. Distance Matching

| Training Distance | Competition Events | Comparison Valid? |
|------------------|-------------------|-------------------|
| 40m | 60m | No - show both, no delta |
| 40m | 100m | No - different phases |
| 60m | 60m | Yes - direct comparison |
| 100m | 100m | Yes - direct comparison |

**Rule:** Only show delta when distances are within 20% of each other.

### 2. Wind-Legal Priority

```typescript
// Priority order for "best" competition PB:
1. Wind-legal (wind ≤ 2.0 m/s) - Official PB
2. Indoor (no wind) - Valid but marked
3. Wind-assisted (wind > 2.0 m/s) - Marked with "(w)"

// Display logic:
if (competitionPB.windLegal) {
  badge = 'wind-legal'
} else if (competitionPB.indoor) {
  badge = 'indoor'
} else {
  badge = 'wind-assisted'
}
```

### 3. No Competition Data

If athlete has no competition results:
- Show training stats only (current behavior)
- No error or empty state
- "Competition" section simply doesn't appear

### 4. No Training Data

If athlete has competition results but no Freelap training:
- Show competition PB as primary value
- Label changes from "Training" to "No training data"
- Still functional, just reversed emphasis

---

## Files to Modify

| File | Changes |
|------|---------|
| `actions/performance/performance-actions.ts` | Add competition PB query, extend types |
| `components/.../sprint/SprintQuickStats.tsx` | Add `secondaryValue` support |
| `components/.../sprint/SprintAnalyticsDashboard.tsx` | Update `buildQuickStats()` |
| `components/.../sprint/BenchmarkReferenceCard.tsx` | Add competition PB row |

**New Files:** None

**Database Changes:** None (uses existing `athlete_personal_bests`)

---

## Testing Checklist

- [ ] No competition results → Training only displays correctly
- [ ] Competition result exists → Shows in quick stats
- [ ] Wind-legal vs wind-assisted → Correct badge shown
- [ ] Indoor result → Marked as indoor
- [ ] Distance mismatch → No delta shown
- [ ] Distance match → Delta calculated correctly
- [ ] Multiple competition results → Best one selected
- [ ] Competition faster than training → Green color, negative delta
- [ ] Training faster than competition → Amber color, positive delta

---

## Future Enhancements (Not in Scope)

1. **Season Best vs All-Time Best** - Toggle between current season and all-time
2. **Event Selector** - Filter by specific event (100m, 200m, etc.)
3. **Competition History Chart** - Timeline of competition performances
4. **Wind Analysis** - Show how wind affects performance
5. **Indoor vs Outdoor Split** - Separate benchmarks for indoor
