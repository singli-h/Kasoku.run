# Kasoku.run - Next Steps Analysis
> **Generated**: October 25, 2025
> **Status**: Based on comprehensive codebase and documentation review

---

## 🚨 CRITICAL PRIORITY (Blocking MVP Launch)

### 1. **AI Integration - INCOMPLETE** ⚠️
- **Status**: 60% complete - Database ready, NO implementation
- **Impact**: Core product differentiator missing, blocking launch
- **Scope**:
  - Database tables exist: `ai_memories` (RLS disabled), `embeddings` (pgvector enabled)
  - Need AI backend implementation
  - Need UI components for AI features
  - Need access control patterns for memories table
- **Complexity**: HIGH (2-3 weeks)
- **Dependencies**: All core features complete
- **Files**: Need to create AI service layer, memory management, embedding generation
- **Priority**: **P0 - CRITICAL**

### 2. **Payment Processing - INCOMPLETE** 💰
- **Status**: 30% complete - Stripe SDK installed, webhooks stubbed
- **Impact**: Cannot monetize platform, blocking revenue
- **Location**: `app/api/stripe/webhooks/route.ts` - 3 TODO comments
- **TODOs**:
  ```typescript
  // TODO: Implement with Supabase
  // await handleSubscriptionChange(event)

  // TODO: Implement with Supabase
  // await handleCheckoutSession(event)

  // TODO: Implement these functions with Supabase when database actions are added back
  ```
- **Scope**:
  - Complete webhook handlers for subscription lifecycle
  - Implement checkout session handling
  - Create subscription management UI
  - Add billing portal integration
- **Complexity**: MEDIUM (1 week)
- **Priority**: **P0 - CRITICAL**

### 3. **Error Boundary Missing** 🛡️
- **Status**: Not implemented
- **Impact**: No graceful error recovery, crashes propagate to user
- **Location**: `components/error-boundary/` (empty directory exists)
- **Scope**:
  - Global error boundary with fallback UI
  - Error logging and reporting
  - User-friendly error messages
  - Recovery options
- **Complexity**: LOW (2-3 days)
- **Priority**: **P0 - CRITICAL**

---

## 🔴 HIGH PRIORITY (MVP Essential)

### 4. **Sessions Sprint Management - MAJOR REBUILD** 🏃
- **Status**: Needs coach-focused rebuild
- **Current**: Multi-group dashboard exists but athlete-centric
- **Required**:
  - Coach session management (input athlete results, modify plans on-the-fly)
  - Real-time session control (start/pause/stop)
  - Live performance input for multiple athletes
  - Session plan modification during active sessions
  - Bulk operations for group management
- **Database Gaps**: Session modification tracking, real-time updates, coach controls
- **Complexity**: HIGH (2 weeks)
- **Priority**: **P1 - HIGH**

### 5. **Workout Execution - UX Simplification** 💪
- **Status**: Feature complete but UX needs simplification
- **Current**: Interactive interface works but too complex
- **Required**:
  - Simplified workflow (reduce clicks, streamline progression)
  - Better mobile-first design
  - Faster data entry
  - Quick actions for set completion
  - Feature consolidation (remove complexity)
- **Pending Features**:
  - Video playback integration
  - Offline capability
  - Advanced metrics (velocity, power)
- **Complexity**: MEDIUM-HIGH (1.5 weeks)
- **Priority**: **P1 - HIGH**

### 6. **Profile Page Transformation** 👤
- **Status**: Basic settings exist, needs role-based transformation
- **Current**: Generic settings page
- **Required**:
  - **Coach Profile**: PB tracking, coaching philosophy, athlete management stats
  - **Athlete Profile**: Personal records, training history, performance metrics
  - Role-based UI (different layouts per role)
  - Performance tracking charts
  - Enhanced personal data and goals
  - Better avatar management
- **Database Gaps**: Tables for PB tracking, achievements, detailed metrics
- **Complexity**: MEDIUM (1 week)
- **Priority**: **P1 - HIGH**

### 7. **Sidebar Reorganization** 🧭
- **Status**: Exists but needs role-based reorganization
- **Current**: Generic sidebar for all users
- **Required**:
  - **Coach Sidebar**: Athletes, Sessions, Plans, Analytics, Knowledge Base
  - **Athlete Sidebar**: Workout, Performance, Profile, Library, Knowledge Base
  - Dynamic navigation based on role
  - Role-specific quick actions
  - Contextual menus
- **Complexity**: MEDIUM (3-4 days)
- **Priority**: **P1 - HIGH**

---

## 🟡 MEDIUM PRIORITY (Post-MVP)

### 8. **Knowledge Base Feature - NEW** 📚
- **Status**: Foundation exists, needs implementation
- **Scope**:
  - Coaching philosophy section
  - Research papers management
  - Knowledge base articles
  - Category management
  - Search & discovery
  - AI integration ready structure
- **Complexity**: MEDIUM (1 week)
- **Priority**: **P2 - MEDIUM**

### 9. **Exercise Planning Panel - Incomplete** 🏋️
- **Location**: `components/features/plans/workspace/components/ExercisePlanningPanel.tsx`
- **TODOs (6 instances)**:
  - Replace mock exercise library with Supabase data
  - Implement "Add exercise to session" functionality
  - Implement exercise set updates
  - Implement exercise reps updates
  - Implement exercise weight updates
  - Implement exercise notes updates
- **Complexity**: MEDIUM (3-4 days)
- **Priority**: **P2 - MEDIUM**

### 10. **Testing Coverage** 🧪
- **Status**: Infrastructure ready (Jest, Playwright), minimal tests
- **Required**:
  - Unit tests for critical paths (auth, payments, data mutations)
  - E2E tests for user flows
  - Integration tests for server actions
- **Complexity**: MEDIUM-HIGH (ongoing)
- **Priority**: **P2 - MEDIUM**

### 11. **Query Optimization** ⚡
- **Issue**: Over-fetching with `select('*')`, no pagination
- **Impact**: Performance degradation with large datasets
- **Scope**:
  - Audit all queries
  - Add pagination to lists
  - Select specific fields only
- **Complexity**: LOW-MEDIUM (ongoing)
- **Priority**: **P2 - MEDIUM**

---

## 🟢 LOW PRIORITY (Nice to Have)

### 12. **Onboarding Flow Review** 🎯
- **Status**: Complete but needs comprehensive testing
- **Required Reviews**:
  - FE: Complete workflow testing (athlete vs coach paths)
  - BE: Data validation and error handling
  - UX: Step progression and validation feedback
  - Integration: Clerk user creation and profile sync
- **Complexity**: LOW (2-3 days testing)
- **Priority**: **P3 - LOW**

### 13. **Athletes Page Enhancements** 👥
- **Status**: Complete, pending enhancements
- **Pending**:
  - Advanced bulk messaging
  - Profile picture uploads
  - Bulk operations UX refinement
- **Complexity**: LOW-MEDIUM (3-4 days)
- **Priority**: **P3 - LOW**

### 14. **Plans Advanced Features** 📊
- **Pending**:
  - Advanced template marketplace
  - Plan progression automation
  - Copy/clone functionality
- **Complexity**: MEDIUM (1 week)
- **Priority**: **P3 - LOW**

---

## 📊 TODO Comments Summary

**Total**: 33 occurrences across 18 files

### High Impact TODOs:
1. **Stripe Webhooks** (3 TODOs) - CRITICAL
2. **Exercise Planning Panel** (6 TODOs) - MEDIUM
3. **Workout Components** (5 TODOs) - LOW

### By File:
- `app/api/stripe/webhooks/route.ts`: 3 (CRITICAL)
- `components/features/plans/workspace/components/ExercisePlanningPanel.tsx`: 6
- `components/features/workout/components/exercise/exercise-dashboard.tsx`: 5
- `components/features/plans/workspace/PlanWorkspace.tsx`: 2
- `components/features/plans/workspace/components/AssignmentPanel.tsx`: 2
- `components/features/onboarding/onboarding-wizard.tsx`: 2
- Others: 1 each

---

## 🎯 Recommended Immediate Next Steps

### Week 1-2: Critical Path (P0)
1. **Error Boundary Implementation** (2-3 days)
   - Create global error boundary
   - Add error logging
   - Implement fallback UI

2. **Stripe Payment Integration** (5-7 days)
   - Complete webhook handlers
   - Implement subscription lifecycle
   - Add billing UI

### Week 3-4: AI Integration (P0)
3. **AI Backend Implementation** (10-14 days)
   - Set up AI service layer
   - Implement memory management
   - Create embedding generation
   - Build UI components
   - Add access control

### Week 5-6: UX Improvements (P1)
4. **Session Sprint Management** (7-10 days)
   - Coach-focused session control
   - Real-time performance input
   - Bulk operations

5. **Workout UX Simplification** (7-10 days)
   - Streamline workflow
   - Mobile optimization
   - Quick actions

### Week 7: Polish (P1)
6. **Profile Transformation** (5-7 days)
   - Role-based profiles
   - PB tracking
   - Performance charts

7. **Sidebar Reorganization** (3-4 days)
   - Role-based navigation
   - Quick actions

---

## 🚀 MVP Launch Checklist

**Blocking Items** (Must Complete):
- [ ] AI Integration (60% → 100%)
- [ ] Payment Processing (30% → 100%)
- [ ] Error Boundary (0% → 100%)

**High Priority** (Should Complete):
- [ ] Sessions Sprint Management Rebuild
- [ ] Workout UX Simplification
- [ ] Profile Page Transformation
- [ ] Sidebar Reorganization

**Medium Priority** (Nice to Have):
- [ ] Knowledge Base Implementation
- [ ] Exercise Planning Panel Completion
- [ ] Testing Coverage Improvement
- [ ] Query Optimization

**Current Overall Progress**: 88% MVP Complete

**Estimated Time to MVP**: 6-8 weeks (with critical path items)

---

## 📝 Notes

1. **AI Integration** is the biggest blocker - 2-3 weeks of focused work
2. **Payment Processing** must be done for revenue - 1 week focused work
3. **Error Boundary** is quick win for stability - 2-3 days
4. Many features are complete but need UX refinement
5. Testing coverage should be added incrementally with each feature
6. Query optimization can be done as performance issues arise

**Documentation References**:
- CLAUDE.md - Known Issues & Technical Debt
- docs/changelog/ProgressOverview.md - Epic Tracker
- docs/features/kasoku-rebuild-product-requirements.md - Full PRD
