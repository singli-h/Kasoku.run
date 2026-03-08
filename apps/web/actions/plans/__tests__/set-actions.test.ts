import {
  updateSessionPlanSetAction,
  deleteSessionPlanSetAction,
  addSessionPlanSetAction,
} from '../set-actions'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/user-cache', () => ({
  getDbUserId: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Build a chainable Supabase mock where every method returns `this`
// except terminal methods (.single(), .limit(), etc.) which resolve per-test.
function createChainableMock() {
  const chain: Record<string, jest.Mock> = {}

  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit', 'single']
  for (const m of methods) {
    chain[m] = jest.fn()
  }

  // Non-terminal methods return the chain itself
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    chain[m].mockReturnValue(chain)
  }

  // Terminal methods (.single(), .limit()) must be configured per test
  // via mockResolvedValueOnce so they default to undefined (will cause tests to
  // fail visibly if not set up).
  return chain
}

const mockFrom = jest.fn()
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: { from: (...args: unknown[]) => mockFrom(...args) },
}))

import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import { revalidatePath } from 'next/cache'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockGetDbUserId = getDbUserId as jest.MockedFunction<typeof getDbUserId>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'clerk_user_abc'
const DB_USER_ID = 42

/** Standard authenticated-user setup shared by most tests. */
function authenticateUser() {
  mockAuth.mockResolvedValue({ userId: CLERK_USER_ID } as never)
  mockGetDbUserId.mockResolvedValue(DB_USER_ID)
}

/** A minimal session_plan_sets Row for assertions. */
const MOCK_SET_ROW = {
  id: 'set-1',
  session_plan_exercise_id: 'ex-1',
  set_index: 1,
  reps: 10,
  weight: null,
  resistance: null,
  resistance_unit_id: null,
  effort: null,
  performing_time: null,
  rest_time: null,
  rpe: null,
  tempo: null,
  distance: null,
  height: null,
  velocity: null,
  power: null,
  metadata: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// updateSessionPlanSetAction
// ============================================================================

describe('updateSessionPlanSetAction', () => {
  it('returns unauthenticated error when auth() yields no userId', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never)

    const result = await updateSessionPlanSetAction('set-1', { reps: 10 })

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('User not authenticated')
    // Supabase should never be called
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns access-denied error when ownership verification fails', async () => {
    authenticateUser()

    // Ownership check: from('session_plan_sets')...single() returns error
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const result = await updateSessionPlanSetAction('set-999', { reps: 5 })

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('Set not found or access denied')
  })

  it('updates a field successfully and revalidates the path', async () => {
    authenticateUser()

    // 1st from() call: ownership verification succeeds
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: {
        id: 'set-1',
        session_plan_exercises: {
          id: 'ex-1',
          session_plans: { user_id: DB_USER_ID },
        },
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    // 2nd from() call: the actual update
    const updateChain = createChainableMock()
    updateChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, reps: 10 },
      error: null,
    })
    mockFrom.mockReturnValueOnce(updateChain)

    const result = await updateSessionPlanSetAction('set-1', { reps: 10 })

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe('Set updated successfully')
    expect(result.data).toMatchObject({ id: 'set-1', reps: 10 })

    // Verify the update chain was called correctly
    expect(updateChain.update).toHaveBeenCalledWith({ reps: 10 })
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'set-1')

    // Verify revalidation
    expect(mockRevalidatePath).toHaveBeenCalledWith('/plans/[id]', 'page')
  })

  it('converts camelCase field names to snake_case', async () => {
    authenticateUser()

    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: {
        id: 'set-1',
        session_plan_exercises: {
          id: 'ex-1',
          session_plans: { user_id: DB_USER_ID },
        },
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const updateChain = createChainableMock()
    updateChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, performing_time: 60 },
      error: null,
    })
    mockFrom.mockReturnValueOnce(updateChain)

    await updateSessionPlanSetAction('set-1', { performingTime: 60 })

    // Should have converted to snake_case
    expect(updateChain.update).toHaveBeenCalledWith({ performing_time: 60 })
  })

  it('converts effort from 0-100 to 0-1', async () => {
    authenticateUser()

    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: {
        id: 'set-1',
        session_plan_exercises: {
          id: 'ex-1',
          session_plans: { user_id: DB_USER_ID },
        },
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const updateChain = createChainableMock()
    updateChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, effort: 0.75 },
      error: null,
    })
    mockFrom.mockReturnValueOnce(updateChain)

    await updateSessionPlanSetAction('set-1', { effort: 75 })

    expect(updateChain.update).toHaveBeenCalledWith({ effort: 0.75 })
  })
})

// ============================================================================
// deleteSessionPlanSetAction
// ============================================================================

describe('deleteSessionPlanSetAction', () => {
  it('returns unauthenticated error when auth() yields no userId', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never)

    const result = await deleteSessionPlanSetAction('set-1')

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('User not authenticated')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns access-denied error when ownership verification fails', async () => {
    authenticateUser()

    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const result = await deleteSessionPlanSetAction('set-999')

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('Set not found or access denied')
  })

  it('deletes a set successfully and revalidates the path', async () => {
    authenticateUser()

    // 1st from(): ownership verification succeeds
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: {
        id: 'set-1',
        session_plan_exercises: {
          id: 'ex-1',
          session_plans: { user_id: DB_USER_ID },
        },
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    // 2nd from(): the actual delete
    const deleteChain = createChainableMock()
    // delete().eq() is the terminal call here (no .single())
    deleteChain.eq.mockResolvedValueOnce({ error: null })
    mockFrom.mockReturnValueOnce(deleteChain)

    const result = await deleteSessionPlanSetAction('set-1')

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe('Set deleted successfully')
    expect(result.data).toBe(true)

    expect(deleteChain.delete).toHaveBeenCalled()
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'set-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/plans/[id]', 'page')
  })
})

// ============================================================================
// addSessionPlanSetAction
// ============================================================================

describe('addSessionPlanSetAction', () => {
  it('returns unauthenticated error when auth() yields no userId', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never)

    const result = await addSessionPlanSetAction('ex-1')

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('User not authenticated')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns access-denied error when exercise ownership fails', async () => {
    authenticateUser()

    // Exercise ownership check: from('session_plan_exercises')...single() fails
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const result = await addSessionPlanSetAction('ex-999')

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('Exercise not found or access denied')
  })

  it('adds a set with correct set_index and revalidates', async () => {
    authenticateUser()

    // 1st from(): exercise ownership verification succeeds
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: {
        id: 'ex-1',
        session_plans: { user_id: DB_USER_ID },
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    // 2nd from(): fetch existing sets to find max set_index
    const fetchChain = createChainableMock()
    // limit() is the terminal call for this query
    fetchChain.limit.mockResolvedValueOnce({
      data: [{ set_index: 2 }],
      error: null,
    })
    mockFrom.mockReturnValueOnce(fetchChain)

    // 3rd from(): the actual insert
    const insertChain = createChainableMock()
    insertChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, id: 'set-new', set_index: 3, session_plan_exercise_id: 'ex-1' },
      error: null,
    })
    mockFrom.mockReturnValueOnce(insertChain)

    const result = await addSessionPlanSetAction('ex-1')

    expect(result.isSuccess).toBe(true)
    expect(result.message).toBe('Set added successfully')
    expect(result.data).toMatchObject({ id: 'set-new', set_index: 3 })

    // Verify the insert was called with set_index = maxExisting + 1
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_plan_exercise_id: 'ex-1',
        set_index: 3,
      })
    )

    expect(mockRevalidatePath).toHaveBeenCalledWith('/plans/[id]', 'page')
  })

  it('assigns set_index 1 when no existing sets', async () => {
    authenticateUser()

    // Ownership OK
    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: { id: 'ex-1', session_plans: { user_id: DB_USER_ID } },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    // No existing sets
    const fetchChain = createChainableMock()
    fetchChain.limit.mockResolvedValueOnce({ data: [], error: null })
    mockFrom.mockReturnValueOnce(fetchChain)

    // Insert
    const insertChain = createChainableMock()
    insertChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, id: 'set-first', set_index: 1, session_plan_exercise_id: 'ex-1' },
      error: null,
    })
    mockFrom.mockReturnValueOnce(insertChain)

    const result = await addSessionPlanSetAction('ex-1')

    expect(result.isSuccess).toBe(true)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ set_index: 1 })
    )
  })

  it('normalizes setData fields (camelCase + effort) before insert', async () => {
    authenticateUser()

    const ownershipChain = createChainableMock()
    ownershipChain.single.mockResolvedValueOnce({
      data: { id: 'ex-1', session_plans: { user_id: DB_USER_ID } },
      error: null,
    })
    mockFrom.mockReturnValueOnce(ownershipChain)

    const fetchChain = createChainableMock()
    fetchChain.limit.mockResolvedValueOnce({ data: [{ set_index: 1 }], error: null })
    mockFrom.mockReturnValueOnce(fetchChain)

    const insertChain = createChainableMock()
    insertChain.single.mockResolvedValueOnce({
      data: { ...MOCK_SET_ROW, id: 'set-norm' },
      error: null,
    })
    mockFrom.mockReturnValueOnce(insertChain)

    await addSessionPlanSetAction('ex-1', { restTime: 90, effort: 80 })

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rest_time: 90,
        effort: 0.8,
        set_index: 2,
        session_plan_exercise_id: 'ex-1',
      })
    )
  })
})
