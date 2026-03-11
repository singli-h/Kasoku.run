# Quickstart: Coach Flow V2

**Branch**: `013-coach-flow-v2` | **Date**: 2026-03-11

---

## What This Feature Does

Adds 5 capabilities to Kasoku.run for the first beta coach:
1. **Workspace cards show exercise content** — exercise names, computed volume/duration
2. **Exercise-level subgroup filtering** — tag exercises for SS/MS/LS, athletes see only their subgroup
3. **Template system** — save/insert exercise groups into sessions
4. **Dashboard mini calendar** — weekly strip with session previews for athletes
5. **AI text parser** — paste program text, get structured exercises

## Implementation Order

```
Phase 0: Shared utils (training-utils.ts)
Phase 1: DB migration (target_event_groups column + RLS)
Phase 2: #22 — Workspace session cards (exercise names, volume, duration)
Phase 3: #23 — Subgroup filtering (chip, popover, preview dropdown, athlete filtering, AI)
Phase 4: #33 — Templates (page remake, save, insert into session)
Phase 5: #31 — Dashboard mini calendar
Phase 6: #25 — AI text-to-blocks parser
```

## Key Files to Modify

### Shared Infrastructure
| File | What Changes |
|---|---|
| `apps/web/lib/training-utils.ts` | **NEW** — computeSessionMetrics, formatExerciseSummary, abbreviateEventGroup |
| `supabase/migrations/2026MMDD_target_event_groups.sql` | **NEW** — ADD COLUMN + RLS policy updates |
| `apps/web/types/database.ts` | Regenerate after migration |

### Workspace (#22)
| File | What Changes |
|---|---|
| `apps/web/actions/plans/plan-actions.ts` | Extend getMacrocycleByIdAction select to include sets + exercise_type_id |
| `apps/web/app/(protected)/plans/[id]/page.tsx` | Compute duration/volume from actual data instead of hardcoding |
| `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` | Update Session interface, render exercise names on cards |
| `apps/web/components/features/plans/workspace/components/MicrocycleEditor.tsx` | Add exercise summary + subgroup dots |

### Subgroup Filtering (#23)
| File | What Changes |
|---|---|
| `apps/web/components/features/training/components/ExerciseCard.tsx` | Add subgroup chip in header |
| `apps/web/components/features/training/views/SessionPlannerV2.tsx` | Add preview dropdown in sub-header |
| `apps/web/components/features/training/views/WorkoutView.tsx` | Pass preview filter state to ExerciseCards |
| `apps/web/actions/workout/workout-session-actions.ts` | Filter exercises during workout_log_exercises creation |
| `apps/web/lib/changeset/tools/proposal-tools.ts` | Add targetEventGroups to exercise tool schema |
| `apps/web/lib/changeset/prompts/plan-assistant.ts` | Add subgroup tags in exercise context, add targeting rules |

### Templates (#33)
| File | What Changes |
|---|---|
| `apps/web/components/features/plans/components/templates-page.tsx` | **REWRITE** — proper types, server fetch, role guard |
| `apps/web/app/(protected)/templates/page.tsx` | Add serverProtectRoute, server data fetch |
| `apps/web/actions/plans/session-plan-actions.ts` | Add insertTemplateExercisesAction |
| `apps/web/components/features/training/views/SessionPlannerV2.tsx` | Add template buttons in toolbar |
| `apps/web/components/layout/sidebar/app-sidebar.tsx` | Add Templates nav item for coach |

### Dashboard Calendar (#31)
| File | What Changes |
|---|---|
| `apps/web/actions/dashboard/dashboard-actions.ts` | Add getWeekSessionsAction |
| `apps/web/components/features/dashboard/components/dashboard-layout.tsx` | Add WeekCalendarStrip section |
| `apps/web/components/features/dashboard/components/week-calendar-strip.tsx` | **NEW** — calendar + session preview |
| `apps/web/components/features/dashboard/hooks/use-dashboard-queries.ts` | **NEW** — useWeekSessions hook |

### AI Text Parser (#25)
| File | What Changes |
|---|---|
| `apps/web/components/features/training/components/PasteProgram*.tsx` | **NEW** — paste dialog + preview |
| `apps/web/actions/plans/ai-parse-session-action.ts` | **NEW** — Claude structured output call |

## Build & Verify

```bash
npm run build:web   # Must pass with zero TypeScript errors
npm run dev:web     # Manual testing
```

## Architecture Decisions

1. **Dropdown over segmented toggle** for subgroup preview — scales to 20 subgroups
2. **RLS enforcement** for subgroup filtering — not just UI filtering
3. **Template = exercise insertion** into existing sessions, not session creation
4. **TanStack Query** for all client-side data (no SWR)
5. **Monday week start** convention (consistent with existing codebase)
6. **3-char abbreviations** for event group display
7. **workout_log_exercises copy step must filter** — RLS alone isn't enough for the initial copy
