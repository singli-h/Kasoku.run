# Workout Components Organization

This directory contains all workout-related components organized into logical subfolders for better maintainability and reusability.

## Folder Structure

```
components/
├── pages/                    # Page-specific components
│   ├── workout-page-content.tsx
│   ├── workout-session-selector.tsx
│   ├── workout-session-dashboard.tsx
│   └── workout-history-page.tsx
├── exercise/                 # Exercise-related components
│   ├── exercise-card.tsx
│   ├── exercise-dashboard.tsx
│   ├── exercise-type-section.tsx
│   ├── enhanced-exercise-organization.tsx
│   ├── superset-container.tsx
│   ├── enhanced-superset-indicator.tsx
│   └── set-row.tsx
├── ui/                      # UI components
│   └── video-player.tsx
├── error-loading/           # Error handling and loading states
│   ├── workout-error-boundary.tsx
│   └── workout-loading-states.tsx
└── session/                 # Session components (re-exported from composed)
    └── index.ts
```

## Component Categories

### Page Components (`/pages`)
Components that represent entire pages or major page sections:
- **WorkoutPageContent**: Main orchestrator for the workout flow
- **WorkoutSessionSelector**: Session selection interface
- **WorkoutSessionDashboard**: Active workout execution interface
- **WorkoutHistoryPage**: Workout history with pagination and filtering

### Exercise Components (`/exercise`)
Components for displaying and managing exercises within workouts:
- **ExerciseCard**: Individual exercise display
- **ExerciseDashboard**: Exercise execution interface
- **ExerciseTypeSection**: Grouped exercise display
- **EnhancedExerciseOrganization**: Advanced exercise organization
- **SupersetContainer**: Superset exercise grouping
- **SetRow**: Individual set display and input

### UI Components (`/ui`)
Reusable UI components specific to workout features:
- **VideoPlayer**: Video playback for exercise demonstrations

### Error & Loading Components (`/error-loading`)
Components for handling errors and loading states:
- **WorkoutErrorBoundary**: Error boundary with recovery options
- **WorkoutLoadingStates**: Various loading state components

### Session Components (`/session`)
**Note**: These components have been moved to `/components/composed` for better reusability across multiple pages. This folder contains re-exports for backward compatibility.

## Reusable Components

Components that are used across multiple pages have been moved to `/components/composed`:

- **WorkoutSessionCard**: Session display card (used in workout and history pages)
- **WorkoutSessionStatusBadge**: Status indicator badge
- **WorkoutSessionDateDisplay**: Date formatting and display
- **WorkoutSessionDurationDisplay**: Duration calculation and display
- **WorkoutSessionExerciseCount**: Exercise counting and display

## Import Patterns

### Page Components
```typescript
import { WorkoutPageContent } from '@/components/features/workout'
```

### Exercise Components
```typescript
import { ExerciseCard, ExerciseDashboard } from '@/components/features/workout'
```

### Reusable Session Components
```typescript
import { WorkoutSessionCard } from '@/components/composed'
```

### Error & Loading Components
```typescript
import { WorkoutErrorBoundary, LoadingSpinner } from '@/components/features/workout'
```

## Best Practices

1. **Page-specific components** should stay in the `/pages` folder
2. **Reusable components** that are used across multiple pages should be moved to `/components/composed`
3. **Feature-specific components** that are only used within the workout feature can stay in their respective subfolders
4. **UI components** should be generic and reusable within the workout feature
5. **Error and loading components** should be specific to the workout feature's error handling patterns

## Migration Notes

- Session components were moved from `/session` to `/components/composed` for better reusability
- The `/session` folder now contains re-exports for backward compatibility
- All imports have been updated to use the new structure
- Components are properly organized by their usage patterns and reusability
