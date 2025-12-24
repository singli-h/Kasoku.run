# Feature Specification: Feature Pattern Standardization

**Feature Branch**: `004-feature-pattern-standard`
**Created**: 2025-12-24
**Status**: Draft
**Input**: Audit revealing inconsistent patterns across features (Plans uses Context, Sessions uses Hooks, Athletes uses neither consistently)

## User Scenarios & Testing

### User Story 1 - Developer Creates New Feature Following Standard (Priority: P1)

As a developer implementing a new feature, I want a clear, documented pattern so that my implementation matches team standards without code review rework.

**Why this priority**: Inconsistent feature structures increase cognitive load and maintenance burden. New features should follow established patterns.

**Independent Test**: Developer can scaffold a new feature directory structure that passes linting and matches existing features.

**Acceptance Scenarios**:

1. **Given** developer needs new "analytics" feature, **When** following feature pattern doc, **Then** creates correct directory structure in < 5 minutes
2. **Given** developer implements feature with state, **When** choosing between hooks/context, **Then** can determine correct approach from decision tree
3. **Given** developer creates feature components, **When** running lint, **Then** passes with zero warnings about structure

---

### User Story 2 - Existing Features Align to Standard (Priority: P1)

As a maintainer, I want all existing features to follow the same pattern so that context-switching between features is frictionless.

**Why this priority**: Current inconsistency (Plans=Context, Sessions=Hooks, Athletes=Mixed) causes confusion and bugs.

**Independent Test**: All 4 major features (plans, athletes, sessions, workout) pass structural linting rules.

**Acceptance Scenarios**:

1. **Given** developer opens plans feature, **When** checking structure, **Then** matches documented standard
2. **Given** developer opens sessions feature, **When** checking structure, **Then** matches same documented standard
3. **Given** any feature, **When** looking for types, **Then** finds them in consistent location (types.ts or types/)

---

### User Story 3 - AI Assistant Generates Consistent Code (Priority: P2)

As Claude Code, I want explicit pattern documentation so that I generate code matching the codebase conventions.

**Why this priority**: AI-generated code that doesn't match patterns requires manual refactoring.

**Independent Test**: Claude Code generates a new component that matches existing component patterns.

**Acceptance Scenarios**:

1. **Given** prompt to create new feature component, **When** generating code, **Then** uses correct file structure
2. **Given** prompt for data fetching component, **When** generating code, **Then** uses correct pattern (server component OR hook)
3. **Given** prompt for form component, **When** generating code, **Then** uses ActionState pattern correctly

---

### Edge Cases

- What if a feature genuinely needs different patterns? (Document exception with rationale in feature README)
- How do we handle gradual migration? (Create migration guide, prioritize by usage frequency)
- What about third-party component patterns? (Wrap in feature-specific components that follow pattern)

## Requirements

### Functional Requirements

#### Standard Feature Structure

- **FR-001**: Every feature MUST have the following structure:
  ```
  components/features/[feature-name]/
  ├── components/          # Feature-specific UI components
  │   ├── index.ts        # Public component exports
  │   └── [Component].tsx
  ├── hooks/              # Custom hooks for data/state (if needed)
  │   ├── index.ts        # Public hook exports
  │   └── use[Feature]*.ts
  ├── context/            # Context providers (if needed)
  │   ├── index.ts        # Public context exports
  │   └── [Feature]Context.tsx
  ├── types.ts            # Feature-specific types
  ├── index.ts            # Public API exports
  └── README.md           # Feature documentation (optional)
  ```

- **FR-002**: Feature index.ts MUST export only public API (components, hooks, types)
- **FR-003**: All component files MUST be PascalCase
- **FR-004**: All hook files MUST start with "use" prefix
- **FR-005**: Types MUST be in a single types.ts file (not scattered across components)

#### State Management Decision Tree

- **FR-006**: Use **Server Components** when:
  - Data fetching on initial render
  - No user interactivity required
  - SEO is important

- **FR-007**: Use **Custom Hooks** when:
  - Local state for single component or small component tree
  - Data fetching with caching (React Query pattern)
  - Reusable stateful logic

- **FR-008**: Use **Context API** when:
  - State shared across many components in feature
  - State needs to be modified by deeply nested components
  - Complex state with reducers

- **FR-009**: NEVER mix patterns within single feature without documented rationale

#### Component Patterns

- **FR-010**: Page-level components MUST be server components unless interactivity required
- **FR-011**: Client components MUST have 'use client' directive at top
- **FR-012**: Data fetching client components MUST use hooks, not useEffect
- **FR-013**: Forms MUST use React Hook Form + Zod + ActionState pattern
- **FR-014**: Loading states MUST use Suspense boundaries or dedicated loading components

#### Export Patterns

- **FR-015**: Each subdirectory (components/, hooks/, context/) MUST have index.ts
- **FR-016**: Feature index.ts MUST re-export from subdirectories
- **FR-017**: Internal components (not part of public API) MUST NOT be exported from index

### Key Entities

- **Feature**: Self-contained domain module with components, state, and types
- **Component**: UI building block, either server (default) or client
- **Hook**: Reusable stateful logic with "use" prefix
- **Context**: Shared state provider for component tree

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of features have components/, index.ts, and types.ts
- **SC-002**: 100% of features have index.ts with proper exports
- **SC-003**: Zero components with useEffect for data fetching (all use hooks or server components)
- **SC-004**: All features pass structural linting (ESLint rules for exports)
- **SC-005**: Feature pattern documentation exists and is referenced in CLAUDE.md

## Current State Audit

### Plans Feature (40 files, 11,259 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 11 subdirectories, nested structure |
| hooks/ | No | Uses context directly |
| context/ | Yes (workspace/context/) | Non-standard location |
| types.ts | Yes (session-planner/types.ts) | Non-standard location |
| index.ts | No | Missing |

**Migration Needed**:
- Create hooks/ directory for plan data operations
- Move context to standard location
- Consolidate types to feature root
- Add index.ts with exports

### Sessions Feature (8 files, 1,131 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 4 components |
| hooks/ | Yes | 2 hooks (useSessionData, useAutoSave) |
| context/ | No | Not needed |
| types.ts | No | Types in hooks |
| index.ts | Yes | Good exports |

**Migration Needed**:
- Extract types from hooks to types.ts
- Minor structure cleanup

### Athletes Feature (7 files, 1,154 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | 5 components |
| hooks/ | No | Uses useState directly |
| context/ | No | Not needed |
| types.ts | Yes | Good |
| index.ts | Yes | Good exports |

**Migration Needed**:
- Consider hooks for athlete data operations
- Otherwise good structure

### Workout Feature (16 files, 5,957 LOC)
| Directory | Exists | Status |
|-----------|--------|--------|
| components/ | Yes | Multiple subdirectories |
| hooks/ | No | Missing |
| context/ | Yes | Good |
| types.ts | Unknown | Need to verify |
| index.ts | No | Missing |

**Migration Needed**:
- Add hooks/ for workout data operations
- Add index.ts with exports
- Consolidate structure

## Implementation Plan

### Phase 1: Define Standard (Day 1)
1. Create `docs/patterns/feature-pattern.md` with full specification
2. Create ESLint plugin/rules for structure validation
3. Update CLAUDE.md to reference pattern doc

### Phase 2: Sessions Feature (Day 2) - Reference Implementation
1. Extract types to types.ts
2. Document as reference feature
3. Use as template for others

### Phase 3: Athletes Feature (Day 2-3)
1. Already mostly compliant
2. Add any missing hooks if needed
3. Verify exports

### Phase 4: Plans Feature (Days 3-5)
1. Largest feature, most migration work
2. Move context to standard location
3. Create hooks/ directory
4. Consolidate types
5. Add index.ts

### Phase 5: Workout Feature (Days 5-6)
1. Add missing index.ts
2. Create hooks/ directory
3. Consolidate structure

### Phase 6: Validation (Day 7)
1. Run structural linting on all features
2. Update feature documentation
3. Create migration guide for future features

## Pattern Documentation Draft

### When to Use Each Pattern

```
                    ┌─────────────────────┐
                    │ Need State/Effects? │
                    └─────────┬───────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                   No                  Yes
                    │                   │
                    ▼                   │
           ┌────────────────┐          │
           │ Server         │          │
           │ Component      │          │
           └────────────────┘          │
                              ┌────────┴────────┐
                              │                 │
                              ▼                 ▼
                    ┌──────────────┐   ┌──────────────┐
                    │ Local/Simple │   │ Shared/Deep  │
                    │ State?       │   │ Tree State?  │
                    └──────┬───────┘   └──────┬───────┘
                           │                  │
                           ▼                  ▼
                    ┌────────────┐     ┌────────────┐
                    │ Custom     │     │ Context    │
                    │ Hook       │     │ + Reducer  │
                    └────────────┘     └────────────┘
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `PlanCard.tsx` |
| Hook | camelCase with use prefix | `usePlanData.ts` |
| Context | PascalCase with Context suffix | `PlanContext.tsx` |
| Types | lowercase | `types.ts` |
| Index | lowercase | `index.ts` |
| Utils | kebab-case | `date-utils.ts` |
