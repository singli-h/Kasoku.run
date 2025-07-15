/**
 * @jest-environment node
 */

import { getTrainingPlansAction } from '@/actions/training'

// Mock the auth function
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id'
  }))
}))

// Mock the user cache
jest.mock('@/lib/user-cache', () => ({
  getDbUserId: jest.fn(() => Promise.resolve(1))
}))

// Mock the Supabase client
jest.mock('@/lib/supabase-server', () => ({
  createServerAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                {
                  id: 1,
                  name: 'Test Plan',
                  description: 'Test Description',
                  session_mode: 'individual',
                  date: '2024-01-01',
                  week: 1,
                  day: 1,
                  user_id: 1,
                  is_template: false,
                  created_at: '2024-01-01T00:00:00Z'
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}))

describe('Training Plans Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTrainingPlansAction', () => {
    it('should return training plans successfully', async () => {
      const result = await getTrainingPlansAction()
      
      expect(result.isSuccess).toBe(true)
      expect(result.message).toBe('Training plans fetched successfully')
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        name: 'Test Plan',
        description: 'Test Description',
        session_mode: 'individual'
      })
    })

    it('should handle unauthenticated user', async () => {
      const authMock = jest.requireMock('@clerk/nextjs/server')
      authMock.auth.mockReturnValueOnce({ userId: null })
      
      const result = await getTrainingPlansAction()
      
      expect(result.isSuccess).toBe(false)
      expect(result.message).toBe('User not authenticated')
    })
  })
}) 