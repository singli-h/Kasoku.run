/**
 * ChangeSet Pattern: Error Classification
 *
 * Classifies execution errors for AI recovery strategies.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 8
 */

import type { ErrorType, ExecutionError } from './types'

/**
 * Known error patterns and their classifications.
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string
  type: ErrorType
  code: string
}> = [
  // Transient errors (retry automatically)
  {
    pattern: /network|timeout|connection|ECONNREFUSED|ETIMEDOUT/i,
    type: 'TRANSIENT',
    code: 'NETWORK_ERROR',
  },
  {
    pattern: /database.*locked|deadlock|could not serialize/i,
    type: 'TRANSIENT',
    code: 'DB_LOCKED',
  },
  {
    pattern: /rate.?limit|too many requests|429/i,
    type: 'TRANSIENT',
    code: 'RATE_LIMITED',
  },

  // Logic/data errors (AI can fix)
  {
    pattern: /foreign key|fk_|references/i,
    type: 'LOGIC_DATA',
    code: 'FK_VIOLATION',
  },
  {
    pattern: /unique|duplicate|already exists/i,
    type: 'LOGIC_DATA',
    code: 'DUPLICATE_ENTRY',
  },
  {
    pattern: /not.?found|does not exist|no rows/i,
    type: 'LOGIC_DATA',
    code: 'NOT_FOUND',
  },
  {
    pattern: /validation|invalid|constraint/i,
    type: 'LOGIC_DATA',
    code: 'VALIDATION_ERROR',
  },
  {
    pattern: /permission|unauthorized|forbidden|403/i,
    type: 'LOGIC_DATA',
    code: 'PERMISSION_DENIED',
  },

  // Stale state (refresh and retry)
  {
    pattern: /optimistic|concurrency|version|modified|stale/i,
    type: 'STALE_STATE',
    code: 'STALE_DATA',
  },
  {
    pattern: /updated_at|conflict|concurrent/i,
    type: 'STALE_STATE',
    code: 'CONCURRENT_MODIFICATION',
  },
]

/**
 * Classifies an error into one of the recovery categories.
 *
 * Categories:
 * - TRANSIENT: Network/timeout issues - auto-retry
 * - LOGIC_DATA: FK/constraint violations - AI can fix
 * - STALE_STATE: Optimistic lock failures - refresh and retry
 * - CRITICAL: Internal errors - abort and notify user
 *
 * @param error - The error to classify
 * @param requestIndex - Index of the failed request (default 0)
 * @returns Classified ExecutionError
 */
export function classifyError(
  error: unknown,
  requestIndex: number = 0
): ExecutionError {
  const message = getErrorMessage(error)

  // Check against known patterns
  for (const { pattern, type, code } of ERROR_PATTERNS) {
    const matches =
      typeof pattern === 'string'
        ? message.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(message)

    if (matches) {
      return {
        type,
        code,
        message,
        failedRequestIndex: requestIndex,
      }
    }
  }

  // Default to CRITICAL for unknown errors
  return {
    type: 'CRITICAL',
    code: 'UNKNOWN_ERROR',
    message,
    failedRequestIndex: requestIndex,
  }
}

/**
 * Extracts error message from various error types.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    // Supabase error format
    if ('message' in error) {
      return String((error as { message: unknown }).message)
    }
    // API error format
    if ('error' in error) {
      return String((error as { error: unknown }).error)
    }
  }

  return 'Unknown error'
}

/**
 * Determines if an error type is recoverable by the AI.
 *
 * @param type - The error type
 * @returns true if the AI should attempt recovery
 */
export function isRecoverableError(type: ErrorType): boolean {
  return type !== 'CRITICAL'
}

/**
 * Determines if an error should be auto-retried.
 *
 * @param type - The error type
 * @returns true if the system should auto-retry
 */
export function shouldAutoRetry(type: ErrorType): boolean {
  return type === 'TRANSIENT'
}

/**
 * Gets the recovery strategy for an error type.
 *
 * @param type - The error type
 * @returns Description of the recovery strategy
 */
export function getRecoveryStrategy(type: ErrorType): string {
  switch (type) {
    case 'TRANSIENT':
      return 'Wait briefly and retry the operation automatically.'

    case 'LOGIC_DATA':
      return 'Review the error and correct the data in your next proposal.'

    case 'STALE_STATE':
      return 'The data has changed. Refresh and re-propose with current data.'

    case 'CRITICAL':
      return 'An unexpected error occurred. Please try again or contact support.'

    default:
      return 'Unknown error type.'
  }
}

/**
 * Formats an ExecutionError for display to the user.
 *
 * @param error - The execution error
 * @returns User-friendly error message
 */
export function formatErrorForUser(error: ExecutionError): string {
  switch (error.type) {
    case 'TRANSIENT':
      return 'A temporary error occurred. Please try again in a moment.'

    case 'LOGIC_DATA':
      return `Unable to save: ${error.message}`

    case 'STALE_STATE':
      return 'The session was modified elsewhere. Please refresh and try again.'

    case 'CRITICAL':
      return 'Something went wrong. Please try again or contact support.'

    default:
      return error.message
  }
}

/**
 * Formats an ExecutionError for the AI to understand.
 *
 * @param error - The execution error
 * @returns Error context for AI
 */
export function formatErrorForAI(error: ExecutionError): string {
  return `
Error Type: ${error.type}
Error Code: ${error.code}
Message: ${error.message}
Failed Request Index: ${error.failedRequestIndex}
Recovery Strategy: ${getRecoveryStrategy(error.type)}
`.trim()
}
