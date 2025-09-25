/*
<ai_context>
Index file for composed components that combine shadcn/ui primitives into 
higher-level patterns specific to the Kasoku running/fitness application.
Based on patterns from the original web_old system.
</ai_context>
*/

// Existing composed components
export { ListContainer } from "./list-container"
export { ListItem } from "./list-item"
export { ListFilters } from "./list-filters"
export { ListHeader } from "./list-header"
export { ListEmptyState } from "./list-empty-state"
export { ListSkeleton } from "./list-skeleton"
export { DataTable } from "./data-table"
export { CommentSection } from "./comment-section"
export { default as HeroVideoDialog } from "./hero-video-dialog"
export { default as AnimatedGradientText } from "./animated-gradient-text"

// New Kasoku-specific training/fitness components
export { WizardContainer } from "./wizard-container"
export { SectionManager } from "./section-manager"
export { AthleteSummaryCard } from "./athlete-summary-card"
export { TrainingSessionCard } from "./training-session-card"

// Workout session components (reusable across workout and history pages)
export { SessionCard as WorkoutSessionCard } from "./workout-session-card"
export { SessionStatusBadge as WorkoutSessionStatusBadge } from "./workout-session-status-badge"
export { SessionDateDisplay as WorkoutSessionDateDisplay } from "./workout-session-date-display"
export { SessionDurationDisplay as WorkoutSessionDurationDisplay } from "./workout-session-duration-display"
export { SessionExerciseCount as WorkoutSessionExerciseCount } from "./workout-session-exercise-count"

export type { Comment, CommentSectionProps } from "./comment-section" 