import {
  makeBufferKey,
  parseBufferKey,
  generateTempId,
  isTempId,
  stripTempPrefix,
  generateChangeRequestId,
  generateChangeSetId,
  getEntityTypeFromKey,
  getEntityIdFromKey,
  sortByExecutionOrder,
  resetTempIdCounter,
  getTempIdCounter,
} from './buffer-utils'
import type { BufferKey } from './types'

// ============================================================================
// makeBufferKey
// ============================================================================

describe('makeBufferKey', () => {
  it('creates key in "entityType:entityId" format', () => {
    expect(makeBufferKey('session_plan_exercise', '123')).toBe('session_plan_exercise:123')
  })

  it('works with temp IDs', () => {
    const key = makeBufferKey('session_plan_exercise', 'temp-550e8400-e29b-41d4-a716-446655440000')
    expect(key).toBe('session_plan_exercise:temp-550e8400-e29b-41d4-a716-446655440000')
  })

  it('works with UUID entity IDs', () => {
    const key = makeBufferKey('session_plan', '550e8400-e29b-41d4-a716-446655440000')
    expect(key).toContain('session_plan:')
    expect(key).toContain('550e8400')
  })
})

// ============================================================================
// parseBufferKey
// ============================================================================

describe('parseBufferKey', () => {
  it('parses a valid buffer key', () => {
    const result = parseBufferKey('session_plan_exercise:123' as BufferKey)
    expect(result).toEqual({
      entityType: 'session_plan_exercise',
      entityId: '123',
    })
  })

  it('handles entity IDs containing colons (like composite keys)', () => {
    // parseBufferKey splits on FIRST colon only
    const result = parseBufferKey('session_plan_set:exercise:abc:set:2' as BufferKey)
    expect(result).toEqual({
      entityType: 'session_plan_set',
      entityId: 'exercise:abc:set:2',
    })
  })

  it('throws for key without colon', () => {
    expect(() => parseBufferKey('invalid_key' as BufferKey)).toThrow('Invalid buffer key format')
  })

  it('handles temp IDs in entity ID portion', () => {
    const result = parseBufferKey('session_plan_exercise:temp-550e8400' as BufferKey)
    expect(result.entityId).toBe('temp-550e8400')
  })
})

// ============================================================================
// generateTempId
// ============================================================================

describe('generateTempId', () => {
  it('starts with "temp-" prefix', () => {
    const id = generateTempId()
    expect(id).toMatch(/^temp-/)
  })

  it('contains a UUID after the prefix', () => {
    const id = generateTempId()
    const uuid = id.replace('temp-', '')
    // UUID v4 pattern: 8-4-4-4-12 hex characters
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTempId()))
    expect(ids.size).toBe(100)
  })
})

// ============================================================================
// isTempId
// ============================================================================

describe('isTempId', () => {
  it('returns true for temp IDs', () => {
    expect(isTempId('temp-550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('returns false for regular UUIDs', () => {
    expect(isTempId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isTempId(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isTempId(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isTempId('')).toBe(false)
  })

  it('returns true for minimal temp- prefix', () => {
    expect(isTempId('temp-')).toBe(true)
  })
})

// ============================================================================
// stripTempPrefix
// ============================================================================

describe('stripTempPrefix', () => {
  it('removes temp- prefix', () => {
    expect(stripTempPrefix('temp-550e8400-e29b-41d4-a716-446655440000'))
      .toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('returns unchanged string if no temp- prefix', () => {
    expect(stripTempPrefix('550e8400-e29b-41d4-a716-446655440000'))
      .toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('only removes the first temp- prefix', () => {
    expect(stripTempPrefix('temp-temp-abc')).toBe('temp-abc')
  })
})

// ============================================================================
// generateChangeRequestId / generateChangeSetId
// ============================================================================

describe('generateChangeRequestId', () => {
  it('starts with "cr_" prefix', () => {
    expect(generateChangeRequestId()).toMatch(/^cr_/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateChangeRequestId()))
    expect(ids.size).toBe(50)
  })
})

describe('generateChangeSetId', () => {
  it('starts with "cs_" prefix', () => {
    expect(generateChangeSetId()).toMatch(/^cs_/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateChangeSetId()))
    expect(ids.size).toBe(50)
  })
})

// ============================================================================
// getEntityTypeFromKey / getEntityIdFromKey
// ============================================================================

describe('getEntityTypeFromKey', () => {
  it('extracts entity type from buffer key', () => {
    expect(getEntityTypeFromKey('session_plan_exercise:123' as BufferKey)).toBe('session_plan_exercise')
  })
})

describe('getEntityIdFromKey', () => {
  it('extracts entity ID from buffer key', () => {
    expect(getEntityIdFromKey('session_plan_exercise:123' as BufferKey)).toBe('123')
  })

  it('preserves composite entity IDs', () => {
    expect(getEntityIdFromKey('session_plan_set:exercise:abc:set:2' as BufferKey))
      .toBe('exercise:abc:set:2')
  })
})

// ============================================================================
// sortByExecutionOrder
// ============================================================================

describe('sortByExecutionOrder', () => {
  it('sorts by execution order ascending', () => {
    const items = [
      { executionOrder: 3, name: 'third' },
      { executionOrder: 1, name: 'first' },
      { executionOrder: 2, name: 'second' },
    ]
    const sorted = sortByExecutionOrder(items)
    expect(sorted.map(i => i.name)).toEqual(['first', 'second', 'third'])
  })

  it('does not mutate the input array', () => {
    const items = [
      { executionOrder: 2, name: 'b' },
      { executionOrder: 1, name: 'a' },
    ]
    const original = [...items]
    sortByExecutionOrder(items)
    expect(items.map(i => i.name)).toEqual(original.map(i => i.name))
  })

  it('handles empty array', () => {
    expect(sortByExecutionOrder([])).toEqual([])
  })

  it('handles single item', () => {
    const items = [{ executionOrder: 1 }]
    expect(sortByExecutionOrder(items)).toEqual([{ executionOrder: 1 }])
  })
})

// ============================================================================
// Deprecated functions (backward compatibility)
// ============================================================================

describe('deprecated functions', () => {
  it('resetTempIdCounter is a no-op', () => {
    expect(() => resetTempIdCounter()).not.toThrow()
  })

  it('getTempIdCounter always returns 0', () => {
    expect(getTempIdCounter()).toBe(0)
  })
})