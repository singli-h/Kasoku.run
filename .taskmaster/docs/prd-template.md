MVP PRD Template
A concise, focused Product Requirements Document template for individual MVPs

1. Vision & Scope
Goal: Align team on the problem being solved and define boundaries. 
Approach:
Vision Statement: 1-2 sentence summary of this MVP’s purpose (e.g., “Enable Client Team to create tasks via AI Interview”).
In-Scope: List core deliverables for this MVP.
Out-of-Scope: Explicitly note what will be deferred.

2. Personas & User Stories
Goal: Capture key user needs to drive acceptance criteria. 
Approach:
Persona Definitions: Brief profile (role, pain point) for each: Admin, Client Team, Client.
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
Key Metrics: 2–3 metrics (e.g., signup conversion, task creation success rate).
Release Checkpoints: Must-have functionality, basic usability, stability (no critical errors).
MVP Exit Criteria: What constitutes “done” for this MVP.
Timeline: Outline clear delivery milestones (e.g., foundation setup: 1–2 days, UI & backend: 2–4 days, AI integration: 3–5 days, testing & deployment: 1–2 days).

5. Architecture Overview & Figma Visualization
Goal: Provide a high-level architecture diagram for alignment and handoff. 
Approach:
Tech & Decision Summary: Bullet top-level stack/tools (e.g., Next.js, Clerk, Supabase, n8n, Mem0, ChatSDK) and the reason for choosing such a stack and tools.
Figma Diagram: Embed or link to Figma file showing system overview (data flow, service interactions).
Database Schema Review: Based on the User story and new features, review the need to refine or refactor the database schema.

6. Step-by-Step Development Guide
Goal: Break MVP delivery into actionable tasks. 
Approach:
Foundation Setup: Scaffold project, install auth, DB schema.
Core UI: Build login, dashboard skeleton.
Backend Hooks: Connect n8n endpoints / APIs.
AI Integration: Wire ChatSDK/CrewAI, Mem0 memory tooling.
Testing & QA: Manual smoke tests, basic error handling.
Deploy & Validate: Deploy to preview, verify metrics.

7. Risks & Mitigations
Goal: Surface potential blockers and plan contingencies. 
Approach:
Technical Risk: e.g., AI latency—Mitigation: implement caching or async fallback.
Scope Risk: e.g., overcomplex features—Mitigation: defer non-essential to future MVP.
Resource Risk: e.g., team capacity—Mitigation: limit stories to top priorities, stagger work.
Security Risk: Improper role-based access or RLS misconfiguration—Mitigation: Enforce Supabase RLS policies at the database layer.

8. Error Handling & Best Practices
Goal: Ensure robust error management and follow coding, design, and infrastructure best practices for AI-driven rapid MVP development. 
Approach:
Centralized Error Handling: Implement a global error boundary on the front end and a middleware for backend exceptions.
Retries & Fallbacks: For AI and n8n calls, use exponential backoff and graceful fallback responses (e.g., cached data or user-friendly messages), We want to make sure a Guaranteed delivery.
Validation & Sanitization: Rigorously validate inputs before API calls; sanitize all user-generated content.
Pitfalls to Avoid: Avoid deep coupling between AI logic and UI; prevent blocking the main thread with synchronous AI calls.
Infrastructure Resilience: Use simple circuit breakers for external API dependencies; ensure services degrade gracefully.
Naming Conventions: Strictly follow the documentation on Github Repository for each aspect’s unique naming convention

9. Analytics & Performance Monitoring
Goal: Instrument key events and performance metrics to validate success and monitor system health. 
Approach:
Event Tracking (PostHog): Track high-level events such as signup_success, task_created_via_ai, memory_retrieved, and n8n_workflow_executed.
Performance Metrics: Log latency for AI responses, memory lookups, and API endpoints. Define basic thresholds (e.g., AI response < 2s).
AI Agent/Codpliot Evaluation: Observe and examine the performance of AI-generated tasks, instructions, context retrieval, and results. And improve the custom prompt and instruction.
10. Documentation Processes
Documentation Artifacts:


Google Docs: High-level vision, stakeholder notes, compliance or legal docs (if any)


In-Repo PRDs: Each feature’s [feature]-prd.md under its folder


Code Comments: Key business logic, especially around AI prompting, memory retrieval, and n8n integration
cursor.rules.json: Guidelines for coding, comment style and formatting.


Architecture Diagrams: Stored in shared Figma links


Progress Notes:
What to Capture:
Date and developer name/handle.


Brief description of work completed (e.g., “Integrated Mem0 user-level memory API and verified CRUD operations”).


Any blockers or decisions made (e.g., “Opted to defer ChatSDK until V2 due to integration complexity”).


References to GitHub issues or pull requests (e.g., “PR #42: Added Supabase RLS policies”).


Format:
	YYYY-MM-DD – @Sing  
- Completed: [Short summary of implementation]  
- Decisions: [Any design/tech choices or trade-offs]  
- Blockers/Notes: [Outstanding issues or needed follow-ups]  
- References: [Link to GitHub issue/PR or Google Doc section]

Frequency:


Add one entry per significant development session or milestone.


On merge to main or feature completion, ensure final progress note reflects “Feature Complete” with date, time, and any post-merge steps (testing, deployment).
11. Extra information
Development Philosophy
Rapid, Modular, Scalable: Deliver working increments fast while keeping components independent and reusable.
AI-Driven Development: Leverage v0.dev, Cursor (with project-specific rules), and task-master-ai to automate PRD creation, task breakdown, and code generation.
Visualized Planning & Decision: Use Figma for high-level architecture and workflow diagrams (Sing create and Jon approve).
Security & Performance: Embed authentication best practices (Clerk/RBAC), efficient data access, and performance tuning from day one.

Core Principles & Updates
Modular Architecture
Each feature is in its own folder under apps/web/components/features/.
Include a PRD (prd.md) and overview ([feature]Overview.md) in each feature module.
Monorepo Management
Monorepo structure (Turborepo): apps/web, apps/chrome-extension, apps/backend
AI Tooling
PRD Generation: Use task-master-ai’s PRD template; refine prompt until approved.
Component Generation: Target ~100% via v0.dev; iterate on PRD or prompts when missing.
Code Refinement: Cursor with dedicated rules (inspired by McKay’s starter repo).
Documentation
Maintain PRDs, README, and design-decision notes per feature.
Communicate vision and acceptance criteria