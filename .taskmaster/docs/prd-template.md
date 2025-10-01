MVP PRD Template
A concise, focused Product Requirements Document template for individual MVPs

1. Vision & Scope
Goal: Align team on the problem being solved and define boundaries. 
Approach:
Vision Statement: 1-2 sentence summary of this MVP's purpose (e.g., "Enable coaches to manage athlete training programs").
In-Scope: List core deliverables for this MVP.
Out-of-Scope: Explicitly note what will be deferred.

2. Personas & User Stories
Goal: Capture key user needs to drive acceptance criteria. 
Approach:
Persona Definitions: Brief profile (role, pain point) for each: Coach, Athlete, Admin.
User Stories: 2–3 top-priority stories per persona in the format:
As a [persona], I want [action] so that [benefit].

3. Features & Logical Dependency Chain
Goal: Prioritize and sequence features for rapid, incremental delivery. 
Approach:
Feature & Component List: Bullet core capabilities for this MVP and required components.
Dependency Chain: Order features by what must come first (foundation) → next (usable front end) → enhancements.
Atomic Scope: Ensure each feature can be built, tested, and shipped independently.

4. Success Metrics & Release Criteria & Timeline
Goal: Define clear, measurable goals, conditions for launch, and delivery timeline. 
Approach:
Key Metrics: 2–3 metrics (e.g., user engagement, feature adoption rate).
Release Checkpoints: Must-have functionality, basic usability, stability (no critical errors).
MVP Exit Criteria: What constitutes "done" for this MVP.
Timeline: Outline clear delivery milestones (e.g., foundation setup: 1–2 days, UI & backend: 2–4 days, testing & deployment: 1–2 days).

5. Architecture Overview & Database Design
Goal: Provide a high-level architecture diagram for alignment and handoff. 
Approach:
Tech & Decision Summary: Bullet top-level stack/tools (e.g., Next.js, Clerk, Supabase, React Hook Form, Zod) and the reason for choosing such a stack and tools.
Database Schema Review: Based on the User story and new features, review the need to refine or refactor the database schema.
RLS Policy Design: Define Row-Level Security policies for data isolation and access control.

6. Step-by-Step Development Guide
Goal: Break MVP delivery into actionable tasks. 
Approach:
Foundation Setup: Scaffold project, install auth, DB schema with RLS policies.
Core UI: Build login, dashboard skeleton with proper error boundaries.
Backend Actions: Implement server actions using singleton Supabase client with Clerk auth.
Testing & QA: Manual smoke tests, basic error handling, RLS policy validation.
Deploy & Validate: Deploy to preview, verify metrics and security.

7. Risks & Mitigations
Goal: Surface potential blockers and plan contingencies. 
Approach:
Technical Risk: e.g., database performance—Mitigation: implement proper indexing and query optimization.
Scope Risk: e.g., overcomplex features—Mitigation: defer non-essential to future MVP.
Resource Risk: e.g., team capacity—Mitigation: limit stories to top priorities, stagger work.
Security Risk: Improper RLS configuration or data leakage—Mitigation: Enforce Supabase RLS policies at the database layer, validate user access patterns.

8. Error Handling & Best Practices
Goal: Ensure robust error management and follow coding, design, and infrastructure best practices for rapid MVP development. 
Approach:
Centralized Error Handling: Implement a global error boundary on the front end and proper error handling in server actions.
Authentication Pattern: Use Clerk auth with `getDbUserId()` helper for user ID conversion.
Validation & Sanitization: Rigorously validate inputs with Zod schemas; sanitize all user-generated content.
Pitfalls to Avoid: Avoid direct Supabase client usage in components; prevent bypassing RLS policies.
Infrastructure Resilience: Use proper error boundaries and graceful degradation patterns.
Naming Conventions: Strictly follow the documentation on Github Repository for each aspect's unique naming convention.

9. Analytics & Performance Monitoring
Goal: Instrument key events and performance metrics to validate success and monitor system health. 
Approach:
Event Tracking (PostHog): Track high-level events such as user_actions, feature_adoption, and error_occurrences.
Performance Metrics: Log latency for database queries, API endpoints, and user interactions. Define basic thresholds (e.g., page load < 2s).
Database Performance: Monitor query performance, RLS policy effectiveness, and connection pooling.
10. Documentation Processes
Documentation Artifacts:

Google Docs: High-level vision, stakeholder notes, compliance or legal docs (if any)

In-Repo PRDs: Each feature's [feature]-prd.md under its folder

Code Comments: Key business logic, especially around RLS policies, server actions, and data access patterns
cursor.rules.json: Guidelines for coding, comment style and formatting.

Architecture Diagrams: Database schema diagrams and RLS policy documentation

Progress Notes:
What to Capture:
Date and developer name/handle.

Brief description of work completed (e.g., "Implemented RLS policies for athlete data isolation and verified access controls").

Any blockers or decisions made (e.g., "Opted to use organization-scoped RLS instead of user-level for better data isolation").

References to GitHub issues or pull requests (e.g., "PR #42: Added Supabase RLS policies").

Format:
	YYYY-MM-DD – @Sing  
- Completed: [Short summary of implementation]  
- Decisions: [Any design/tech choices or trade-offs]  
- Blockers/Notes: [Outstanding issues or needed follow-ups]  
- References: [Link to GitHub issue/PR or Google Doc section]

Frequency:

Add one entry per significant development session or milestone.

On merge to main or feature completion, ensure final progress note reflects "Feature Complete" with date, time, and any post-merge steps (testing, deployment).

11. Supabase RLS Considerations
RLS Policy Requirements:
Data Isolation: Ensure proper user-level data isolation using RLS policies based on Clerk user IDs.
Authentication Pattern: Use `auth.jwt() ->> 'sub'` for user identification in RLS policies.
Policy Testing: Validate RLS policies with different user roles (athlete, coach, admin).
Security Review: Regular audit of RLS policies to prevent data leakage between users.

Database Design Principles:
Schema Consistency: Keep database types in sync with live schema via `apps/web/types/database.ts`.
Migration Strategy: Use Supabase migrations for schema changes, update types immediately after.
Performance: Implement proper indexing for RLS policy conditions and frequently queried columns.
User ID Mapping: Use `getDbUserId()` helper to convert Clerk IDs to database user IDs.

12. Development Philosophy
Rapid, Modular, Scalable: Deliver working increments fast while keeping components independent and reusable.
Security-First Development: Embed RLS policies, proper authentication, and data isolation from day one.
Type-Safe Development: Maintain strict TypeScript types aligned with database schema.
Performance-Conscious: Optimize queries, implement proper caching, and monitor database performance.

Core Principles & Updates
Modular Architecture
Each feature is in its own folder under apps/web/components/features/.
Include a PRD (prd.md) and overview ([feature]Overview.md) in each feature module.
Monorepo Management
Monorepo structure (Turborepo): apps/web, apps/chrome-extension, apps/backend
Supabase Integration
Server Actions: All database operations go through authenticated server actions using singleton client.
Type Safety: Keep `apps/web/types/database.ts` synchronized with live schema.
RLS Enforcement: Use RLS policies at database level with Clerk authentication.
Documentation
Maintain PRDs, README, and design-decision notes per feature.
Document RLS policies and data access patterns.
Communicate vision and acceptance criteria