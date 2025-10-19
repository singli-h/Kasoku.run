# Training Plans Test Suite

Comprehensive test suite for the Training Plans feature, covering backend actions, validation schemas, and frontend/backend integration.

## Test Structure

```
apps/web/__tests__/
├── actions/
│   └── training/
│       └── race-actions.test.ts         # Race CRUD action tests
├── lib/
│   └── validation/
│       └── training-schemas.test.ts     # Zod validation schema tests
└── integration/
    └── plans/
        └── plan-page.test.tsx           # FE/BE integration tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Race actions only
npm test race-actions

# Validation schemas only
npm test training-schemas

# Integration tests only
npm test plan-page
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Categories

### 1. Action Tests (`actions/training/race-actions.test.ts`)

Tests for backend server actions handling race CRUD operations.

**Coverage:**
- ✅ Create race with valid data
- ✅ Get races by macrocycle
- ✅ Get single race by ID
- ✅ Update race details
- ✅ Delete race
- ✅ Get upcoming races
- ✅ Authentication checks
- ✅ Permission/RLS enforcement
- ✅ Error handling (DB errors, not found, etc.)

**Example:**
```typescript
it('should create a race successfully', async () => {
  const result = await createRaceAction({
    name: 'Boston Marathon',
    type: 'Marathon',
    date: '2025-04-21',
    macrocycle_id: 1
  })

  expect(result.isSuccess).toBe(true)
  expect(result.data?.name).toBe('Boston Marathon')
})
```

### 2. Validation Tests (`lib/validation/training-schemas.test.ts`)

Tests for Zod validation schemas ensuring data integrity.

**Coverage:**
- ✅ Macrocycle validation (dates, required fields)
- ✅ Mesocycle validation (hierarchy, dates)
- ✅ Microcycle validation
- ✅ Session validation (day range 1-7, session modes)
- ✅ Exercise preset validation
- ✅ Set details validation (reps, weight, RPE ranges)
- ✅ Race validation
- ✅ Error message extraction
- ✅ Edge cases (empty strings, nulls, zeros)

**Example:**
```typescript
it('should fail when end date is before start date', () => {
  const result = MacrocycleSchema.safeParse({
    name: 'Invalid Plan',
    start_date: '2025-12-31',
    end_date: '2025-01-01'
  })

  expect(result.success).toBe(false)
  expect(result.error.errors[0].message).toBe('End date must be after start date')
})
```

### 3. Integration Tests (`integration/plans/plan-page.test.tsx`)

End-to-end tests validating FE/BE data flow.

**Coverage:**
- ✅ Data loading (macrocycles, races)
- ✅ Complete hierarchy loading (macro → meso → micro)
- ✅ CRUD operations through UI
- ✅ Data relationships
- ✅ Error handling (network, database)
- ✅ Permission checks
- ✅ User authentication

**Example:**
```typescript
it('should load macrocycle data on mount', async () => {
  const result = await getMacrocycleByIdAction(1)

  expect(result.isSuccess).toBe(true)
  expect(result.data?.mesocycles).toHaveLength(2)
})
```

## Test Data

### Mock Macrocycle
```typescript
{
  id: 1,
  name: '2025 Training Plan',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  mesocycles: [
    {
      id: 1,
      name: 'Base Phase',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
      microcycles: []
    }
  ]
}
```

### Mock Races
```typescript
[
  {
    id: 1,
    name: 'Boston Marathon',
    type: 'Marathon',
    date: '2025-04-21',
    macrocycle_id: 1
  }
]
```

## Mocking Strategy

### Clerk Authentication
```typescript
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user_123' })
}))
```

### Supabase Client
```typescript
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    })
  }
}))
```

### User Cache
```typescript
jest.mock('@/lib/user-cache', () => ({
  getDbUserId: jest.fn().mockResolvedValue(1)
}))
```

## Test Patterns

### Action Test Pattern
```typescript
describe('createRaceAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockGetDbUserId.mockResolvedValue(1)
  })

  it('should create successfully', async () => {
    // Arrange
    mockSupabase.from.mockReturnValue(...)

    // Act
    const result = await createRaceAction(data)

    // Assert
    expect(result.isSuccess).toBe(true)
  })
})
```

### Validation Test Pattern
```typescript
it('should validate correct data', () => {
  const validData = { ... }
  const result = Schema.safeParse(validData)

  expect(result.success).toBe(true)
})

it('should reject invalid data', () => {
  const invalidData = { ... }
  const result = Schema.safeParse(invalidData)

  expect(result.success).toBe(false)
  expect(result.error.errors[0].message).toContain('expected message')
})
```

## Coverage Goals

- **Actions**: 90%+ coverage
- **Validation**: 100% coverage (critical for data integrity)
- **Integration**: 80%+ coverage (focus on critical paths)

## CI/CD Integration

Tests run automatically on:
- ✅ Pull requests
- ✅ Commits to main branch
- ✅ Pre-deployment checks

## Adding New Tests

### 1. Create Test File
```bash
# For actions
touch apps/web/__tests__/actions/training/new-action.test.ts

# For validation
touch apps/web/__tests__/lib/validation/new-schema.test.ts

# For integration
touch apps/web/__tests__/integration/new-feature.test.tsx
```

### 2. Follow Naming Convention
- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: Feature/function name
- Test cases: "should [expected behavior]"

### 3. Use Existing Patterns
Refer to existing tests for mocking and assertion patterns.

## Troubleshooting

### Mock Not Working
```typescript
// Ensure mocks are at the top of the file, before imports
jest.mock('@/lib/supabase-server')

import supabase from '@/lib/supabase-server'
```

### Type Errors
```typescript
// Use proper type assertions
const mockFn = fn as jest.MockedFunction<typeof fn>
```

### Async Tests Hanging
```typescript
// Always use async/await or return promises
it('async test', async () => {
  await asyncFunction()
  // assertions
})
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Zod Documentation](https://zod.dev/)

## Next Steps

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add mutation testing
