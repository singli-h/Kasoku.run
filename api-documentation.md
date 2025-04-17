# API Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Components](#key-components)
3. [Standard Patterns](#standard-patterns)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Implementation Checklist](#implementation-checklist)
6. [Response Format Standards](#response-format-standards)
7. [Common Data Transformation Patterns](#common-data-transformation-patterns)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Performance Optimization](#performance-optimization)
11. [Security Considerations](#security-considerations)
12. [Maintainability Guidelines](#maintainability-guidelines)
13. [Testing Procedures](#testing-procedures)
14. [Troubleshooting](#troubleshooting)

## Architecture Overview

This application follows an n-tier architecture:

```
Frontend Components
      ↓
Next.js API Routes
      ↓
Edge Functions Client
      ↓
Supabase Edge Functions
      ↓
Database
```

## Key Components

### 1. Edge Functions Client (`apps/web/src/lib/edge-functions.js`)

The Edge Functions Client is a wrapper utility that provides standardized methods for communicating with the backend Supabase Edge Functions.

#### Core Features:
- Custom error handling via `EdgeFunctionError` class
- Standardized request/response formatting
- Authentication with Supabase
- Logging and error reporting
- Domain-specific API methods organization

#### Structure:
```javascript
export const edgeFunctions = {
  // Domain-specific APIs
  [domain]: {
    getAll: () => fetchFromEdgeFunction("/api/[domain]"),
    getById: (id) => fetchFromEdgeFunction(`/api/[domain]/${id}`),
    create: (data) => fetchFromEdgeFunction("/api/[domain]", {
      method: "POST",
      body: data
    }),
    update: (id, data) => fetchFromEdgeFunction(`/api/[domain]/${id}`, {
      method: "PUT",
      body: data
    }),
    delete: (id) => fetchFromEdgeFunction(`/api/[domain]/${id}`, {
      method: "DELETE"
    }),
    // Domain-specific methods...
  },
  // Other domains...
};
```

### 2. Next.js Dynamic API Proxy (`apps/web/src/app/api/[...slug]/route.ts`)

All FE API calls are now handled by a single dynamic catch‑all route. This proxy:
- Authenticates requests with Clerk (`auth()`).
- Forwards `/api/<path>` to Supabase Edge Functions via Service Role key.
- Eliminates the need for individual route files under `/app/api`.

Structure (simplified):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

async function proxy(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) { /* auth + fetch logic */ }

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
```

### 3. Supabase Edge Functions (`apps/edge-functions/supabase/functions/api/*`)

Edge Functions handle the actual database operations and business logic. They are organized by domain and provide:

- Data validation
- Database operations
- Business logic
- Response formatting
- Error handling

#### Structure:
```typescript
// Domain-specific methods
export const getDomainItems = async (
  supabase: any,
  // Additional parameters...
): Promise<Response> => {
  try {
    // Database operations
    const { data, error } = await supabase
      .from("[table]")
      .select("*")
      // Additional query constraints...
      
    if (error) throw error;
    
    // Format and return response
    return new Response(
      JSON.stringify({
        status: "success",
        data: { items: data }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return handleError(error);
  }
};
```

## Standard Patterns

### Response Format

All API responses follow a consistent structure:

```json
{
  "status": "success" | "error",
  "data": {
    // Response data specific to the endpoint
  },
  "error": {
    // Only present if status is "error"
    "message": "Error description",
    "code": "ERROR_CODE"
  },
  "metadata": {
    "timestamp": "ISO timestamp",
    // Additional metadata...
  }
}
```

### Error Handling

Errors are consistently handled at each layer:

1. **Edge Functions**: Use `handleError` utility to format error responses
2. **Next.js API Routes**: Catch errors and return formatted responses with appropriate status codes
3. **Edge Functions Client**: Throw `EdgeFunctionError` with relevant details

### Authentication Flow

1. Frontend components make requests via Edge Functions Client
2. Next.js API routes authenticate requests using Clerk
3. Authenticated requests forwarded to Edge Functions
4. Edge Functions may perform additional authorization checks

## Implementation Guidelines

### Creating New API Endpoints

When adding a new endpoint now only two steps are required:

1. **Edge Function Implementation**:
   - Add or update the domain-specific function in your Supabase edge functions.
   - Include validation, business logic, and response formatting.

2. **Edge Functions Client Method**:
   - Add the corresponding method in `apps/web/src/lib/edge-functions.js`.
   - Use the existing `fetchFromEdgeFunction('/api/<domain>[/...]', { ... })` pattern.

> Note: The Next.js dynamic proxy automatically routes and authenticates calls, so you do not need to create or modify route files in `/app/api`.

## Implementation Checklist

When implementing a new API endpoint, ensure the following components are in place:

- [ ] Edge Function implementation in `apps/edge-functions/supabase/functions/api/`
- [ ] Edge Functions Client method in `apps/web/src/lib/edge-functions.js`
- [ ] Documentation update (if applicable)

### 1. Edge Function Implementation

File: `apps/edge-functions/supabase/functions/api/[domain].ts` or add to existing file

```typescript
export const get[Resource] = async (
  supabase: any,
  url: URL,
  // Additional parameters as needed (e.g., clerkId, athleteId)
): Promise<Response> => {
  try {
    // 1. Extract query parameters if needed
    const queryParams = new URLSearchParams(url.search);
    const paramName = queryParams.get('paramName');
    
    // 2. Build database query
    let query = supabase
      .from("[table_name]")
      .select("[fields, to, select]");
    
    // 3. Add filters if applicable
    if (paramName) {
      query = query.eq("column_name", paramName);
    }
    
    // 4. Execute query
    const { data, error } = await query;
    
    // 5. Handle errors
    if (error) throw error;
    
    // 6. Format and return response
    return new Response(
      JSON.stringify({
        status: "success",
        data: { 
          [resourceName]: data 
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    // 7. Handle errors consistently
    return handleError(error);
  }
};

export const create[Resource] = async (
  supabase: any,
  url: URL,
  req: Request
): Promise<Response> => {
  try {
    // 1. Parse request body
    const requestData = await req.json();
    
    // 2. Validate required fields
    if (!requestData.requiredField1 || !requestData.requiredField2) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Missing required fields"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // 3. Process clerk_id if present (common pattern)
    let userId = null;
    if (requestData.clerk_id) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", requestData.clerk_id)
        .single();
        
      if (userError) throw userError;
      userId = userData.id;
    }
    
    // 4. Prepare data for insertion
    const dataToInsert = {
      // Map fields appropriately
      user_id: userId,
      field1: requestData.field1,
      field2: requestData.field2,
      // Add timestamps
      created_at: new Date().toISOString()
    };
    
    // 5. Execute database operation
    const { data, error } = await supabase
      .from("[table_name]")
      .insert(dataToInsert)
      .select();
      
    if (error) throw error;
    
    // 6. Format and return response
    return new Response(
      JSON.stringify({
        status: "success",
        data: { 
          [resourceName]: data[0]
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    // 7. Handle errors consistently
    return handleError(error);
  }
};
```

**Important Considerations:**
- Use descriptive function names that reflect the resource and action
- Always validate required fields before database operations
- Use try/catch blocks for error handling
- Return consistent response structures
- Use appropriate HTTP status codes

## Response Format Standards

### Success Response

```json
{
  "status": "success",
  "data": {
    "resourceName": [
      {
        "id": 1,
        "field1": "value1",
        "field2": "value2"
      }
    ]
  },
  "metadata": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "count": 1
  }
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "message": "Descriptive error message",
    "code": "ERROR_CODE"
  },
  "metadata": {
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

### HTTP Status Codes

Use appropriate status codes for responses:

- **200 OK**: Successful GET, PUT or DELETE
- **201 Created**: Successful POST that created a new resource
- **204 No Content**: Successful operation with no content to return
- **400 Bad Request**: Invalid input, missing required fields
- **401 Unauthorized**: Missing authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected server error

## Common Data Transformation Patterns

### 1. User Authorization

When working with user-specific data, always get the user ID from their Clerk ID:

```typescript
// Get the user_id from clerk_id
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("id")
  .eq("clerk_id", clerkId)
  .single();
  
if (userError) throw userError;
if (!userData) throw new Error("User not found");

const userId = userData.id;
```

### 2. Role-Based Authorization

Check user roles before allowing access to resources:

```typescript
// Get user role
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("metadata")
  .eq("clerk_id", clerkId)
  .single();
  
if (userError) throw userError;
if (!userData) throw new Error("User not found");

const role = userData.metadata?.role;
if (role !== 'coach') {
  throw new Error("Only coaches can access this resource");
}
```

### 3. Related Data Queries

When fetching related data, use efficient join patterns:

```typescript
// Example joining users and their related data
const { data, error } = await supabase
  .from("users")
  .select(`
    id,
    username,
    email,
    profile:profiles(*)
  `)
  .eq("clerk_id", clerkId)
  .single();
```

## Best Practices

### 1. Consistent Error Handling
- Use the `EdgeFunctionError` class for all errors in the client
- Use `handleError` utility in Edge Functions
- Include specific error messages and codes

### 2. Authentication
- Always use the Clerk authentication middleware in Next.js API routes
- Pass authenticated user IDs to Edge Functions

### 3. Validation
- Validate request data at both Next.js API and Edge Function layers
- Return appropriate error responses for invalid data

### 4. Performance
- Minimize database queries
- Use efficient query patterns (e.g., select only needed fields)
- Consider caching for frequently accessed data

### 5. Security
- Never trust client-side data
- Always validate user permissions
- Use Supabase RLS policies for database access control

## Common Pitfalls

### 1. Direct Database Access

❌ **Don't** access the Supabase database directly from frontend components.

```javascript
// WRONG - Direct database access from component
const { data } = await supabase.from('users').select('*');
```

✅ **Do** use the Edge Functions Client to make API calls.

```javascript
// CORRECT - Use Edge Functions Client
const data = await edgeFunctions.users.getAll();
```

### 2. Missing Authentication

❌ **Don't** skip authentication in Next.js API routes.

```typescript
// WRONG - No authentication check
export async function GET(request: NextRequest) {
  const data = await edgeFunctions.users.getAll();
  return NextResponse.json(data);
}
```

✅ **Do** always check authentication using Clerk.

```typescript
// CORRECT - With authentication
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await edgeFunctions.users.getAll();
  return NextResponse.json(data);
}
```

### 3. Inconsistent Error Handling

❌ **Don't** use different error handling patterns across endpoints.

```typescript
// WRONG - Inconsistent error handling
try {
  // ...
} catch (err) {
  console.log("Error:", err);
  return { error: err.toString() };
}
```

✅ **Do** use the established error handling patterns.

```typescript
// CORRECT - Consistent error handling
try {
  // ...
} catch (error) {
  return handleError(error);
}
```

### 4. Missing Input Validation

❌ **Don't** skip input validation before database operations.

```typescript
// WRONG - No validation
const data = await req.json();
const { error } = await supabase.from('table').insert(data);
```

✅ **Do** validate all input before processing.

```typescript
// CORRECT - With validation
const data = await req.json();
if (!data.requiredField) {
  return new Response(
    JSON.stringify({
      status: "error",
      error: "Missing required field"
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### 5. Hardcoding Values

❌ **Don't** hardcode IDs, URLs, or other values that might change.

```javascript
// WRONG - Hardcoded URL
const response = await fetch('https://specific-url.com/api/endpoint');
```

✅ **Do** use environment variables and configuration.

```javascript
// CORRECT - Using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const response = await fetch(`${supabaseUrl}/functions/v1/api/endpoint`);
```

### 6. Inefficient Database Queries

❌ **Don't** select all fields when only a few are needed.

```typescript
// WRONG - Selecting all fields
const { data } = await supabase.from('users').select('*');
```

✅ **Do** select only the fields you need.

```typescript
// CORRECT - Selecting specific fields
const { data } = await supabase.from('users').select('id, name, email');
```

### 7. Duplicate Authentication Logic

❌ **Don't** implement the same authentication logic in every endpoint.

✅ **Do** consider using middleware or utility functions for common logic.

```typescript
// CORRECT - Using a utility function
const withAuth = (handler) => async (request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(request, userId);
};

export const GET = withAuth(async (request, userId) => {
  // Authenticated handler logic
});
```

## Performance Optimization

### 1. Pagination

Always implement pagination for endpoints that return lists of items:

```typescript
// Example pagination implementation
const page = parseInt(queryParams.get('page') || '1');
const pageSize = parseInt(queryParams.get('pageSize') || '20');
const offset = (page - 1) * pageSize;

// Apply pagination to query
let query = supabase
  .from('table')
  .select('*')
  .range(offset, offset + pageSize - 1);

// Return pagination metadata
return new Response(
  JSON.stringify({
    status: "success",
    data: { items: data },
    metadata: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize)
    }
  })
);
```

### 2. Query Optimization

Optimize database queries for performance:

- Use indexes for frequently queried columns
- Use `.limit()` for large datasets
- Use `.filter()` before expensive joins
- Use `.count()` instead of fetching all records to count

### 3. Caching

Consider implementing caching for frequently accessed, rarely changing data.

## Security Considerations

### 1. Never Trust Client Data

Always validate and sanitize data from the client side:

```typescript
// Example input sanitization
const sanitizeInput = (input) => {
  // Remove any potentially harmful characters
  return {
    ...input,
    name: input.name ? String(input.name).trim().slice(0, 100) : '',
    email: input.email ? String(input.email).trim().toLowerCase() : '',
    // Add more fields as needed
  };
};

// Usage
const rawData = await request.json();
const sanitizedData = sanitizeInput(rawData);
```

### 2. Implement Row-Level Security (RLS)

Use Supabase RLS policies to restrict database access at the database level.

### 3. Minimize Edge Function Permissions

Give edge functions only the permissions they need to function.

### 4. Secure Authentication Flow

Always use secure authentication patterns:
- Never expose API keys in client-side code
- Use proper token handling
- Implement proper session management

### 5. Validate User Permissions

Check if users have the required permissions before allowing operations.

## Maintainability Guidelines

### 1. Consistent Naming Conventions

Follow consistent naming patterns:

- Use **camelCase** for JavaScript/TypeScript variables and functions
- Use **snake_case** for database table and column names
- Use **PascalCase** for component names and types
- Use descriptive, action-oriented names for functions

### 2. Document API Endpoints

Always include JSDoc comments for API endpoints.

### 3. Organize Code by Domain

Group related functionality by domain rather than by technical concerns.

### 4. Use TypeScript Interfaces

Define clear interfaces for request and response data.

### 5. Implement Comprehensive Logging

Add structured logging to aid debugging.

## Testing Procedures

### 1. Write Unit Tests for Critical Paths

Focus on testing business logic and critical paths.

### 2. Implement Integration Tests

Test the full request flow from API route through to database.

### 3. Use Mock Data for Testing

Create reusable mock data for tests.

## Troubleshooting

### 1. Troubleshooting API Requests

When an API request isn't working as expected:

1. Check client-side console for Edge Function client errors
2. Check server logs for Next.js API route errors
3. Check Edge Function logs in the Supabase dashboard
4. Verify request payload and headers
5. Test the endpoint directly using a tool like Postman

### 2. Common Error Patterns

- **401 Unauthorized**: Check authentication token/session
- **403 Forbidden**: Check user permissions
- **404 Not Found**: Check resource IDs and route paths
- **400 Bad Request**: Check request payload format
- **500 Internal Server Error**: Check server logs for exceptions

### 3. Debugging Edge Functions

To debug Supabase Edge Functions:

1. Use `console.log()` statements in your Edge Function code
2. View logs in the Supabase dashboard
3. Test the Edge Function directly using the Supabase CLI

### 4. Enable Detailed Error Messages in Development

In development, return detailed error information 