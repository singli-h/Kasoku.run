/**
 * Sessions Feature Hooks
 * Re-exports all session hooks for convenient importing
 *
 * React Query hooks (recommended):
 * - useSession, useGroupSessionData, useSessionsToday, useSessions
 * - useSessionMutations, useSessionPrefetch, useSessionCache
 *
 * Legacy hooks (for backward compatibility):
 * - useAutoSave, useSessionData
 */

// React Query hooks (recommended)
export {
  useSession,
  useGroupSessionData,
  useSessionsToday,
  useSessions,
  useSessionMutations,
  useSessionPrefetch,
  useSessionCache,
} from './use-session-queries'

// Legacy hooks (for backward compatibility)
export { useAutoSave } from './use-auto-save'
export { useSessionData } from './use-session-data'
export type { SessionData } from './use-session-data'
