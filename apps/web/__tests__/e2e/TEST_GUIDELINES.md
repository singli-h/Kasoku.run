# E2E Test Organization Guidelines

**Purpose:** Ensure consistent, maintainable test structure across all E2E tests.

## 🎯 Core Principles

1. **One Folder Per Page/Feature** - Each page gets its own directory
2. **One TEST_PLAN.md Per Page** - Single doc with plan, checklist, and tracking
3. **Test Files Only** - No reports, summaries, or redundant docs in page folders
4. **Clean Structure** - Easy to navigate and maintain

## 📁 Required Folder Structure

```
__tests__/e2e/
├── README.md                          # Overview & navigation
├── TEST_GUIDELINES.md                # This file (always reference)
├── helpers/
│   └── browser-test-utils.ts          # Shared utilities
├── [feature-name]/                    # One folder per page/feature
│   ├── TEST_PLAN.md                   # Single doc: plan + tracking
│   └── [feature-name].e2e.ts          # Test file only
└── _archive/                          # Old reports (archived)
```

## 📋 TEST_PLAN.md Template

Every `TEST_PLAN.md` must include:

```markdown
# [Page Name] Test Plan & Tracking

**Page:** `/route/path`
**Test File:** `[page-name].e2e.ts`
**Last Updated:** YYYY-MM-DD

## 📊 Test Status Overview
[Table with: Category | Tests | Status]

## 🎯 Critical Priority Tests (Must Have)
- [ ] TC-001: [Test description]
- [ ] TC-002: [Test description]

## ✅ Test Checklist
### Category 1
- [ ] Test case 1
- [ ] Test case 2

## 🐛 Issues Log
| ID | Description | Status | Priority | Test Case |

## 📈 Test Execution History
| Date | Tester | Tests Run | Passed | Failed | Notes |

## 🎯 Next Steps
1. Implement critical priority tests
2. Complete high priority tests
3. Full test coverage
```

## ✅ When Creating New Test Suite

1. **Create folder:** `__tests__/e2e/[feature-name]/`
2. **Create TEST_PLAN.md** using template above
3. **Create test file:** `[feature-name].e2e.ts`
4. **Document test cases** in TEST_PLAN.md first (planning phase)
5. **Implement tests** in `.e2e.ts` file
6. **Update status** in TEST_PLAN.md as tests are written/completed

## ✅ When Adding Tests

1. **Add test case** to TEST_PLAN.md checklist
2. **Implement test** in `.e2e.ts` file
3. **Update status** table in TEST_PLAN.md
4. **Log issues** in Issues Log if found
5. **Update execution history** after running tests

## ✅ When Finishing Test Session

1. **Update TEST_PLAN.md:**
   - Mark completed tests with ✅
   - Update status tables
   - Log all issues found
   - Add execution history entry
2. **Clean up:**
   - No temporary files in page folder
   - No reports in page folder (archive if needed)
   - Only TEST_PLAN.md + test file in folder

## 🚫 What NOT to Do

- ❌ Create multiple doc files per page (reports, summaries, etc.)
- ❌ Leave old reports in page folders (archive them)
- ❌ Skip updating TEST_PLAN.md status
- ❌ Create test files without TEST_PLAN.md
- ❌ Mix test files from different pages in one folder

## 📝 Test File Naming

- **Test files:** `[page-name].e2e.ts` (kebab-case)
- **Plan files:** `TEST_PLAN.md` (always uppercase, consistent name)
- **Helper files:** Keep in `helpers/` folder

## 🗂️ Archiving Old Files

- Move old reports/summaries to `_archive/` folder
- Keep TEST_PLAN.md as single source of truth
- Archive only after confirming info is in TEST_PLAN.md

## 🎯 Checklist for AI Agents

When planning/doing tests, always:

- [ ] Reference this TEST_GUIDELINES.md file
- [ ] Create/update TEST_PLAN.md first (if new page)
- [ ] Use TEST_PLAN.md template structure
- [ ] Update status tables as tests are completed
- [ ] Log all issues in Issues Log section
- [ ] Update execution history after test runs
- [ ] Keep page folder clean (only TEST_PLAN.md + test file)
- [ ] Archive old reports to `_archive/` if needed

---

**Remember:** Consistency is key. Every page follows the same structure.

