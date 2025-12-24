# Testing Strategy

> **Last Updated**: 2025-12-24

This document defines the testing requirements and strategies for different feature types in Kasoku.

## Overview

Kasoku uses a multi-layered testing approach:
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Server actions and API interactions
- **E2E Tests**: Complete user workflows

## Testing Infrastructure

### Tools

- **Jest**: Unit and integration testing
- **Playwright**: E2E testing
- **React Testing Library**: Component testing
- **MSW**: API mocking (when needed)

### Test Structure

```
apps/web/
├── __tests__/
│   ├── unit/              # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/               # E2E tests
│       ├── TEST_GUIDELINES.md
│       └── [feature-name]/
│           ├── TEST_PLAN.md
│           └── [feature-name].e2e.ts
```

## Testing Requirements by Feature Type

### Authentication Features

**Priority**: P0 (Critical)

**Required Tests**:
- ✅ User can sign up
- ✅ User can sign in
- ✅ User can sign out
- ✅ Protected routes redirect unauthenticated users
- ✅ Onboarding flow completes successfully
- ✅ Role-based access control works

**Example**:
```typescript
// __tests__/e2e/auth/auth.e2e.ts
test("user can sign in", async ({ page }) => {
  await page.goto("/sign-in")
  await page.fill('input[name="email"]', "test@example.com")
  await page.fill('input[name="password"]', "password123")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL("/dashboard")
})
```

### Data Mutation Features

**Priority**: P0 (Critical)

**Required Tests**:
- ✅ Create operations work correctly
- ✅ Update operations work correctly
- ✅ Delete operations work correctly
- ✅ Validation errors are shown
- ✅ RLS policies are enforced
- ✅ Unauthorized access is blocked

**Example**:
```typescript
// __tests__/integration/actions/athlete-actions.test.ts
describe("createAthleteAction", () => {
  it("should create athlete when authenticated", async () => {
    const result = await createAthleteAction({
      name: "Test Athlete",
      email: "athlete@example.com"
    })
    expect(result.isSuccess).toBe(true)
    expect(result.data).toHaveProperty("id")
  })

  it("should reject unauthenticated requests", async () => {
    // Mock no auth
    const result = await createAthleteAction({ name: "Test" })
    expect(result.isSuccess).toBe(false)
    expect(result.message).toContain("Authentication")
  })
})
```

### Form Features

**Priority**: P1 (High)

**Required Tests**:
- ✅ Form validation works
- ✅ Error messages display correctly
- ✅ Submit works correctly
- ✅ Loading states work
- ✅ Success feedback is shown

**Example**:
```typescript
// __tests__/unit/components/athlete-form.test.tsx
describe("AthleteForm", () => {
  it("should show validation error for empty name", async () => {
    render(<AthleteForm />)
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))
    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument()
    })
  })
})
```

### List/Table Features

**Priority**: P1 (High)

**Required Tests**:
- ✅ Data loads correctly
- ✅ Pagination works
- ✅ Filtering works
- ✅ Sorting works
- ✅ Search works

**Example**:
```typescript
// __tests__/e2e/athletes/athletes.e2e.ts
test("athletes list displays data", async ({ page }) => {
  await page.goto("/athletes")
  await expect(page.getByRole("table")).toBeVisible()
  await expect(page.getByText("John Doe")).toBeVisible()
})

test("athletes list filters correctly", async ({ page }) => {
  await page.goto("/athletes")
  await page.fill('input[placeholder="Search"]', "John")
  await expect(page.getByText("John Doe")).toBeVisible()
  await expect(page.queryByText("Jane Smith")).not.toBeVisible()
})
```

### Payment Features

**Priority**: P0 (Critical - Revenue Blocking)

**Required Tests**:
- ✅ Checkout flow works
- ✅ Webhook handling works
- ✅ Subscription creation works
- ✅ Payment failures are handled
- ✅ Billing portal access works

**Note**: Use Stripe test mode for all payment tests

### AI Features

**Priority**: P2 (Medium - If Core Feature)

**Required Tests**:
- ✅ Memory creation works
- ✅ Memory retrieval works
- ✅ Vector search works
- ✅ Access control is enforced

## E2E Test Organization

### Structure

Following `TEST_GUIDELINES.md`:

```
__tests__/e2e/
├── TEST_GUIDELINES.md
├── helpers/
│   └── auth-helpers.ts
└── [feature-name]/
    ├── TEST_PLAN.md
    └── [feature-name].e2e.ts
```

### TEST_PLAN.md Template

Each feature E2E test folder must include:

1. **Test Status Overview** (table)
2. **Critical Priority Tests** (checklist)
3. **Test Checklist** (all test cases)
4. **Issues Log** (table)
5. **Test Execution History** (table)
6. **Next Steps**

## Unit Testing Patterns

### Server Actions

```typescript
// __tests__/unit/actions/athlete-actions.test.ts
import { createAthleteAction } from "@/actions/athletes"
import { auth } from "@clerk/nextjs/server"

jest.mock("@clerk/nextjs/server")
jest.mock("@/lib/user-cache")
jest.mock("@/lib/supabase")

describe("createAthleteAction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create athlete when authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ userId: "user_123" })
    // Mock other dependencies
    // Test action
  })
})
```

### Components

```typescript
// __tests__/unit/components/athlete-card.test.tsx
import { render, screen } from "@testing-library/react"
import { AthleteCard } from "@/components/features/athletes/athlete-card"

describe("AthleteCard", () => {
  it("should display athlete name", () => {
    const athlete = { id: 1, name: "John Doe", email: "john@example.com" }
    render(<AthleteCard athlete={athlete} />)
    expect(screen.getByText("John Doe")).toBeInTheDocument()
  })
})
```

## Integration Testing Patterns

### Server Action + Database

```typescript
// __tests__/integration/actions/plan-actions.test.ts
import { createPlanAction } from "@/actions/plans"
import { setupTestDatabase, teardownTestDatabase } from "@/test-helpers"

describe("createPlanAction", () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it("should create plan and persist to database", async () => {
    const result = await createPlanAction({
      name: "Test Plan",
      description: "Test Description"
    })
    expect(result.isSuccess).toBe(true)
    
    // Verify in database
    const plan = await getPlanFromDatabase(result.data.id)
    expect(plan).toBeDefined()
    expect(plan.name).toBe("Test Plan")
  })
})
```

## E2E Testing Patterns

### Authentication Flow

```typescript
// __tests__/e2e/auth/sign-in.e2e.ts
import { test, expect } from "@playwright/test"

test.describe("Sign In", () => {
  test("should sign in successfully", async ({ page }) => {
    await page.goto("/sign-in")
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL("/dashboard")
  })
})
```

### Feature Workflow

```typescript
// __tests__/e2e/athletes/create-athlete.e2e.ts
test("coach can create athlete", async ({ page }) => {
  // Sign in as coach
  await signInAsCoach(page)
  
  // Navigate to athletes page
  await page.goto("/athletes")
  
  // Click create button
  await page.click('button:has-text("Add Athlete")')
  
  // Fill form
  await page.fill('input[name="name"]', "New Athlete")
  await page.fill('input[name="email"]', "athlete@example.com")
  
  // Submit
  await page.click('button[type="submit"]')
  
  // Verify success
  await expect(page.getByText("Athlete created")).toBeVisible()
  await expect(page.getByText("New Athlete")).toBeVisible()
})
```

## Test Coverage Goals

### Minimum Coverage

- **Critical Features** (P0): 80%+ coverage
- **High Priority Features** (P1): 70%+ coverage
- **Medium Priority Features** (P2): 60%+ coverage

### Coverage by Type

- **Unit Tests**: 70%+ for actions and utilities
- **Integration Tests**: All critical data mutations
- **E2E Tests**: All critical user workflows

## Test Data Management

### Fixtures

```typescript
// __tests__/fixtures/athletes.ts
export const testAthlete = {
  id: 1,
  name: "Test Athlete",
  email: "test@example.com",
  user_id: 1
}

export const testAthletes = [
  testAthlete,
  { ...testAthlete, id: 2, name: "Another Athlete" }
]
```

### Test Database

- Use separate test database
- Reset between test suites
- Seed with test data

## Continuous Integration

### Test Execution

- Run unit tests on every commit
- Run integration tests on PR
- Run E2E tests on merge to main

### Test Reports

- Generate coverage reports
- Track test execution time
- Monitor flaky tests

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ GOOD: Test behavior
expect(screen.getByText("Athlete created")).toBeInTheDocument()

// ❌ BAD: Test implementation
expect(component.state.success).toBe(true)
```

### 2. Use Descriptive Test Names

```typescript
// ✅ GOOD
test("coach can create athlete with valid data", async () => {})

// ❌ BAD
test("create works", async () => {})
```

### 3. Keep Tests Independent

```typescript
// ✅ GOOD: Each test is independent
test("creates athlete", async () => {
  // Setup
  // Test
  // Cleanup
})

// ❌ BAD: Tests depend on each other
test("creates athlete", async () => {
  // Creates data
})

test("updates athlete", async () => {
  // Depends on previous test
})
```

### 4. Mock External Dependencies

```typescript
// ✅ GOOD: Mock external services
jest.mock("@clerk/nextjs/server")
jest.mock("@/lib/supabase")

// ❌ BAD: Use real external services in tests
```

## Related Documentation

- [E2E Test Guidelines](../../__tests__/e2e/TEST_GUIDELINES.md)
- [Feature Pattern](../patterns/feature-pattern.md)
- [ActionState Pattern](../patterns/actionstate-pattern.md)

