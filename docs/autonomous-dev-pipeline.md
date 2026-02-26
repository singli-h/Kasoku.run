# Autonomous Dev Pipeline — Kasoku.run

> How OpenClaw, Claude Code, and Cursor Cloud Agents work together so you don't have to babysit anything.

---

## How Your Settings Files Work (The Simple Version)

You have **3 layers** of settings. Think of it like clothing — inner layer applies first, outer layer overrides:

```
LAYER 1 (underwear):  ~/.claude/settings.json
                      → Applies to ALL projects on your Mac
                      → Currently has: guard-destructive hook, on-task-complete hook, plugins

LAYER 2 (shirt):      Kasoku.run/.claude/settings.json
                      → Applies only to Kasoku.run project
                      → Currently has: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
                      → Shared via git (teammates see it too)

LAYER 3 (jacket):     Kasoku.run/.claude/settings.local.json
                      → Applies only to Kasoku.run, only on YOUR machine
                      → Currently has: all the permission allows (Bash(*), Read, Write, etc.)
                      → Git-ignored (your personal config)
```

**What this means:**
- Your global hooks (guard + notification) already fire on every project including Kasoku.run
- But there are NO hooks forcing Claude to **test → fix → retest** before completing tasks
- The quality gate script exists but nothing calls it automatically
- Adding hooks to Layer 2 (project settings.json) makes them fire for Kasoku.run only

---

## What You Have Now (It's Already 80% There)

```
┌─────────────────────────────────────────────────────────────┐
│  YOU (Telegram)                                             │
│  "fix the login bug on kasoku"                              │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  OpenClaw (Gateway on :18789)                               │
│  Routes message → dev-bridge skill                          │
│  dev-bridge: parse → refine prompt → dispatch.sh            │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  dispatch.sh (fire-and-forget)                              │
│  claude -p "<prompt>" --dangerously-skip-permissions        │
│  Runs in background, returns immediately                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude Code (headless, in Kasoku.run repo dir)             │
│  Loads: CLAUDE.md + .claude/agents/ + .claude/skills/       │
│  Has: implementer, debugger, code-reviewer, browser-tester  │
│  Codes autonomously for up to 30 turns                      │
└──────┬──────────────────────────────────────────────────────┘
       │ (finishes or hits turn limit)
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Stop/SessionEnd hook → on-task-complete.sh                 │
│  Writes latest.json + pending-wake.json                     │
│  Pings OpenClaw wake event                                  │
│  Sends Telegram DM to you with results                      │
└─────────────────────────────────────────────────────────────┘
```

**Also running on a schedule:**
- `kasoku-pm-morning` (9 AM HKT): Reads specs, picks tasks, dispatches
- `kasoku-pm-afternoon` (3 PM HKT): Checks results, dispatches next or escalates

---

## What's Missing (The 20% Gap)

### Gap 1: No Self-Correcting Loop

Right now Claude Code runs → finishes → reports. If the build is broken after its changes, it just tells you "build failed" and stops. Nobody auto-fixes it.

**What should happen:**
```
Claude finishes coding
  → Stop hook runs tests (tsc + lint + jest)
  → Tests fail?
    → YES: Feed failure back to Claude → Claude keeps working → re-test → loop
    → NO: Allow stop → notify you "all green"
```

### Gap 2: Quality Gate Not Wired to Hooks

`.claude/scripts/task-quality-gate.sh` exists but:
- Only checks tsc + lint (no `npm test`)
- Not connected to any hook — nothing calls it automatically
- TaskCompleted hook doesn't exist yet

### Gap 3: No Visual E2E (Video)

Your browser-tester takes screenshots. Cursor Cloud Agents record video. For reviewing flows like onboarding, workout creation, plan assignment — video is significantly better.

### Gap 4: Cursor Cloud Agents Can't Be Triggered by OpenClaw

OpenClaw can trigger Claude Code (via dispatch.sh). But it **cannot** trigger a Cursor Cloud Agent — there's no API for that. Cursor Cloud Agents must be started manually from the Cursor app or cursor.com/agents.

---

## The Plan: 3 Changes + 1 Manual Process

### Change 1: Add Self-Correcting Loop (Stop Hook)

**File:** `Kasoku.run/.claude/settings.json` (project-level, shared via git)

Add an **agent-based Stop hook** that runs the test suite before Claude is allowed to stop. If tests fail, Claude gets the failure as feedback and keeps working.

```json
{
  "environment": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify the code is in a good state. Run these commands in sequence from the repo root and check each result:\n\n1. cd /Users/kimmybear/Documents/GitHub/Kasoku.run && npx tsc --noEmit 2>&1 | tail -30\n2. cd /Users/kimmybear/Documents/GitHub/Kasoku.run && npx next lint --quiet 2>&1 | tail -20\n3. cd /Users/kimmybear/Documents/GitHub/Kasoku.run && npm test -- --passWithNoTests 2>&1 | tail -30\n\nIf ALL pass, respond: {\"ok\": true}\nIf ANY fail, respond: {\"ok\": false, \"reason\": \"<paste the actual error output so the main agent can fix it>\"}\n\nDo NOT mark ok:true if there are TypeScript errors, lint errors, or test failures.",
            "timeout": 120
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/scripts/task-quality-gate.sh"
          }
        ]
      }
    ]
  }
}
```

**How it works:**
1. Claude codes and finishes a task
2. **TaskCompleted hook** fires → quality gate runs tsc + lint + tests
   - Fail? → Task stays incomplete, Claude gets error output, tries to fix
3. When Claude tries to stop entirely:
4. **Stop hook** fires → a sub-agent runs full verification
   - Fail? → Claude gets `{ok: false, reason: "..."}` and continues working
   - Pass? → Claude is allowed to stop → on-task-complete.sh fires → you get notified

**Important:** The Stop hook checks `stop_hook_active` automatically (built into agent-type hooks) so it won't infinite loop. After the Stop hook's sub-agent runs and says "ok: false", the main agent gets one more attempt. If it fails again, Claude stops (prevents infinite token burn).

### Change 2: Upgrade Quality Gate Script

**File:** `Kasoku.run/.claude/scripts/task-quality-gate.sh`

Add `npm test` to the quality gate:

```bash
#!/bin/bash
# Quality gate for agent team task completion
# Called by TaskCompleted hook — blocks task completion if checks fail
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Running quality gate checks..."

# 1. TypeScript compilation
echo "  Checking TypeScript..."
if ! npx tsc --noEmit --pretty 2>&1 | tail -20; then
  echo "  TypeScript: FAIL" >&2
  exit 2
fi
echo "  TypeScript: PASS"

# 2. Lint
echo "  Running lint..."
if ! npx next lint --quiet 2>&1 | tail -10; then
  echo "  Lint: FAIL" >&2
  exit 2
fi
echo "  Lint: PASS"

# 3. Unit tests (if any exist)
echo "  Running tests..."
if ! npm test -- --passWithNoTests 2>&1 | tail -20; then
  echo "  Tests: FAIL" >&2
  exit 2
fi
echo "  Tests: PASS"

echo "All quality gate checks passed."
```

**Key change:** Exit code `2` (not `1`) — this is what Claude Code uses to mean "block the action and give feedback."

### Change 3: Cursor Cloud Agent — Manual Overnight Visual QA

Since OpenClaw can't trigger Cursor Cloud Agents programmatically, this is a **manual step you do before sleep**:

#### Setup (One-Time)
1. Go to [cursor.com/onboard](https://cursor.com/onboard) and connect the Kasoku.run repo
2. In Cursor Cloud Agent settings, add your secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - (Skip service role key — cloud agent shouldn't have it)
3. Allowlist domains: `fonts.googleapis.com`, `fonts.gstatic.com`, `*.supabase.co`, `*.clerk.dev`, `*.clerk.accounts.dev`

#### Nightly Routine (2 minutes before bed)
Open Cursor → Cloud Agents → New Agent → paste one of these prompts:

**Prompt A: Full App Walkthrough**
```
Build and start the Next.js app. Then test these flows in the browser and record your work:

1. Visit the landing page — check layout, responsiveness, links
2. Sign up as a new Individual user (use test credentials)
3. Complete the onboarding flow
4. Create a training plan using the AI assistant
5. Log a workout session
6. Check the dashboard shows the logged workout
7. Test mobile viewport (375px width) for each page

For each step: interact with the UI, check for errors, note any visual issues.
Produce a summary of what worked and what didn't.
```

**Prompt B: Specific Feature Check**
```
Build and start the app. Test the [feature name] flow:
1. [step 1]
2. [step 2]
...
Record a video demo and note any issues.
```

**What you get in the morning:**
- A PR with video recordings of the agent navigating your app
- Screenshots of key states
- A summary of what worked / what broke

#### Limitations to Know
- If Clerk auth doesn't work in the cloud VM (common issue), the agent can only test unauthenticated pages (landing, marketing)
- No Supabase data unless you seed it in the cloud env
- The video quality is "good enough" — it's AI navigating, not pixel-perfect recording

---

## The Complete Architecture (Hybrid)

```
╔═══════════════════════════════════════════════════════════════════╗
║  OVERNIGHT: Cursor Cloud Agent (Manual Start)                    ║
║  You kick it off before bed → wakes up to video + PR             ║
║  WHAT: Visual regression, UX flow walkthrough                    ║
║  WHEN: Before major releases or weekly                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  DAILY: OpenClaw kasoku-pm (Automatic, Cron)                     ║
║  9 AM: Pick task → dispatch to Claude Code → morning report      ║
║  3 PM: Check result → dispatch next or escalate → afternoon msg  ║
║  WHAT: Feature implementation, bug fixes, code quality           ║
╠═══════════════════════════════════════════════════════════════════╣
║  ON-DEMAND: Telegram → dev-bridge → dispatch.sh                  ║
║  You message Kimmy → dispatches Claude Code → notifies when done ║
║  WHAT: Urgent fixes, quick tasks, specific requests              ║
╠═══════════════════════════════════════════════════════════════════╣
║  EVERY TASK: Claude Code Self-Correcting Loop (NEW — Hooks)      ║
║  Code → test → fail? → fix → retest → pass → stop → notify      ║
║  WHAT: Ensures every change passes tsc + lint + tests            ║
║  WHERE: Stop hook + TaskCompleted hook in .claude/settings.json  ║
╠═══════════════════════════════════════════════════════════════════╣
║  EVERY TASK: Guard + Notify (Existing Global Hooks)              ║
║  guard-destructive.sh: blocks rm -rf, git push, DROP TABLE       ║
║  on-task-complete.sh: writes JSON + wakes OpenClaw + Telegram DM ║
║  WHERE: ~/.claude/settings.json (global, already working)        ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## What Triggers What (Decision Tree)

```
You want something done on Kasoku.run?
│
├── Urgent / specific request?
│   └── Message Kimmy on Telegram
│       → dev-bridge parses → dispatch.sh → Claude Code runs
│       → Stop hook verifies → on-task-complete notifies you
│
├── Routine daily work?
│   └── Do nothing — kasoku-pm cron handles it
│       → 9 AM picks task → dispatches → 3 PM checks + dispatches next
│       → Each task goes through self-correcting loop
│
├── Visual QA / E2E walkthrough?
│   └── Open Cursor → start Cloud Agent with walkthrough prompt
│       → Next morning: review video + PR
│       → Fix issues by messaging Kimmy (loops back to urgent path)
│
└── Major release prep?
    └── Cursor Cloud Agent (full walkthrough) + kasoku-pm (finish remaining tasks)
    └── Both run in parallel — one visual, one functional
```

---

## What You DON'T Need Right Now

| Thing | Why Not |
|-------|---------|
| CI/CD (GitHub Actions) | No users yet. Just ship. Add CI when you have beta users and PRs |
| Vercel staging env | Deploy to production. Use Vercel preview deploys for PRs later |
| New MCP servers | Supabase MCP already connected. No other integrations needed |
| New OpenClaw skills | kasoku-pm + dev-bridge + kasoku-orchestrator cover everything |
| Docker/sandbox | Local is fine for solo dev. Sandbox when you have a team |

---

## Implementation Checklist

- [ ] **Update `Kasoku.run/.claude/settings.json`** — Add Stop + TaskCompleted hooks
- [ ] **Update `Kasoku.run/.claude/scripts/task-quality-gate.sh`** — Add npm test, use exit code 2
- [ ] **Update OpenClaw** — `openclaw update --yes` (2.9 → 2.25)
- [ ] **Cursor Cloud Agent setup** — Onboard repo at cursor.com/onboard
- [ ] **Test the loop** — Dispatch a small task, verify it self-corrects on failure
- [ ] **First overnight visual QA** — Start a Cloud Agent before bed, check in morning

---

## FAQ

**Q: Will the Stop hook burn infinite tokens if tests keep failing?**
A: No. Agent-based Stop hooks run once. If the main agent can't fix it after the feedback, Claude stops and the on-task-complete hook reports the failure to you. No infinite loop.

**Q: Can OpenClaw trigger Cursor Cloud Agents?**
A: No. Cursor has no API for this. You start Cloud Agents manually. Everything else (Claude Code) is fully automated via dispatch.sh.

**Q: What if kasoku-pm dispatches a task and the Stop hook rejects it?**
A: Claude keeps trying within its turn budget (default 30 turns). If it can't fix within 30 turns, it stops, and kasoku-pm-afternoon sees the failure and escalates to you.

**Q: Do I need Pro+ ($60/mo) for Cursor Cloud Agents?**
A: Yes, for background Cloud Agents. Regular Pro ($20/mo) gets basic agent access but not the cloud VM with video recording. Check your current plan.

**Q: What about the existing browser-tester agent?**
A: Keep it. It handles Clerk-authenticated testing that Cloud Agents struggle with. Use browser-tester for functional E2E (forms, API, auth flows) and Cloud Agents for visual QA (layout, responsiveness, "does it look right").
