# AI-Assisted Race Results Import - Technical Specification

> **Status**: Implemented
> **Last Updated**: 2026-01-03
> **Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Data Schema Design](#data-schema-design)
3. [Metadata Schema Standard](#metadata-schema-standard)
4. [Wind & Legal Performance Rules](#wind--legal-performance-rules)
5. [Event Mapping Strategy](#event-mapping-strategy)
6. [AI Parsing Implementation](#ai-parsing-implementation)
7. [Legal & Privacy Considerations](#legal--privacy-considerations)
8. [Pitfalls to Avoid](#pitfalls-to-avoid)
9. [Best Practices](#best-practices)
10. [Implementation Plan](#implementation-plan)

---

## Overview

### Purpose

Enable athletes to quickly import their race results by pasting text from any source. AI extracts structured data, user confirms, then imports to their personal results log.

### Key Principles

1. **Privacy First**: Never store raw pasted text
2. **Data Minimization**: Only extract event, performance, date, wind, indoor flag
3. **Standards Compliant**: Follow [Open Athletics Data Model](https://w3c.github.io/opentrack-cg/spec/model/) where practical
4. **User Control**: Preview and confirm before import
5. **No Source Attribution**: Don't store where data came from

---

## Data Schema Design

### Current Table: `athlete_personal_bests`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | integer | NO | Primary key |
| `athlete_id` | integer | NO | FK to athletes |
| `exercise_id` | integer | YES | Training PBs (mutually exclusive with event_id) |
| `event_id` | integer | YES | Competition PBs (100m, 200m, etc.) |
| `value` | numeric | NO | Performance value (seconds or meters) |
| `unit_id` | integer | NO | FK to units (seconds=5, meters=2) |
| `metadata` | jsonb | YES | Additional context (see schema below) |
| `achieved_date` | date | NO | When performance occurred |
| `session_id` | uuid | YES | Link to training session (if from training) |
| `verified` | boolean | YES | Coach verification status |
| `notes` | text | YES | Free text notes |
| `created_at` | timestamptz | YES | Record creation time |
| `updated_at` | timestamptz | YES | Last modification time |

### Design Decision: Single Table for All Results

**Why**: The `athlete_personal_bests` table is already designed to handle both training and competition results via the `exercise_id` vs `event_id` distinction. This is correct because:

1. **Same core data**: Both need value, date, metadata
2. **Flexible querying**: Can filter by `metadata.source` for different views
3. **Unified analytics**: Easy to compare training vs competition performance
4. **No schema migration needed**: Table is already properly structured

**Distinction Pattern**:
- `event_id IS NOT NULL` + `metadata.source = 'competition'` → Race result
- `exercise_id IS NOT NULL` + `metadata.source = 'training'` → Training PB
- `event_id IS NOT NULL` + `metadata.source = 'import'` → AI-imported result

---

## Metadata Schema Standard

### Competition Result Metadata

Following the [Open Athletics Data Model](https://w3c.github.io/opentrack-cg/spec/model/) principles:

```typescript
interface CompetitionResultMetadata {
  // === REQUIRED ===
  source: 'competition' | 'import' | 'training'

  // === PERFORMANCE FLAGS ===
  is_pb: boolean              // Is this a personal best?
  is_sb: boolean              // Is this a season best?

  // === WIND CONDITIONS (Track Events ≤200m, LJ, TJ only) ===
  wind?: number | null        // Wind speed in m/s (positive = tailwind)
  wind_legal?: boolean        // Calculated: wind <= 2.0 m/s

  // === ENVIRONMENT ===
  indoor: boolean             // Indoor competition (no wind applies)
  altitude?: number           // Venue altitude in meters (affects air resistance)

  // === TIMING METHOD (Optional) ===
  timing_method?: 'FAT' | 'HT' | 'transponder'
  // FAT = Fully Automatic Timing (0.01s precision)
  // HT = Hand Timing (0.1s precision, add 0.24s for comparison)
  // transponder = Chip timing for mass events

  // === COMBINED EVENTS (Decathlon/Heptathlon only) ===
  combined_event_id?: number  // Parent combined event
  discipline_index?: number   // Which discipline (1-10 for Dec, 1-7 for Hep)

  // === IMPORT TRACKING (for AI imports) ===
  imported_at?: string        // ISO timestamp of import
  import_confidence?: 'high' | 'medium' | 'low'

  // === DEPRECATED / DO NOT USE ===
  // competition_name?: string  // NO - don't store venue/meeting names
  // venue?: string            // NO - database extraction risk
  // position?: number         // NO - not needed for personal log
}
```

### Field Events Metadata Extension

```typescript
interface FieldEventMetadata extends CompetitionResultMetadata {
  // === JUMPS ===
  wind?: number               // Wind at moment of takeoff
  foul?: boolean              // Was this a foul/no-mark?

  // === THROWS (optional tracking) ===
  implement_weight?: number   // kg (if non-standard)

  // === HEIGHT EVENTS (HJ, PV) ===
  first_attempt?: boolean     // Cleared on first attempt?
  attempts_at_height?: number // Total attempts at this height
}
```

### Why This Schema

| Decision | Rationale |
|----------|-----------|
| No `competition_name` | Avoids database extraction appearance |
| No `venue` | Same as above |
| No `position/place` | Not needed for personal training log |
| Include `wind_legal` | Critical for PB/record tracking |
| Include `timing_method` | Hand times need adjustment for comparison |
| Include `indoor` flag | Indoor marks are separate category |
| Include `altitude` | High altitude affects times (>1000m) |

---

## Wind & Legal Performance Rules

Reference: [World Athletics Technical Rules](https://worldathletics.org/download/download?filename=1db01fe4-2229-4591-81ec-745bcc6042c7.pdf)

### Wind-Affected Events

| Event | Wind Applies | Measurement Period | Event ID |
|-------|-------------|-------------------|----------|
| 60m | YES | 10 seconds | 24 |
| 100m | YES | 10 seconds | 1 |
| 150m | YES | 10 seconds | 27 |
| 200m | YES | 10 seconds | 2 |
| 60m Hurdles | YES | 10 seconds | 25 |
| 100m Hurdles | YES | 13 seconds | 26 |
| 110m Hurdles | YES | 13 seconds | 9 |
| Long Jump | YES | 5 seconds before takeoff | 16 |
| Triple Jump | YES | 5 seconds before takeoff | 17 |
| 300m | NO | Run on curve | 28 |
| 400m+ | NO | N/A | - |
| All throws | NO | N/A | - |
| High Jump | NO | N/A | 14 |
| Pole Vault | NO | N/A | 15 |

### Wind Legal Threshold

```typescript
const WIND_LEGAL_LIMIT = 2.0 // m/s

function isWindLegal(wind: number | null | undefined): boolean {
  if (wind === null || wind === undefined) return true // Unknown = assume legal
  return wind <= WIND_LEGAL_LIMIT
}

// For records/PBs, wind-assisted marks (>+2.0) are noted but still valid results
// Example: 9.95w indicates wind-assisted (>+2.0 m/s)
```

### Wind Display Convention

```typescript
function formatWindDisplay(wind: number | null): string {
  if (wind === null) return ''
  const sign = wind >= 0 ? '+' : ''
  return `${sign}${wind.toFixed(1)}`
}

// Examples:
// +1.5 → "+1.5"
// -0.3 → "-0.3"
// +2.5 → "+2.5" (wind-assisted, mark with 'w')
```

### Hand Timing Adjustment

```typescript
const HAND_TIMING_ADJUSTMENT = 0.24 // seconds to add

function adjustHandTiming(time: number, method: 'FAT' | 'HT'): number {
  if (method === 'HT') {
    return time + HAND_TIMING_ADJUSTMENT
  }
  return time
}

// Why 0.24s: Statistical analysis shows hand timing averages 0.24s faster
// than FAT due to human reaction time in starting/stopping stopwatch
```

---

## Event Mapping Strategy

### Current Events Table

```
ID | Name              | Type
---|-------------------|--------
1  | 100m              | track
2  | 200m              | track
3  | 400m              | track
4  | 800m              | track
5  | 1500m             | track
6  | 3000m             | track
7  | 5000m             | track
8  | 10000m            | track
9  | 110m Hurdles      | track
10 | 400m Hurdles      | track
11 | 3000m Steeplechase| track
12 | 4x100m Relay      | track
13 | 4x400m Relay      | track
14 | High Jump         | field
15 | Pole Vault        | field
16 | Long Jump         | field
17 | Triple Jump       | field
18 | Shot Put          | field
19 | Discus Throw      | field
20 | Hammer Throw      | field
21 | Javelin Throw     | field
22 | Decathlon         | decathlon
23 | Heptathlon        | heptathlon
```

### Event Alias Mapping

For AI parsing, map common variations to canonical event IDs:

```typescript
const EVENT_ALIASES: Record<string, number> = {
  // 100m variations
  '100': 1, '100m': 1, '100 metres': 1, '100 meters': 1,

  // 200m variations
  '200': 2, '200m': 2, '200 metres': 2,

  // Hurdles variations
  '110h': 9, '110mh': 9, '110 hurdles': 9, '110m hurdles': 9,
  '100h': 9, '100mh': 9, // Women's 100m hurdles maps to same
  '400h': 10, '400mh': 10, '400 hurdles': 10,

  // Field events
  'hj': 14, 'high jump': 14, 'highjump': 14,
  'pv': 15, 'pole vault': 15, 'polevault': 15,
  'lj': 16, 'long jump': 16, 'longjump': 16,
  'tj': 17, 'triple jump': 17, 'triplejump': 17,
  'sp': 18, 'shot put': 18, 'shot': 18,
  'dt': 19, 'discus': 19, 'discus throw': 19,
  'ht': 20, 'hammer': 20, 'hammer throw': 20,
  'jt': 21, 'javelin': 21, 'javelin throw': 21,

  // Combined events
  'dec': 22, 'decathlon': 22,
  'hep': 23, 'heptathlon': 23,
}
```

### Missing Events to Add

Consider adding these common events:

```sql
-- Indoor-specific events (currently missing)
INSERT INTO events (name, category, type) VALUES
('60m', 'sprint', 'track'),
('60m Hurdles', 'hurdles', 'track');

-- Road events (future expansion)
-- ('5K', 'road', 'road'),
-- ('10K', 'road', 'road'),
-- ('Half Marathon', 'road', 'road'),
-- ('Marathon', 'road', 'road'),
```

---

## AI Parsing Implementation

### OpenAI Structured Output Schema

```typescript
import { z } from 'zod'

export const ParsedResultSchema = z.object({
  event: z.string().describe('Event name (100m, Long Jump, etc.)'),

  performance: z.number().describe('Performance value in seconds or meters'),

  performanceDisplay: z.string().describe('Human-readable format (10.52, 7.85m)'),

  date: z.string().describe('ISO date YYYY-MM-DD'),

  wind: z.number().nullable().describe('Wind in m/s, null if not shown or N/A'),

  indoor: z.boolean().describe('True if marked as indoor (i)'),

  confidence: z.enum(['high', 'medium', 'low']).describe('Parsing confidence'),
})

export const ParseResultsResponseSchema = z.object({
  results: z.array(ParsedResultSchema),
  unparseable: z.array(z.string()).describe('Lines that could not be parsed'),
})

export type ParsedResult = z.infer<typeof ParsedResultSchema>
export type ParseResultsResponse = z.infer<typeof ParseResultsResponseSchema>
```

### AI System Prompt

```typescript
const PARSE_RESULTS_PROMPT = `You are an athletics results parser. Extract race/competition results from the provided text.

EXTRACT ONLY:
- Event name (100m, 200m, Long Jump, etc.)
- Performance (time in seconds, distance in meters)
- Date (convert to YYYY-MM-DD format)
- Wind (if shown, in m/s)
- Indoor flag (if marked with 'i' or 'indoor')

DO NOT EXTRACT:
- Athlete names
- Club/team names
- Venue/location names
- Meeting/competition names
- Position/place
- Coach information

WIND RULES:
- Only extract wind for: 100m, 200m, 100mH, 110mH, Long Jump, Triple Jump
- Wind format is usually like "+1.5" or "-0.3" or "w: 1.5"
- If wind > +2.0, mark as wind-assisted but still extract

DATE HANDLING:
- Convert any date format to YYYY-MM-DD
- "21 Jun 15" → "2015-06-21"
- "06/21/2015" → "2015-06-21"
- If only 2-digit year, assume 20XX for years <= current, 19XX otherwise

PERFORMANCE CONVERSION:
- Track times: Convert to seconds (1:52.34 → 112.34)
- Field distances: Keep in meters (7.85m → 7.85)

CONFIDENCE LEVELS:
- high: All fields clearly parsed
- medium: Some ambiguity but reasonable guess
- low: Significant uncertainty, may be wrong

Return empty results array if no valid results found.`
```

### Server Action Implementation

```typescript
// actions/athletes/import-results-action.ts

export async function parseResultsAction(
  pastedText: string
): Promise<ActionState<ParseResultsResponse>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: 'Not authenticated' }
  }

  // Validate input length (prevent abuse)
  if (pastedText.length > 10000) {
    return { isSuccess: false, message: 'Input too long (max 10,000 characters)' }
  }

  // Rate limiting check would go here

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ParseResultsResponseSchema,
      system: PARSE_RESULTS_PROMPT,
      prompt: pastedText,
    })

    return {
      isSuccess: true,
      message: `Found ${object.results.length} results`,
      data: object,
    }
  } catch (error) {
    console.error('[parseResultsAction]:', error)
    return {
      isSuccess: false,
      message: 'Failed to parse results. Please try again.',
    }
  }
}
```

---

## Legal & Privacy Considerations

### Data Rights Summary

| Aspect | Our Approach | Legal Basis |
|--------|--------------|-------------|
| Source of data | User provides their own results | Data portability right (GDPR Art. 20) |
| Raw text storage | Never stored | Data minimization (GDPR Art. 5) |
| What we store | Structured performance data only | Legitimate interest |
| Source attribution | None stored | Avoids database rights issues |

### User Notice (Small Text, No Checkbox)

```
By importing, you confirm these are your own results.
```

**Why no checkbox**:
- Legitimate interest basis doesn't require explicit consent
- Data portability is a user right
- Checkbox would imply consent-based processing (higher bar)

### What We DON'T Store

- Competition/meeting names
- Venue names
- Position/place in race
- Other athletes' information
- Raw pasted text
- Source URL or identifier

---

## Pitfalls to Avoid

### 1. Performance Value Confusion

**Problem**: Mixing seconds and meters in the same field

**Solution**:
- Track events (type='track'): Always seconds
- Field events (type='field'): Always meters
- Use `unit_id` to explicitly specify (5=seconds, 2=meters)

```typescript
// WRONG: Storing time as string "10.52"
// RIGHT: Storing as numeric 10.52 with unit_id=5
```

### 2. Wind for Non-Wind Events

**Problem**: Storing wind for events where it doesn't apply

**Solution**: Only store wind for straight-track sprints, hurdles, and horizontal jumps

```typescript
// 60m (24), 100m (1), 150m (27), 200m (2), 60mH (25), 100mH (26), 110mH (9), LJ (16), TJ (17)
// Note: 300m (28), 400m+ are NOT wind-affected (run on curves)
const WIND_AFFECTED_EVENTS = [1, 2, 24, 25, 26, 9, 16, 17, 27]

function shouldHaveWind(eventId: number): boolean {
  return WIND_AFFECTED_EVENTS.includes(eventId)
}
```

### 3. Indoor vs Outdoor Ambiguity

**Problem**: Indoor 60m confused with outdoor 100m

**Solution**:
- Store `indoor: true/false` in metadata
- Indoor marks and outdoor marks are separate record categories
- Don't compare indoor and outdoor times directly

### 4. Hand Timing Without Adjustment

**Problem**: Comparing hand-timed (HT) with FAT times

**Solution**:
- Store original value as recorded
- Store timing_method in metadata
- Apply 0.24s adjustment only for comparison/ranking views
- Display original time but note "(HT)" if hand-timed

### 5. Duplicate Import Detection

**Problem**: User imports same results multiple times

**Solution**: Check for exact match on (athlete_id, event_id, achieved_date, value)

```typescript
const existingKey = `${athleteId}-${eventId}-${date}-${value}`
const existingResults = await getExistingResultKeys(athleteId)
if (existingResults.has(existingKey)) {
  // Skip duplicate
}
```

### 6. Combined Events Points Confusion

**Problem**: Storing Decathlon score in seconds field

**Solution**:
- Decathlon/Heptathlon use `unit_id` for points (need to add points unit)
- Individual event components link via `metadata.combined_event_id`

### 7. Date Parsing Edge Cases

**Problem**: "21 Jun 15" could be 2015 or 2115

**Solution**:
```typescript
function parseYear(twoDigitYear: number): number {
  const currentYear = new Date().getFullYear()
  const century = twoDigitYear <= (currentYear % 100) + 5 ? 2000 : 1900
  return century + twoDigitYear
}
```

### 8. Altitude-Affected Performances

**Problem**: High-altitude times (>1000m) are faster due to thin air

**Solution**:
- Optional `altitude` field in metadata
- Flag for display: "Altitude-assisted"
- Don't auto-adjust; just note for context

---

## Best Practices

### 1. Always Use Event ID, Not String

```typescript
// WRONG
{ event: "100m", ... }

// RIGHT
{ event_id: 1, ... }
```

### 2. Store Original Value, Calculate Derived

```typescript
// Store exactly what was achieved
value: 10.52

// Calculate is_pb on insert (compare with existing)
// Calculate wind_legal on insert (wind <= 2.0)
// Don't store calculated fields that can change
```

### 3. Use ISO 8601 for All Dates/Times

```typescript
// Date: YYYY-MM-DD
achieved_date: '2024-06-21'

// Timestamps: Full ISO format
imported_at: '2024-06-21T14:30:00Z'
```

### 4. Consistent Precision

```typescript
// Track times: 2 decimal places (0.01s = FAT precision)
value: 10.52  // Not 10.5 or 10.520

// Field distances: 2 decimal places (0.01m = standard)
value: 7.85   // Not 7.8 or 7.850

// Wind: 1 decimal place (standard measurement)
wind: 1.5    // Not 1.50 or 1
```

### 5. Separate Import Preview from Save

```typescript
// Step 1: Parse and preview (no DB write)
const parsed = await parseResultsAction(pastedText)

// Step 2: User reviews and confirms

// Step 3: Save only selected results
const saved = await bulkImportResultsAction(selectedResults)
```

### 6. Audit Trail Without Storing Source

```typescript
metadata: {
  source: 'import',
  imported_at: '2024-06-21T14:30:00Z',
  import_confidence: 'high',
  // NO: source_url, source_name, etc.
}
```

---

## Implementation Plan

### Phase 1: Schema Validation (Pre-Implementation)

- [x] Verify events table has all needed events (add 60m, 60mH, 100mH)
- [x] Verify units table has all needed units (add points if missing)
- [x] Document metadata schema in database comments
- [x] Create TypeScript types for metadata

### Phase 2: AI Parsing Layer

- [x] Create `lib/ai/parse-race-results.ts` with Zod schema
- [x] Implement `parseResultsAction` server action
- [x] Add input length validation (max 10,000 characters)
- [ ] Add rate limiting for AI calls (TODO: future enhancement)

### Phase 3: Import Action

- [x] Create `bulkImportResultsAction` server action
- [x] Implement duplicate detection
- [x] Implement PB auto-detection
- [x] Implement wind_legal calculation

### Phase 4: UI Components

- [x] Create `ImportResultsDialog.tsx` with two-step flow
- [x] Preview table with checkboxes for selection
- [x] Update `RaceResultsDashboard.tsx` with import button
- [x] Remove deprecated PO10 section and code

### Phase 5: Testing & Polish

- [x] Build verification passed
- [x] Type check passed
- [ ] Test with real-world paste examples (manual testing needed)
- [ ] Handle edge cases (combined events, relays) - future enhancement

---

## References

- [Open Athletics Data Model](https://w3c.github.io/opentrack-cg/spec/model/) - W3C Community Group
- [World Athletics Technical Rules](https://worldathletics.org/about-iaaf/documents/technical-information)
- [Wind Assistance Rules](https://en.wikipedia.org/wiki/Wind_assistance) - Wikipedia
- [GDPR Data Portability](https://europa.eu/youreurope/business/dealing-with-customers/data-protection/data-protection-gdpr/index_en.htm)
- [UK Data Act 2025](https://www.faegredrinker.com/en/insights/publications/2025/7/the-uk-data-use-and-access-act-2025)

---

## Appendix: Sample Paste Formats

### Format A: Simple Table
```
100  11.40  +1.6  21 Jun 15
200  23.15  -0.3  14 Jul 15
60i   7.12       10 Feb 15
```

### Format B: With Headers
```
Event  Perf   Wind  Date
100m   10.52  +1.2  2024-06-15
200m   21.34  -0.5  2024-05-20
```

### Format C: Field Events
```
Long Jump  7.85m  +0.8  2024-07-01
Shot Put   18.50m       2024-06-15
```

### Format D: Mixed/Messy
```
Track & Field Results 2024
100 metres - 10.52 (+1.2) June 15th
200m 21.34 wind: -0.5 May 20
LJ: 7.85 (wind +0.8) 1 July
```

All formats should be parseable by the AI with appropriate confidence levels.
