/*
<ai_context>
LRU cache for Clerk user ID → database user ID mapping.
This eliminates the repeated "SELECT id FROM users WHERE clerk_id = ?" query
that happens in virtually every server action after user authentication.

The cache is process-local (per Node worker) and automatically clears in test environments
to prevent stale data issues.

SERVERLESS CAVEATS:
This cache is in-memory and process-local. In a serverless environment (like Vercel), 
each function invocation can be a cold start, resulting in an empty cache. The cache is
most effective for "warm" functions handling multiple requests but do not assume
persistence between different serverless function invocations or across different regions.
</ai_context>
*/

import { LRUCache } from "lru-cache"
import supabase from "./supabase-server"

/**
 * Cache configuration
 * - max: 100 entries (plenty for typical usage patterns)
 * - ttl: 15 minutes (balance between performance and data freshness)
 * - Auto-clear in test environments to prevent stale data
 */
const cacheOptions = {
  max: 100,
  ttl: 1000 * 60 * 15, // 15 minutes
}

/**
 * LRU cache instance for Clerk ID → DB user ID mapping
 * Automatically cleared in non-production environments
 */
const userIdCache = new LRUCache<string, number>(cacheOptions)

/**
 * Clear cache in test environments to prevent cross-test contamination
 * This runs once when the module is first imported
 */
if (process.env.NODE_ENV !== "production") {
  userIdCache.clear()
  
  // Also clear cache on hot reload in development
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    // In development, clear cache periodically to ensure fresh data
    setInterval(() => {
      userIdCache.clear()
    }, 1000 * 60 * 5) // Clear every 5 minutes in dev
  }
}

/**
 * Get database user ID from Clerk user ID with LRU caching
 * 
 * This function:
 * 1. Checks the LRU cache first
 * 2. If cache miss, queries the database
 * 3. Stores the result in cache for future requests
 * 4. Handles edge cases like deleted users
 * 
 * @param clerkId - The Clerk user ID (from auth().userId)
 * @returns Promise<number> - The database user ID
 * @throws Error if user not found or database error
 * 
 * @example
 * ```typescript
 * import { getDbUserId } from "@/lib/user-cache"
 * 
 * export async function someAction() {
 *   const { userId } = await auth()
 *   if (!userId) throw new Error("Not authenticated")
 *   
 *   const dbUserId = await getDbUserId(userId)
 *   // Use dbUserId in your queries...
 * }
 * ```
 */
export async function getDbUserId(clerkId: string): Promise<number> {
  // Check cache first
  const cached = userIdCache.get(clerkId)
  if (cached !== undefined) {
    return cached
  }

  // Cache miss - query database
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    // If user not found, don't cache the miss to allow for eventual consistency
    if (error.code === 'PGRST116') {
      throw new Error(`User with Clerk ID ${clerkId} not found in database`)
    }
    throw new Error(`Database error fetching user: ${error.message}`)
  }

  if (!user) {
    throw new Error(`User with Clerk ID ${clerkId} not found in database`)
  }

  // Store in cache for future requests
  userIdCache.set(clerkId, user.id)
  
  return user.id
}

/**
 * Manually invalidate a user from the cache
 * Useful when user data changes or for cleanup
 * 
 * @param clerkId - The Clerk user ID to remove from cache
 */
export function invalidateUserCache(clerkId: string): void {
  userIdCache.delete(clerkId)
}

/**
 * Get cache statistics for monitoring/debugging
 * 
 * @returns Object with cache stats
 */
export function getCacheStats() {
  return {
    size: userIdCache.size,
    max: userIdCache.max,
    ttl: userIdCache.ttl,
    calculatedSize: userIdCache.calculatedSize,
  }
}

/**
 * Clear the entire cache
 * Mainly for testing or emergency situations
 */
export function clearUserCache(): void {
  userIdCache.clear()
}

/**
 * Type definitions for better TypeScript support
 */
export interface UserCacheStats {
  size: number
  max: number
  ttl: number | undefined
  calculatedSize: number
} 