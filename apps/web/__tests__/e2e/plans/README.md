# Plan Pages E2E Tests

End-to-end browser tests for all plan-related pages using MCP browser automation tools.

## ⚠️ **MANDATORY: Reference TEST_GUIDELINES.md**

**Before working on any tests:**
- Read: [`../../TEST_GUIDELINES.md`](../../TEST_GUIDELINES.md)
- Follow the principles: One folder per page, one TEST_PLAN.md per page
- Update TEST_PLAN.md when planning, implementing, or finishing tests

## Structure

```
plans/
├── README.md                    # This file
├── home-page/                   # /plans
│   ├── TEST_PLAN.md            # Single doc: plan + checklist + tracking
│   └── home-page.e2e.ts        # Test file only
├── workspace/                   # /plans/[id]
│   ├── TEST_PLAN.md
│   └── workspace.e2e.ts
├── create-plan-wizard/          # /plans/new
│   ├── TEST_PLAN.md
│   └── create-plan-wizard.e2e.ts
├── session-planner/             # /plans/[id]/session/[sessionId]
│   ├── TEST_PLAN.md
│   └── session-planner.e2e.ts
├── database-validation/          # DB constraints & RLS
│   ├── TEST_PLAN.md
│   └── database-validation.e2e.ts
└── _archive/                    # Old reports (archived)
```

## Principles (from TEST_GUIDELINES.md)

1. **One folder per page** - Each page has its own directory
2. **One TEST_PLAN.md per page** - Single doc with plan, checklist, and status tracking
3. **Test files only** - No reports, summaries, or redundant docs in page folders
4. **Clean structure** - Easy to navigate and maintain

## Running Tests

### Prerequisites
```bash
# Start dev server
npm run dev
```

### Using MCP Browser Tools
Tests are executed via Cursor's MCP browser automation:
- `browser_navigate` - Navigate to pages
- `browser_snapshot` - Get page state
- `browser_click` - Click elements
- `browser_type` - Fill forms
- `browser_wait_for` - Wait for async operations

### Test Status
Check each page's `TEST_PLAN.md` for:
- Test case checklist
- Implementation status
- Issues log
- Execution history

## Test Coverage

| Page | Tests | Implemented | Status |
|------|-------|-------------|--------|
| Home Page | 22 | 0 | 📝 Planning |
| Workspace | 24 | 0 | 📝 Planning |
| Create Wizard | 22 | 0 | 📝 Planning |
| Session Planner | 44 | 2 (4.5%) | ⚠️ Partial |
| Database Validation | 14 | 0 | 📝 Planning |

## Workflow

When working on tests, follow TEST_GUIDELINES.md:

1. **Planning:** Add test cases to TEST_PLAN.md
2. **Implementing:** Write tests in `[page].e2e.ts`
3. **Tracking:** Update status in TEST_PLAN.md
4. **Finishing:** Complete all TEST_PLAN.md sections, archive old files

## Contributing

Always reference [`../../TEST_GUIDELINES.md`](../../TEST_GUIDELINES.md) before:
- Creating new test suites
- Adding new tests
- Finishing test sessions
- Reorganizing test files
