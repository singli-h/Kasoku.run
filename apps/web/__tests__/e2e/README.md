# E2E Browser Tests

This directory contains comprehensive end-to-end browser tests using browser automation to test real user interactions and catch bugs, broken features, and UI/UX issues.

## ⚠️ **IMPORTANT: Always Reference TEST_GUIDELINES.md**

**Before planning, creating, or finishing any tests, read:**
- [`TEST_GUIDELINES.md`](./TEST_GUIDELINES.md) - **MANDATORY** reference for test organization principles

## Test Structure

```
__tests__/e2e/
├── README.md (this file)
├── TEST_GUIDELINES.md           # ⚠️ MANDATORY: Test organization principles
├── helpers/
│   └── browser-test-utils.ts    # Shared utilities and constants
└── plans/
    ├── home-page/
    │   ├── TEST_PLAN.md         # Single doc: plan + checklist + tracking
    │   └── home-page.e2e.ts     # Test file only
    ├── workspace/
    │   ├── TEST_PLAN.md
    │   └── workspace.e2e.ts
    ├── create-plan-wizard/
    │   ├── TEST_PLAN.md
    │   └── create-plan-wizard.e2e.ts
    ├── session-planner/
    │   ├── TEST_PLAN.md
    │   └── session-planner.e2e.ts
    ├── database-validation/
    │   ├── TEST_PLAN.md
    │   └── database-validation.e2e.ts
    └── _archive/                 # Old reports (archived)
```

## Test Organization Principles

**⚠️ Always follow these principles (see TEST_GUIDELINES.md for details):**

1. **One folder per page/feature** - Each page gets its own directory
2. **One TEST_PLAN.md per page** - Single doc with plan, checklist, and tracking
3. **Test files only** - No reports, summaries, or redundant docs in page folders
4. **Clean structure** - Easy to navigate and maintain

## Running Tests

### Using MCP Browser Tools (Current Method)

These tests are designed to be run using Cursor's MCP browser automation tools. Each test file contains comprehensive test cases that can be executed by:

1. Starting the development server:
   ```bash
   npm run dev
   ```

2. Using browser automation tools to execute test scenarios:
   - `browser_navigate` - Navigate to pages
   - `browser_snapshot` - Get page state for assertions
   - `browser_click` - Click buttons, links
   - `browser_type` - Fill forms
   - `browser_wait_for` - Wait for elements/async operations
   - `browser_take_screenshot` - Visual verification

### Future: Playwright Integration

Once Playwright is fully configured, tests can be run with:

```bash
npm run test:e2e
```

## Test Coverage

### Plans Home Page (`/plans`)
- ✅ Page loading and rendering
- ✅ Search functionality
- ✅ Filtering (state, group)
- ✅ Navigation to other pages
- ✅ Timeline visualization
- ✅ Volume/intensity charts
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Accessibility

### Plan Workspace (`/plans/[id]`)
- ✅ Plan data loading
- ✅ Three-column layout (desktop)
- ✅ Mobile sliding panels
- ✅ Mesocycle CRUD operations
- ✅ Microcycle CRUD operations
- ✅ Session management
- ✅ Race/event management
- ✅ Undo/Redo functionality
- ✅ Form validation
- ✅ Performance testing

### Create Plan Wizard (`/plans/new`)
- ✅ Wizard step navigation
- ✅ Plan type selection
- ✅ Configuration inputs
- ✅ Session planning
- ✅ Exercise library integration
- ✅ Review and submission
- ✅ Form persistence
- ✅ Error handling

### Session Planner (`/plans/[id]/session/[sessionId]`)
- ✅ Session data loading
- ✅ Exercise list rendering
- ✅ Exercise editing
- ✅ Exercise library integration
- ✅ Adding/removing exercises
- ✅ Reordering exercises
- ✅ Superset creation
- ✅ Batch editing
- ✅ Saving changes
- ✅ Validation

### Database Validation
- ✅ Database constraint enforcement
- ✅ Foreign key relationships
- ✅ CASCADE deletion behavior
- ✅ RLS policy enforcement
- ✅ Data integrity checks
- ✅ Index performance
- ✅ Timestamp management
- ✅ JSON metadata handling

## Test Environment Setup

### Environment Variables

Create a `.env.test` file with:

```env
E2E_BASE_URL=http://localhost:3000
E2E_TEST_USER_EMAIL=test@example.com
E2E_TEST_USER_PASSWORD=test-password
```

### Test Data

Tests use factories from `browser-test-utils.ts` to create test data. Ensure your test database has:
- A test user with coach/admin role
- Sample athlete groups (optional)
- Clean test data or proper cleanup between tests

## Writing New Tests

**⚠️ FIRST: Read [`TEST_GUIDELINES.md`](./TEST_GUIDELINES.md) - It contains the complete workflow**

1. **Create folder structure** following TEST_GUIDELINES.md principles
2. **Create TEST_PLAN.md** using the template in TEST_GUIDELINES.md
3. **Document test cases** in TEST_PLAN.md first (planning phase)
4. **Implement tests** in `[page-name].e2e.ts` file
5. **Update TEST_PLAN.md** status as tests are completed
6. **Use helpers**: Import utilities from `browser-test-utils.ts`
7. **Log issues** in TEST_PLAN.md Issues Log section

Example:

```typescript
describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Navigate
    // Interact
    // Assert
  })
})
```

## Common Issues to Test For

When writing or running tests, watch for:

1. **Broken Functionality**
   - Features that don't work as expected
   - Actions that don't trigger
   - Data that doesn't save/load

2. **UI/UX Issues**
   - Layout breaks on different screen sizes
   - Overlapping elements
   - Unreadable text
   - Missing error messages
   - Confusing navigation

3. **Performance Issues**
   - Slow page loads
   - Laggy interactions
   - Layout shifts during load

4. **Accessibility Issues**
   - Missing labels
   - Keyboard navigation problems
   - Screen reader incompatibilities

5. **Error Handling**
   - Unhelpful error messages
   - No error feedback
   - Application crashes

6. **Database Issues** (Use Supabase MCP to verify)
   - RLS policies not working correctly
   - Foreign key constraint violations
   - Data not persisting correctly
   - Incorrect data types
   - Missing indexes causing slow queries

## Database Schema Notes

Based on Supabase schema analysis:

### Important Constraints
- `microcycles.volume` and `microcycles.intensity` must be 1-10
- `races.type` must be 'primary' or 'secondary'
- CASCADE deletes: mesocycles → microcycles → exercise_preset_groups

### RLS Policies
- All plan tables have RLS enabled
- Users can only see/modify their own plans
- Templates (`is_template=true`) are readable by all
- **Note**: Verify race RLS policies work correctly (there may be a type mismatch issue)

### Foreign Keys
- `races.macrocycle_id` (bigint) → `macrocycles.id` (integer) - verify this works
- CASCADE deletes mean deleting macrocycle deletes all related data

### Testing Database State
Use Supabase MCP tools to verify database state:
- `mcp_supabase_execute_sql` - Run queries to verify data
- `mcp_supabase_list_tables` - Check table structures
- `mcp_supabase_get_advisors` - Check for security/performance issues

## Debugging Failed Tests

1. **Take Screenshots**: Use `browser_take_screenshot` on failure
2. **Check Console**: Look for JavaScript errors
3. **Verify Network**: Check if API calls are failing
4. **Inspect Elements**: Use browser tools to inspect problematic elements
5. **Check Test Data**: Verify test data is correct

## Continuous Integration

Once Playwright is configured, these tests should run in CI/CD:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npm run test:e2e
```

## Notes

- Tests are currently structured for MCP browser tools but designed to be easily ported to Playwright
- Some test cases may need adjustment based on actual implementation
- Focus on finding real bugs and UX issues, not just passing tests
