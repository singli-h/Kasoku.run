/**
 * Unit tests for user-cache.ts
 * 
 * Tests the LRU cache functionality for Clerk user ID → database user ID mapping
 */

// Simple mock approach to avoid complex Jest typing issues
const mockSingle = jest.fn()
const mockSupabaseQuery = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSingle
      }))
    }))
  }))
}

// Mock the supabase-server module
jest.mock('../lib/supabase-server', () => mockSupabaseQuery)

// Import after mocking
import { 
  getDbUserId, 
  invalidateUserCache, 
  getCacheStats, 
  clearUserCache 
} from '../lib/user-cache'

describe('user-cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearUserCache()
    jest.clearAllMocks()
  })

  describe('getDbUserId', () => {
    it('should query database on cache miss and cache the result', async () => {
      const clerkId = 'clerk_123'
      const dbUserId = 42

      // Mock successful database response
      mockSingle.mockResolvedValue({
        data: { id: dbUserId },
        error: null
      })

      const result = await getDbUserId(clerkId)

      expect(result).toBe(dbUserId)
      expect(mockSupabaseQuery.from).toHaveBeenCalledWith('users')
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })

    it('should return cached result on cache hit without database query', async () => {
      const clerkId = 'clerk_456'
      const dbUserId = 84

      // First call - cache miss
      mockSingle.mockResolvedValue({
        data: { id: dbUserId },
        error: null
      })

      // First call
      const result1 = await getDbUserId(clerkId)
      expect(result1).toBe(dbUserId)
      expect(mockSingle).toHaveBeenCalledTimes(1)

      // Second call - should hit cache
      const result2 = await getDbUserId(clerkId)
      expect(result2).toBe(dbUserId)
      expect(mockSingle).toHaveBeenCalledTimes(1) // No additional DB call
    })

    it('should throw error when user not found (PGRST116)', async () => {
      const clerkId = 'clerk_nonexistent'

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      await expect(getDbUserId(clerkId)).rejects.toThrow(
        'User with Clerk ID clerk_nonexistent not found in database'
      )
    })

    it('should throw error on database error', async () => {
      const clerkId = 'clerk_error'

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Internal server error' }
      })

      await expect(getDbUserId(clerkId)).rejects.toThrow(
        'Database error fetching user: Internal server error'
      )
    })

    it('should throw error when user data is null', async () => {
      const clerkId = 'clerk_null'

      mockSingle.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(getDbUserId(clerkId)).rejects.toThrow(
        'User with Clerk ID clerk_null not found in database'
      )
    })
  })

  describe('cache management', () => {
    it('should invalidate specific user from cache', async () => {
      const clerkId = 'clerk_invalidate'
      const dbUserId = 99

      // Setup mock
      mockSingle.mockResolvedValue({
        data: { id: dbUserId },
        error: null
      })

      // First call - populates cache
      await getDbUserId(clerkId)
      expect(mockSingle).toHaveBeenCalledTimes(1)

      // Second call - hits cache
      await getDbUserId(clerkId)
      expect(mockSingle).toHaveBeenCalledTimes(1)

      // Invalidate cache
      invalidateUserCache(clerkId)

      // Third call - cache miss again
      await getDbUserId(clerkId)
      expect(mockSingle).toHaveBeenCalledTimes(2)
    })

    it('should provide cache statistics', async () => {
      const stats = getCacheStats()
      
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('max')
      expect(stats).toHaveProperty('ttl')
      expect(stats).toHaveProperty('calculatedSize')
      expect(typeof stats.size).toBe('number')
      expect(typeof stats.max).toBe('number')
    })

    it('should clear entire cache', async () => {
      const clerkId = 'clerk_clear'
      const dbUserId = 123

      // Setup mock
      mockSingle.mockResolvedValue({
        data: { id: dbUserId },
        error: null
      })

      // Populate cache
      await getDbUserId(clerkId)
      expect(mockSingle).toHaveBeenCalledTimes(1)

      // Clear cache
      clearUserCache()

      // Should query database again
      await getDbUserId(clerkId)
      expect(mockSingle).toHaveBeenCalledTimes(2)
    })
  })
}) 