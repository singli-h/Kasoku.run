/*
<ai_context>
Sessions feature components index - exports all sprint session components
for the enhanced SprintSessionDashboard with mobile-responsive design.
</ai_context>
*/

// Main dashboard component
export { SprintSessionDashboard } from './components/sprint-session-dashboard'

// Core session components
export { default as MultiGroupSprintTable } from './components/multi-group-sprint-table'
export { GroupSprintSection } from './components/group-sprint-section'
export { AthleteSprintRow } from './components/athlete-sprint-row'

// Management components
export { default as SprintDistanceManager } from './components/sprint-distance-manager'
export { default as SessionSetup } from './components/session-setup'

// Legacy components (for backwards compatibility)
export { GroupSessionDashboard } from './components/group-session-dashboard'
export { AthleteTimeCell } from './components/athlete-time-cell' 