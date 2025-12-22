/**
 * ChangeSet Pattern: Core Type Definitions
 *
 * This file defines the foundational types for the ChangeSet pattern,
 * which implements human-in-the-loop AI workflows with proposal → approval → execution.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md
 */

/**
 * Status of a ChangeSet as it moves through the state machine.
 *
 * State flow:
 * building → pending_approval → executing → approved/execution_failed
 *                           ↘ rejected
 */
export type ChangeSetStatus =
  | 'building' // AI accumulating changes in keyed buffer
  | 'pending_approval' // Awaiting user decision, AI stream paused
  | 'executing' // Operations being applied atomically
  | 'approved' // Successfully applied (final)
  | 'execution_failed' // Rolled back due to error
  | 'rejected' // User rejected completely (final)

/**
 * Operation types for database mutations.
 * Maps directly to SQL operations: INSERT, UPDATE, DELETE.
 */
export type OperationType = 'create' | 'update' | 'delete'

/**
 * A single atomic operation within a ChangeSet.
 * Represents one proposed database mutation.
 */
export interface ChangeRequest {
  /** Unique identifier for this request (ULID or UUID) */
  id: string

  /** Parent ChangeSet this request belongs to */
  changesetId: string

  /** The database operation to perform */
  operationType: OperationType

  /**
   * Domain-specific entity type being modified.
   * For Session Assistant V1: 'preset_session' | 'preset_exercise' | 'preset_set'
   */
  entityType: string

  /**
   * ID of the entity being modified.
   * - null for creates (assigned after insertion)
   * - Required for updates and deletes
   * - Temp IDs (e.g., "temp_abc123") used for creates in the buffer
   */
  entityId: string | null

  /**
   * Snapshot of entity state before the change.
   * - null for creates
   * - Used for optimistic concurrency checks on updates/deletes
   */
  currentData: Record<string, unknown> | null

  /**
   * The data to apply.
   * - Full object for creates
   * - Changed fields only for updates
   * - null for deletes
   */
  proposedData: Record<string, unknown> | null

  /**
   * Order in which this operation should be executed.
   * Lower numbers execute first. Used for dependency ordering.
   */
  executionOrder: number

  /** AI's explanation for why this change was proposed */
  aiReasoning?: string

  /** When this request was created */
  createdAt: Date
}

/**
 * A batch of proposed changes awaiting user approval.
 * Contains multiple ChangeRequests that will be applied atomically.
 */
export interface ChangeSet {
  /** Unique identifier for this changeset (ULID or UUID) */
  id: string

  /** Current status in the state machine */
  status: ChangeSetStatus

  /** Whether changes were proposed by AI or created manually */
  source: 'ai' | 'manual'

  /** Short summary of the changes (e.g., "Add 2 exercises") */
  title: string

  /** Detailed explanation of the changes */
  description: string

  /**
   * Vercel AI SDK tool call ID for stream synchronization.
   * Used to pause/resume the AI stream during approval flow.
   */
  toolCallId?: string

  /** When this changeset was created */
  createdAt: Date

  /** When user made their decision (approve/reject) */
  reviewedAt?: Date

  /** Reason provided when user rejected the changeset */
  rejectionReason?: string

  /** The individual change requests in this batch */
  changeRequests: ChangeRequest[]
}

/**
 * Result of executing a ChangeSet.
 */
export interface ExecutionResult {
  /** Whether execution succeeded */
  status: 'approved' | 'execution_failed'

  /** Error details if execution failed */
  error?: ExecutionError

  /** Mapping of temp IDs to real IDs after creates */
  idMappings?: Record<string, string>
}

/**
 * Classification of execution errors for AI recovery.
 */
export type ErrorType =
  | 'TRANSIENT' // Network timeout, DB locked - auto-retry
  | 'LOGIC_DATA' // FK violation, unique constraint - AI can correct
  | 'STALE_STATE' // Optimistic lock failed - refresh and re-propose
  | 'CRITICAL' // Internal error - abort, notify user

/**
 * Structured error information for execution failures.
 */
export interface ExecutionError {
  /** Classification for recovery strategy */
  type: ErrorType

  /** Machine-readable error code */
  code: string

  /** Human-readable error message */
  message: string

  /** Index of the failed request in the changeRequests array */
  failedRequestIndex: number

  /** ID of the entity that caused the failure */
  entityId?: string
}

/**
 * Buffer key format for the keyed map.
 * Format: "{entityType}:{entityId}"
 */
export type BufferKey = `${string}:${string}`

/**
 * Result of a tool call handler.
 * 'PAUSE' signals that the AI stream should be paused (for confirmChangeSet).
 */
export type ToolHandlerResult =
  | { success: true; changeId?: string; message?: string }
  | { success: false; error: string }
  | 'PAUSE'

/**
 * Entity types supported in Session Assistant V1 (Coach domain).
 */
export type SessionEntityType = 'preset_session' | 'preset_exercise' | 'preset_set'

/**
 * UI display types derived from operation types.
 * Provides more granular visualization for users.
 *
 * Mapping:
 * - create → 'add'
 * - update (exercise_id changed) → 'swap'
 * - update (other fields) → 'update'
 * - delete → 'remove'
 */
export type UIDisplayType = 'add' | 'swap' | 'update' | 'remove'

/**
 * Props for the approval banner component.
 */
export interface ApprovalBannerProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Called when user approves all changes */
  onApprove: () => Promise<void>

  /** Called when user wants AI to regenerate with feedback */
  onRegenerate: (feedback?: string) => void

  /** Called when user dismisses/rejects all changes */
  onDismiss: () => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Execution error if any */
  executionError?: ExecutionError
}

/**
 * Context value provided by ChangeSetContext.
 */
export interface ChangeSetContextValue {
  /** Current changeset state */
  changeset: ChangeSet | null

  /** Current status for quick access */
  status: ChangeSetStatus | null

  /** Add or update a change request in the buffer (upsert) */
  upsert: (request: Omit<ChangeRequest, 'changesetId'>) => void

  /** Remove a change request from the buffer by key */
  remove: (entityType: string, entityId: string) => void

  /** Clear all changes from the buffer */
  clear: () => void

  /** Get a snapshot of the current buffer for submission */
  snapshot: () => ChangeRequest[]

  /** Set the changeset status */
  setStatus: (status: ChangeSetStatus) => void

  /** Set title and description for the changeset */
  setMetadata: (title: string, description: string) => void

  /** Get count of pending changes */
  getPendingCount: () => number

  /** Get changes filtered by entity type */
  getChangesByEntity: (entityType: string) => ChangeRequest[]

  /** Check if there are any pending changes */
  hasPendingChanges: () => boolean
}
