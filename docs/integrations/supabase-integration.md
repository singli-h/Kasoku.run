# 🗄️ Supabase Integration Guide

This document provides comprehensive guidance for integrating Supabase into the Kasoku application, covering database operations, real-time features, storage, and best practices for secure and efficient data management.

## 📋 Overview

Supabase serves as the primary database and backend service for Kasoku, providing PostgreSQL database, real-time subscriptions, file storage, and serverless functions with seamless integration with Clerk authentication.

## 🛠️ Configuration

### Environment Variables
```bash
# Required Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Custom configurations
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Client Initialization

#### Server-Side Client (Recommended)
```typescript
// lib/supabase-server.ts - Singleton Pattern (2025 Implementation)
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    async accessToken() {
      return (await auth()).getToken()
    },
  }
)

export default supabase

// Usage in server actions:
import supabase from '@/lib/supabase-server'

export async function someAction() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
  
  return { data, error }
}
```

#### Client-Side Client
```typescript
// lib/supabase-client.ts - Client-side singleton
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default supabase

// Usage in components:
import supabase from '@/lib/supabase-client'

export function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      
      if (data) setData(data)
    }
    
    fetchData()
  }, [])
}
```

## 🔐 Authentication Integration

### Clerk + Supabase Setup

The application uses Clerk for authentication with Supabase for data storage. The integration works through JWT tokens:

```typescript
// lib/supabase-server.ts
import { auth } from '@clerk/nextjs/server'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    async accessToken() {
      const { getToken } = await auth()
      return await getToken({ template: 'supabase' })
    },
  }
)
```

### User ID Mapping

```typescript
// lib/user-cache.ts - LRU cache for Clerk → DB user ID mapping
import { LRUCache } from 'lru-cache'
import supabase from './supabase-server'

const cacheOptions = {
  max: 100, // Reasonable size for typical usage
  ttl: 1000 * 60 * 15, // 15 minutes
}

const userCache = new LRUCache<string, number>(cacheOptions)

export async function getDbUserId(clerkId: string): Promise<number> {
  // Check cache first
  const cached = userCache.get(clerkId)
  if (cached) return cached

  // Fetch from database
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !user) {
    throw new Error(`User not found: ${clerkId}`)
  }

  // Cache the result
  userCache.set(clerkId, user.id)
  return user.id
}
```

## 🗃️ Database Operations

### User-Based RLS (Current Implementation)
```typescript
// Current implementation uses direct user-based RLS policies
// All data is user-scoped with proper RLS policies

// Usage in server actions
export async function getUserTrainingSessionsAction() {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  // Query with user-based RLS (automatic filtering via policy)
  const { data, error } = await supabase
    .from('exercise_training_sessions')
    .select('*')
    // RLS policy automatically filters by user

  return { data, error }
}
```

### CRUD Operations

#### Create Operations
```typescript
export async function createTrainingSession(data: ExerciseTrainingSessionInsert) {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { data: session, error } = await supabase
    .from('exercise_training_sessions')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return session
}
```

#### Read Operations
```typescript
export async function getTrainingSessions(filters?: TrainingSessionFilters) {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  let query = supabase
    .from('exercise_training_sessions')
    .select(`
      *,
      athlete:athletes(
        id,
        user:users(id, first_name, last_name, avatar_url)
      ),
      exercise_preset_group:exercise_preset_groups(
        id,
        name,
        description
      )
    `)

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.sessionMode) {
    query = query.eq('session_mode', filters.sessionMode)
  }

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}
```

#### Update Operations
```typescript
export async function updateTrainingSession(id: number, updates: ExerciseTrainingSessionUpdate) {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { data, error } = await supabase
    .from('exercise_training_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

#### Delete Operations
```typescript
export async function deleteTrainingSession(id: number) {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { error } = await supabase
    .from('exercise_training_sessions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

### Complex Joins
```typescript
export async function getTrainingSessionWithDetails(sessionId: number) {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { data, error } = await supabase
    .from('exercise_training_sessions')
    .select(`
      *,
      athlete:athletes(
        id,
        user:users(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      exercise_preset_group:exercise_preset_groups(
        id,
        name,
        description,
        exercise_presets(
          id,
          exercise:exercises(
            id,
            name,
            description,
            video_url
          ),
          exercise_preset_details(
            id,
            reps,
            weight,
            sets,
            rest_time
          )
        )
      ),
      exercise_training_details(
        id,
        completed,
        reps,
        weight,
        power,
        velocity,
        exercise_preset:exercise_presets(
          exercise:exercises(name)
        )
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}
```

### Aggregations
```typescript
export async function getTrainingStats() {
  const supabase = getSupabase() // Using singleton client
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { data, error } = await supabase
    .from('exercise_training_sessions')
    .select(`
      status,
      count:count(*)
    `)
    .groupBy('status')

  if (error) throw error
  return data
}
```

## 🔄 Real-time Features

### Subscriptions
```typescript
// Subscribe to training session updates
export function useTrainingSessionUpdates(sessionId: number) {
  const [session, setSession] = useState(null)
  
  useEffect(() => {
    const channel = supabase
      .channel('training-session-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_training_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          setSession(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return session
}
```

### Live Data Updates
```typescript
// Real-time training session list
export function useLiveTrainingSessions() {
  const [sessions, setSessions] = useState([])
  
  useEffect(() => {
    // Initial fetch
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('exercise_training_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      setSessions(data || [])
    }

    fetchSessions()

    // Subscribe to changes
    const channel = supabase
      .channel('training-sessions-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_training_sessions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => 
              prev.map(session => 
                session.id === payload.new.id ? payload.new : session
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => 
              prev.filter(session => session.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return sessions
}
```

## 📁 File Storage

### Upload Files
```typescript
export async function uploadProfileImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file)

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### Download Files
```typescript
export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) throw error
  return data
}
```

## 🚀 Performance Optimization

### Caching Strategy
```typescript
// lib/user-cache.ts - LRU cache for Clerk → DB user ID mapping
import { LRUCache } from 'lru-cache'
import supabase from './supabase-server'

const cacheOptions = {
  max: 100, // Reasonable size for typical usage
  ttl: 1000 * 60 * 15, // 15 minutes
}

const userCache = new LRUCache<string, number>(cacheOptions)

export async function getDbUserId(clerkId: string): Promise<number> {
  // Check cache first
  const cached = userCache.get(clerkId)
  if (cached) return cached

  // Fetch from database
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !user) {
    throw new Error(`User not found: ${clerkId}`)
  }

  // Cache the result
  userCache.set(clerkId, user.id)
  return user.id
}
```

### Query Optimization
```typescript
// Use specific select clauses instead of select('*')
const { data } = await supabase
  .from('exercise_training_sessions')
  .select('id, status, date_time, notes') // Only needed fields
  .eq('athlete_id', athleteId)

// Use pagination for large datasets
const { data } = await supabase
  .from('exercise_training_sessions')
  .select('*')
  .range(0, 49) // First 50 records
  .order('created_at', { ascending: false })

// Use indexes effectively
const { data } = await supabase
  .from('exercise_training_sessions')
  .select('*')
  .eq('athlete_id', athleteId) // Indexed column
  .eq('status', 'completed') // Indexed column
```

## 🔒 Security Best Practices

### Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE exercise_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own training sessions" ON exercise_training_sessions
  FOR SELECT USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Coaches can access their athletes' data
CREATE POLICY "Coaches can view athlete sessions" ON exercise_training_sessions
  FOR SELECT USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      JOIN athlete_groups ag ON a.athlete_group_id = ag.id
      WHERE ag.coach_id IN (
        SELECT id FROM coaches WHERE user_id = auth.uid()
      )
    )
  );
```

### Input Validation
```typescript
import { z } from 'zod'

const TrainingSessionSchema = z.object({
  athlete_id: z.number().positive(),
  exercise_preset_group_id: z.number().positive(),
  date_time: z.string().datetime(),
  session_mode: z.enum(['individual', 'group']),
  notes: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional()
})

export async function createTrainingSessionAction(input: unknown) {
  // Validate input
  const validatedData = TrainingSessionSchema.parse(input)
  
  // Proceed with database operation
  const { data, error } = await supabase
    .from('exercise_training_sessions')
    .insert(validatedData)
    .select()
    .single()

  if (error) throw error
  return data
}
```

## 🧪 Testing

### Unit Tests
```typescript
// __tests__/training-sessions.test.ts
import { createTrainingSessionAction } from '@/actions/training/training-session-actions'

describe('Training Session Actions', () => {
  it('should create a training session', async () => {
    const sessionData = {
      athlete_id: 1,
      exercise_preset_group_id: 1,
      date_time: '2024-01-01T10:00:00Z',
      session_mode: 'individual',
      notes: 'Test session'
    }

    const result = await createTrainingSessionAction(sessionData)
    
    expect(result.isSuccess).toBe(true)
    expect(result.data).toMatchObject(sessionData)
  })

  it('should return error for invalid data', async () => {
    const invalidData = {
      athlete_id: -1, // Invalid ID
      date_time: 'invalid-date'
    }

    const result = await createTrainingSessionAction(invalidData)
    
    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain('validation')
  })
})
```

### Integration Tests
```typescript
// __tests__/supabase-integration.test.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
)

describe('Supabase Integration', () => {
  it('should connect to database', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should enforce RLS policies', async () => {
    // Test that users can only access their own data
    const { data, error } = await supabase
      .from('exercise_training_sessions')
      .select('*')

    // Should return empty array due to RLS
    expect(data).toEqual([])
    expect(error).toBeNull()
  })
})
```

## 🚨 Error Handling

### Common Error Patterns
```typescript
export async function handleSupabaseError(error: any) {
  if (error.code === 'PGRST116') {
    return { message: 'No data found', code: 'NOT_FOUND' }
  }
  
  if (error.code === '23505') {
    return { message: 'Duplicate entry', code: 'DUPLICATE' }
  }
  
  if (error.code === '23503') {
    return { message: 'Referenced record not found', code: 'FOREIGN_KEY' }
  }
  
  if (error.code === '42501') {
    return { message: 'Access denied', code: 'PERMISSION_DENIED' }
  }
  
  return { message: 'Database error', code: 'UNKNOWN' }
}
```

### Retry Logic
```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (i === maxRetries - 1) {
        throw lastError
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
  
  throw lastError!
}
```

## 📊 Monitoring and Debugging

### Query Performance
```typescript
// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id)
  })
}
```

### Database Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔗 Related Documentation

- [Database Schema](./database-schema.md)
- [API Architecture](../development/api-architecture.md)
- [Security Overview](../security/README.md)
- [Performance Optimization](../development/performance-optimization.md)