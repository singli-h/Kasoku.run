# Autonomous Dev Pipeline — Kasoku.run

> How OpenClaw and Claude Code work together so you don't have to babysit anything.

---

## How Your Settings Files Work (The Simple Version)

You have **3 layers** of settings. Think of it like clothing — inner layer applies first, outer layer overrides:

```
LAYER 1 (underwear):  ~/.claude/settings.json
                      → Applies to ALL projects on your Mac
                      → Has: guard-destructive hook, on-task-complete hook, plugins

LAYER 2 (shirt):      Kasoku.run/.claude/settings.json
                      → Applies only to Kasoku.run project
                      → Has: AGENT_TEAMS=1, Stop hook, TaskCompleted hook
                      → Shared via git (teammates see it too)

LAYER 3 (jacket):     Kasoku.run/.claude/settings.local.json
                      → Applies only to Kasoku.run, only on YOUR machine
                      → Has: all the permission allows (Bash(*), Read, Write, etc.)
                      → Git-ignored (your personal config)
```

**What this means:**
- Global hooks (guard + notification) fire on every project including Kasoku.run
- Project hooks (Stop + TaskCompleted) force Claude to **test → fix → retest** before stopping
- All layers combine — you get guard + self-correction + notification on every task

---

## Architecture

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
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  NEW: Self-Correcting Loop                            │  │
│  │  TaskCompleted → quality gate (tsc+lint+test)         │  │
│  │    → fail? → feedback to Claude → fix → retry         │  │
│  │  Stop → agent verifies all green                      │  │
│  │    → fail? → Claude keeps working                     │  │
│  │    → pass? → allowed to stop                          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────────────────────────┘
       │ (passes all checks OR hits turn limit)
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

## The Self-Correcting Loop (How It Works)

```
Claude finishes coding
  → TaskCompleted hook fires
    → quality-gate.sh runs: tsc + lint + npm test
    → FAIL? → exit 2 → Claude gets error output → fixes → retries
    → PASS? → task marked complete

Claude tries to stop
  → Stop hook fires (agent-based)
    → Sub-agent runs full verification independently
    → FAIL? → {ok: false, reason: "..."} → Claude keeps working
    → PASS? → {ok: true} → Claude stops → on-task-complete.sh notifies you
```

**No infinite loop risk:** Agent-based Stop hooks have built-in loop protection. After one retry cycle, Claude is allowed to stop regardless. This prevents infinite token burn.

---

## What Triggers What (Decision Tree)

```
You want something done on Kasoku.run?
│
├── Urgent / specific request?
│   └── Message Kimmy on Telegram
│       → dev-bridge parses → dispatch.sh → Claude Code runs
│       → Self-correcting loop ensures quality
│       → on-task-complete notifies you when done
│
├── Routine daily work?
│   └── Do nothing — kasoku-pm cron handles it
│       → 9 AM picks task → dispatches → 3 PM checks + dispatches next
│       → Each task goes through self-correcting loop
│
└── Visual QA / E2E?
    └── Use browser-tester agent for Clerk-authenticated flows
    └── Or Cursor Cloud Agents manually for video walkthroughs
```

---

## Key Files

| File | What It Does |
|------|-------------|
| `~/.claude/settings.json` | Global hooks: guard-destructive + on-task-complete |
| `~/.claude/hooks/guard-destructive.sh` | Blocks rm -rf, git push, DROP TABLE, etc. |
| `~/.claude/hooks/on-task-complete.sh` | Writes results JSON + wakes OpenClaw + Telegram DM |
| `.claude/settings.json` | Project hooks: Stop (agent verify) + TaskCompleted (quality gate) |
| `.claude/settings.local.json` | Permission allows (Bash(*), file ops, Supabase MCP) |
| `.claude/scripts/task-quality-gate.sh` | Runs tsc + lint + npm test, exits 2 on failure |
| `.claude/agents/` | 5 agents: code-reviewer, debugger, implementer, explorer, browser-tester |
| `.claude/skills/` | build-with-team, vercel-react-best-practices, web-design-guidelines, frontend-design |
| `~/.openclaw/workspace/skills/kasoku-pm/` | Autonomous PM (cron 2x daily) |
| `~/.openclaw/workspace/skills/dev-bridge/` | Telegram → Claude Code bridge |
| `~/.openclaw/workspace/skills/dev-bridge/scripts/dispatch.sh` | Fire-and-forget Claude CLI launcher |

---

## FAQ

**Q: Will the Stop hook burn infinite tokens if tests keep failing?**
A: No. Agent-based Stop hooks run once. If the main agent can't fix it after the feedback, Claude stops and on-task-complete reports the failure. No infinite loop.

**Q: What if kasoku-pm dispatches a task and the Stop hook rejects it?**
A: Claude keeps trying within its turn budget (default 30 turns). If it can't fix within 30 turns, it stops, and kasoku-pm-afternoon sees the failure and escalates to you.

**Q: What about the browser-tester agent?**
A: Keep it. It handles Clerk-authenticated testing with programmatic sign-in tokens. Use it for functional E2E (forms, API, auth flows).

**Q: Do I need CI/CD?**
A: Not yet. No users = no PRs = no CI needed. The self-correcting loop handles quality locally. Add CI when you have beta users.
