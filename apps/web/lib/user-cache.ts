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
import type { Database } from "@/types/database"

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

type UserRole = Database["public"]["Enums"]["role"]

/**
 * LRU cache instance for Clerk ID → User role mapping
 * Automatically cleared in non-production environments
 */
const userRoleCache = new LRUCache<string, UserRole>(cacheOptions)

/**
 * Store interval ID to prevent multiple intervals on hot reload
 * Using globalThis to persist across module reloads
 */
const CACHE_INTERVAL_KEY = Symbol.for('kasoku.user-cache.interval')

/**
 * Clear cache in test environments to prevent cross-test contamination
 * This runs once when the module is first imported
 */
if (process.env.NODE_ENV !== "production") {
  userIdCache.clear()
  userRoleCache.clear()

  // Also clear cache on hot reload in development
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    // Clear any existing interval from previous hot reload
    const existingInterval = (globalThis as any)[CACHE_INTERVAL_KEY]
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Set new interval and store the ID
    const intervalId = setInterval(() => {
      userIdCache.clear()
      userRoleCache.clear()
    }, 1000 * 60 * 5) // Clear every 5 minutes in dev

    ;(globalThis as any)[CACHE_INTERVAL_KEY] = intervalId
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
 * Get user role from Clerk user ID with LRU caching
 * 
 * This function:
 * 1. Checks the LRU cache first
 * 2. If cache miss, queries the database
 * 3. Stores the result in cache for future requests
 * 4. Handles edge cases like deleted users
 * 
 * @param clerkId - The Clerk user ID (from auth().userId)
 * @returns Promise<string> - The user role ('athlete', 'coach', 'individual')
 * @throws Error if user not found or database error
 * 
 * @example
 * ```typescript
 * import { getUserRole } from "@/lib/user-cache"
 * 
 * export async function someAction() {
 *   const { userId } = await auth()
 *   if (!userId) throw new Error("Not authenticated")
 *   
 *   const userRole = await getUserRole(userId)
 *   // Use userRole for role-based logic...
 * }
 * ```
 */
export async function getUserRole(clerkId: string): Promise<Database["public"]["Enums"]["role"]> {
  // Check cache first
  const cached = userRoleCache.get(clerkId)
  if (cached !== undefined) {
    return cached
  }

  // Cache miss - query database
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    // If user not found, don't cache the miss to allow for eventual consistency
    if (error.code === 'PGRST116') {
      throw new Error(`User with Clerk ID ${clerkId} not found in database`)
    }
    throw new Error(`Database error fetching user role: ${error.message}`)
  }

  if (!user) {
    throw new Error(`User with Clerk ID ${clerkId} not found in database`)
  }

  // Store in cache for future requests
  userRoleCache.set(clerkId, user.role)
  
  return user.role
}

/**
 * Get both user ID and role in a single database query for efficiency
 * 
 * @param clerkId - The Clerk user ID (from auth().userId)
 * @returns Promise<{id: number, role: string}> - The database user ID and role
 * @throws Error if user not found or database error
 */
export async function getUserInfo(clerkId: string): Promise<{id: number, role: Database["public"]["Enums"]["role"]}> {
  // Check both caches first
  const cachedId = userIdCache.get(clerkId)
  const cachedRole = userRoleCache.get(clerkId)
  
  if (cachedId !== undefined && cachedRole !== undefined) {
    return { id: cachedId, role: cachedRole }
  }

  // Cache miss - query database
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    // If user not found, don't cache the miss to allow for eventual consistency
    if (error.code === 'PGRST116') {
      throw new Error(`User with Clerk ID ${clerkId} not found in database`)
    }
    throw new Error(`Database error fetching user info: ${error.message}`)
  }

  if (!user) {
    throw new Error(`User with Clerk ID ${clerkId} not found in database`)
  }

  // Store in both caches for future requests
  userIdCache.set(clerkId, user.id)
  userRoleCache.set(clerkId, user.role)
  
  return { id: user.id, role: user.role }
}

/**
 * Manually invalidate a user from the cache
 * Useful when user data changes or for cleanup
 * 
 * @param clerkId - The Clerk user ID to remove from cache
 */
export function invalidateUserCache(clerkId: string): void {
  userIdCache.delete(clerkId)
  userRoleCache.delete(clerkId)
}

/**
 * Get cache statistics for monitoring/debugging
 * 
 * @returns Object with cache stats
 */
export function getCacheStats() {
  return {
    userIdCache: {
      size: userIdCache.size,
      max: userIdCache.max,
      ttl: userIdCache.ttl,
      calculatedSize: userIdCache.calculatedSize,
    },
    userRoleCache: {
      size: userRoleCache.size,
      max: userRoleCache.max,
      ttl: userRoleCache.ttl,
      calculatedSize: userRoleCache.calculatedSize,
    }
  }
}

/**
 * Clear the entire cache
 * Mainly for testing or emergency situations
 */
export function clearUserCache(): void {
  userIdCache.clear()
  userRoleCache.clear()
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