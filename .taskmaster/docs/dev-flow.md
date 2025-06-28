# AI-Assisted Development Flow

A concise, opinionated checklist for using Cursor (o3), Taskmaster-AI, Supabase, and the MCP web-eval-agent to ship high-quality features **fast** and **safely**.

---

## 0. Prerequisites

- Cursor is connected to your project folder and the **o3** model is selected.
- Taskmaster project has been initialised (`task-master init`) and a PRD template is available at [`example_prd.txt`](mdc:.taskmaster/templates/example_prd.txt).
- Supabase database & RLS policies are already configured.
- `web-eval-agent` is installed (for UX smoke-tests).

---

## 1. Discovery & Problem Definition

| Step | Why | How |
|------|-----|------|
| 1.1 | Build **mental model** of existing code | In Cursor: `rg "export .* function"` or use semantic search. Ask o3: *"List every file that touches xyz."* |
| 1.2 | Capture findings | `update_memory` if user-level; otherwise append to project docs.
| 1.3 | Validate expectations | Run existing unit/integration tests & skim CI logs.

### 🔧 Prompt Snippet – Repository Recon
```text
🧠  You are the thinking model.
Goal: Map out everything related to <feature>.
Please list:
  • Relevant directories & key files (with short 1-line purpose)
  • Cross-cutting dependencies (e.g. shared hooks, env vars)
  • Known pitfalls / historical bugs in this area
Return as a markdown bullet list.
```

---

## 2. Author the PRD (Product / Patch Requirements Doc)

1. Copy `example_prd.txt` → `MVP_<feature>_PRD.md` and fill in:
   - Problem statement, success metrics, non-goals.
   - Technical constraints (libraries, target p99 latency, etc.).
   - **Risk & Edge-Case Analysis:** list potential failure modes (*e.g.* "Supabase JWT expires mid-session", "Network partition during streaming upload") and how the system should respond.
   - **Acceptance Criteria:** bullet list that can be unambiguously turned into tests.
     - *Always include:* "CI fails on ESLint, TypeScript, or RLS policy violations."
2. Paste PRD into Cursor and ask o3 to **critique** it for missing acceptance-criteria, risks, or edge-cases.
3. Ask o3 to **convert every acceptance criterion into at least one test case / QA checklist item.**
4. Iterate until ✅.

### 🔧 Prompt Snippet – PRD Review & Test Extraction
```text
Here is the draft PRD for <feature> (below).
1. Act as Staff-Eng; highlight vague areas, missing risks, or edge-cases.
2. Convert each acceptance criterion into at least one concrete test case (unit, integration, or manual QA) and output a checklist.
Return the result as:
  ## Gaps / Questions
  • ...
  ## Derived Test Plan
  - [ ] <test 1>
  - [ ] <test 2>
<PRD here>
```

---

## 3. Generate Initial Tasks

```bash
# Parse PRD → tasks.json & markdown files
npx task-master-ai parse-prd --input=.taskmaster/docs/MVP_<feature>_PRD.md --num-tasks=~10 -y
npx task-master-ai generate  # creates tasks/task_*.txt
```
*Tip: We automatically run `generate` after Parse per team preference.*

---

## 4. Analyse Complexity & Expand

```bash
# Score tasks 1-10 for complexity
npx task-master-ai analyze-complexity --research --threshold=5

# Expand only complex tasks; use --force to replace existing
npx task-master-ai expand --id=<taskId> --num=<n> --research --force
```

For each expansion **review** subtasks and **merge-edit** titles if needed.

---

## 4.5. Parallel Development Setup (Advanced)

**🚀 BREAKTHROUGH: Dual-Cursor Parallel Development**

For complex features with multiple independent tasks, leverage parallel development:

### Setup
1. **Open two Cursor instances** pointing to the same workspace
2. **Analyze task interference levels** before assignment:
   ```bash
   # Check which files each task will touch
   npx task-master-ai show <taskId1>
   npx task-master-ai show <taskId2>
   ```
3. **Assign low-interference tasks** to different Cursor instances:
   - ✅ Frontend + Backend split
   - ✅ Different feature domains (auth vs. chat)
   - ✅ Independent components/actions
   - ❌ Same files or shared dependencies

### Coordination Protocol
| Scenario | Primary Cursor | Secondary Cursor | Debug Strategy |
|----------|----------------|------------------|----------------|
| Normal development | claude-4-sonnet model | o3 model | Each handles own issues |
| Build failures | o3 model | **Opus model** | Opus debugs complex issues |
| UI/UX heavy tasks | v0/claude-4-sonnet implementation | **WebEval agent** (background) | Automated UX validation |

### Best Practices
- **Real-time sync**: File changes reflect immediately across instances
- **Task segregation**: Minimize cross-workspace conflicts upfront
- **Coordinated commits**: One workspace per logical commit to avoid merge conflicts
- **Background agents**: Use WebEval for long-running UI tests while continuing development

---

## 5. Enrich Tasks (Paths, Criteria, Pitfalls)

"A task without file paths & tests is a bug magnet."

1. Open each (sub)task markdown file.
2. Add:
   - **`Path:`** `/apps/web/actions/chat/message-actions.ts` (use wildcards if many).
   - **`Lines:`** `34-68` (approx).
   - **Acceptance-Criteria:** bullet list → *CI fails on eslint rule `no-star-select` violations*.
   - **Pitfalls / Rules:** link to relevant rules e.g. `[RLS pattern](mdc:.cursor/rules/supabase_rls.mdc)`.
   - **Interference Level:** `LOW/MEDIUM/HIGH` - affects parallel task assignment
3. Save; run `task-master generate` again so JSON mirrors markdown.

### 🔧 Prompt Snippet – Enrich a Subtask
```text
Please append to subtask 4.3:
Path: apps/web/lib/supabase.ts (func createServerSupabaseClient)
Lines: ~120-180
Interference Level: HIGH (shared utility)
Acceptance-Criteria:
  • Every request gets a unique JWT.
  • Unit test proves client tokens differ across two simulated requests.
Pitfalls:
  • DO NOT memoise at module scope – leaks JWT.
  • Must respect RLS helper pattern.
```

---

## 6. Implementation Loop (per Subtask)

| # | Action | Command / Tool | Parallel Notes |
|---|--------|----------------|----------------|
| 1 | Mark **in-progress** | `task-master set-status --id=<id> --status=in-progress` | Coordinate with other Cursor instance |
| 2 | Exploration notes | `task-master update-subtask --id=<id> --prompt="Findings…"` | Document interference discoveries |
| 3 | Code edit | Use Cursor; keep changes tight; follow rules. | Monitor file conflicts |
| 4 | Unit / Integration tests | `npm run test` or vitest; ensure green. | Run in assigned workspace |
| 5 | Supabase checks | Verify RLS via supabase SQL editor if schema touched. | Coordinate schema changes |
| 6 | web-eval-agent UX run | ```
<web-eval-agent>
{"url":"http://localhost:3000","task":"Smoke-test <feature> flow: login → do X → ensure no console errors"}
``` | Can run in background on secondary Cursor |
| 7 | **Enhanced Documentation** | `task-master update-subtask --id=<id> --prompt="COMPLETION: Detailed results and actions taken: <specifics>"` | **NEW**: Document actual implementation |
| 8 | Commit & mark **done** | `git commit -m "feat: implement <subtaskId> …"` then `task-master set-status --id=<id> --status=done` | Coordinate commits to avoid conflicts |

### 🔧 Enhanced Documentation Prompt Template
```text
COMPLETION REPORT for subtask <id>:

ACTIONS TAKEN:
• Modified files: <list with specific changes>
• Added functions/components: <names and purposes>
• Database changes: <schema/RLS updates if any>
• Dependencies added: <if any>

RESULTS:
• Tests passing: <specific test names>
• Performance impact: <if measured>
• Edge cases handled: <list>

DEVIATIONS FROM PLAN:
• <any changes from original subtask description>
• <rationale for changes>

CONTEXT FOR FUTURE TASKS:
• <what future tasks should know>
• <potential conflicts or dependencies created>
```

Repeat until parent task finishes, then advance dependency chain with `next`.

---

## 7. Debugging & Profiling

- **API perf**: use `k6` scripts stored in `scripts/perf/` and aim for ≤100 ms p99.
- **Cache metrics**: expose Prometheus counters (`cache_hits`, `cache_evictions`).
- **Database**: inspect pg_stat_statements for full-table scans (usually means rogue `select('*')`).
- **Parallel debugging**: Use Opus model for complex multi-workspace build failures

---

## 8. Documentation & Rule Upkeep

1. If you introduced a new pattern, add or update a rule file under `.cursor/rules/` (see rule template).
2. Append a progress note in `daily-updates/yyyymmdd.md`.
3. Ensure public docs (README / feature-PRD) reflect final behaviour.
4. **Update task files** with detailed completion reports for future reference.
5. **Generate CEO-facing Daily Summary:** Use Cursor's chat-history summarization to create a concise, executive-level recap.
   ```text
   🔧 Prompt Snippet – Daily Chat Summary
   "Cursor, please summarise today's entire chat session into 5-7 bullet points highlighting key decisions, blockers, breakthroughs, and next steps. Format for CEO readability."
   ```
   - Copy the summary into `daily-updates/yyyymmdd.md` under a **CEO SUMMARY** heading.
   - Treat it like a human-friendly `git push` message: high-signal, low-noise, outcome-focused.
   - Optionally automate via a small script that fetches Cursor chat logs and appends the summary.

---

## 9. Deployment & Monitoring

```bash
npm run build && vercel --prod   # Next.js

# Validate health
curl https://<prod>/api/health
web-eval-agent …                 # run UX regression suite
```
- Monitor Supabase dashboard & PostHog funnels for regressions.
- Have rollback checklist ready (task 10 subtasks).

---

## Appendix – One-Liner Prompt Templates

| Purpose | Prompt |
|---------|--------|
| Repo recon | *"List all files touching <feature>; summarise each in 1 line."* |
| Critique PRD | *"Act as Staff-Eng; where is this PRD vague or risky?"* |
| Generate PRD from idea | *"Draft a PRD for <idea> using our template; assume Next.js + Supabase."* |
| Expand task | *"Break task <id> into ~5 subtasks considering complexity report & best practices."* |
| Enrich subtask | *"Append to subtask <id>: Path … Lines … Interference Level … Criteria … Pitfalls …"* |
| Task interference analysis | *"Analyze tasks <id1> and <id2>: will they conflict if developed in parallel? List shared files/dependencies."* |
| Completion documentation | *"Document what was actually implemented for subtask <id>: files changed, functions added, deviations from plan."* |
| UX smoke-test | `{ "url": "http://localhost:3000", "task": "Signup → create project → expect success toast" }` |

---

**Follow this checklist religiously and you'll keep AI, humans, and production in harmony while maximizing development velocity through intelligent parallelization.**