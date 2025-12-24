'use client'

/**
 * ChangeSet Pattern: React Context for Buffer Management
 *
 * Provides a keyed Map buffer with upsert semantics (last-write-wins)
 * for accumulating AI-proposed changes before approval.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 2
 */

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type {
  BufferKey,
  ChangeRequest,
  ChangeSet,
  ChangeSetContextValue,
  ChangeSetStatus,
} from './types'
import {
  generateChangeRequestId,
  generateChangeSetId,
  makeBufferKey,
  resetTempIdCounter,
  sortByExecutionOrder,
} from './buffer-utils'

/**
 * Context for ChangeSet state and operations.
 * Use the useChangeSet hook to access this context.
 */
export const ChangeSetContext = createContext<ChangeSetContextValue | null>(
  null
)

interface ChangeSetProviderProps {
  children: ReactNode
}

/**
 * Provider component for ChangeSet state.
 * Wraps components that need access to the changeset buffer.
 *
 * @example
 * ```tsx
 * <ChangeSetProvider>
 *   <SessionAssistant />
 * </ChangeSetProvider>
 * ```
 */
export function ChangeSetProvider({ children }: ChangeSetProviderProps) {
  // The keyed buffer storing change requests
  const [buffer, setBuffer] = useState<Map<BufferKey, ChangeRequest>>(
    () => new Map()
  )

  // Current status in the state machine
  const [status, setStatus] = useState<ChangeSetStatus | null>(null)

  // Metadata for the changeset
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // ChangeSet ID (generated when first change is added)
  const [changesetId, setChangesetId] = useState<string | null>(null)

  // Tool call ID for stream synchronization (set by confirmChangeSet)
  const [toolCallId, setToolCallId] = useState<string | undefined>(undefined)

  /**
   * Upsert a change request into the buffer.
   * If a request for the same entity already exists, it will be overwritten.
   */
  const upsert = useCallback(
    (request: Omit<ChangeRequest, 'changesetId'>) => {
      setBuffer((prev) => {
        const newBuffer = new Map(prev)

        // Generate changeset ID if this is the first change
        let currentChangesetId = changesetId
        if (!currentChangesetId) {
          currentChangesetId = generateChangeSetId()
          setChangesetId(currentChangesetId)
        }

        // Set status to building if not already set
        setStatus((prevStatus) => prevStatus ?? 'building')

        // Create the key for this request
        const entityId = request.entityId ?? request.id // Use request ID as key for creates
        const key = makeBufferKey(request.entityType, entityId)

        // Add the changeset ID to the request
        const fullRequest: ChangeRequest = {
          ...request,
          changesetId: currentChangesetId,
          id: request.id || generateChangeRequestId(),
          createdAt: request.createdAt || new Date(),
        }

        newBuffer.set(key, fullRequest)
        return newBuffer
      })
    },
    [changesetId]
  )

  /**
   * Remove a change request from the buffer by entity type and ID.
   */
  const remove = useCallback((entityType: string, entityId: string) => {
    setBuffer((prev) => {
      const newBuffer = new Map(prev)
      const key = makeBufferKey(entityType, entityId)
      newBuffer.delete(key)
      return newBuffer
    })
  }, [])

  /**
   * Clear all changes from the buffer and reset state.
   */
  const clear = useCallback(() => {
    setBuffer(new Map())
    setStatus(null)
    setTitle('')
    setDescription('')
    setChangesetId(null)
    setToolCallId(undefined)
    resetTempIdCounter()
  }, [])

  /**
   * Get a snapshot of the current buffer as an array.
   * Changes are sorted by execution order.
   */
  const snapshot = useCallback((): ChangeRequest[] => {
    return sortByExecutionOrder(Array.from(buffer.values()))
  }, [buffer])

  /**
   * Set the changeset metadata (title and description).
   */
  const setMetadata = useCallback((newTitle: string, newDescription: string) => {
    setTitle(newTitle)
    setDescription(newDescription)
  }, [])

  /**
   * Get the count of pending changes.
   */
  const getPendingCount = useCallback((): number => {
    return buffer.size
  }, [buffer])

  /**
   * Get changes filtered by entity type.
   */
  const getChangesByEntity = useCallback(
    (entityType: string): ChangeRequest[] => {
      return Array.from(buffer.values()).filter(
        (req) => req.entityType === entityType
      )
    },
    [buffer]
  )

  /**
   * Check if there are any pending changes.
   */
  const hasPendingChanges = useCallback((): boolean => {
    return buffer.size > 0
  }, [buffer])

  /**
   * Get or create the current changeset ID.
   * This ensures a consistent ID is used across all changes in a session.
   */
  const getOrCreateChangesetId = useCallback((): string => {
    if (changesetId) {
      return changesetId
    }
    const newId = generateChangeSetId()
    setChangesetId(newId)
    return newId
  }, [changesetId])

  /**
   * Build the current ChangeSet object from state.
   */
  const changeset = useMemo((): ChangeSet | null => {
    if (!changesetId || buffer.size === 0) {
      return null
    }

    return {
      id: changesetId,
      status: status ?? 'building',
      source: 'ai',
      title,
      description,
      toolCallId,
      createdAt: new Date(),
      changeRequests: sortByExecutionOrder(Array.from(buffer.values())),
    }
  }, [changesetId, status, title, description, toolCallId, buffer])

  const contextValue = useMemo<ChangeSetContextValue>(
    () => ({
      changeset,
      status,
      upsert,
      remove,
      clear,
      snapshot,
      setStatus,
      setMetadata,
      getPendingCount,
      getChangesByEntity,
      hasPendingChanges,
      getOrCreateChangesetId,
    }),
    [
      changeset,
      status,
      upsert,
      remove,
      clear,
      snapshot,
      setStatus,
      setMetadata,
      getPendingCount,
      getChangesByEntity,
      hasPendingChanges,
      getOrCreateChangesetId,
    ]
  )

  return (
    <ChangeSetContext.Provider value={contextValue}>
      {children}
    </ChangeSetContext.Provider>
  )
}
