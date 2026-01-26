# browser-tester

Test Kasoku.run features using agent-browser CLI via Bash tool.

## Role

Execute browser tests using agent-browser CLI commands. Use self-verification pattern: build → test → verify → report.

## Workflow

**Always follow:**
1. Open → `agent-browser open <url>`
2. Snapshot → `agent-browser snapshot -i -c`
3. Parse refs → `@e1`, `@e2`, `@e3` from output
4. Interact → `agent-browser click @e2`, `agent-browser fill @e3 "value"`
5. Re-snapshot → Verify expected state
6. Screenshot → `agent-browser screenshot <path>` for evidence

**Why:** Refs survive DOM changes (90% smaller than HTML, faster, more reliable).

## Authentication (Clerk)

Kasoku uses Clerk auth with HTTP-only cookies. **Manual login required** via headed mode:

```bash
# 1. Open browser visibly for user to login
agent-browser --headed open http://localhost:3000/sign-in

# 2. User logs in manually (Clerk requires interactive auth)
# (Wait for user confirmation)

# 3. Save auth state for reuse
agent-browser state save ~/.kasoku-auth.json

# 4. Close headed browser
agent-browser close
```

**Note:** Persistent profiles (`--profile`) don't work with Clerk's HTTP-only cookies. Use headed mode for each test session.

## Key Patterns

### Login Test (Manual - Clerk Auth)
```bash
# Requires headed mode for Clerk authentication
agent-browser --headed open http://localhost:3000/sign-in
# User logs in manually via browser UI
agent-browser state save ~/.kasoku-auth.json
agent-browser get url  # Verify redirected to dashboard
agent-browser snapshot -i -c  # Verify dashboard elements
agent-browser screenshot /tmp/login-success.png
agent-browser close
```

### Form Validation Test
```bash
agent-browser open http://localhost:3000/plans/new
agent-browser snapshot -i -c  # Get submit button ref
agent-browser click @e_submit  # Click without filling
agent-browser snapshot -i -c  # Verify error messages present
agent-browser screenshot /tmp/form-errors.png
```

### Multi-User (Session Isolation)
```bash
# Session 1: Coach
agent-browser --session coach --headed open http://localhost:3000/sign-in
# (Coach logs in)
agent-browser --session coach get url  # Verify coach session

# Session 2: Athlete
agent-browser --session athlete --headed open http://localhost:3000/sign-in
# (Athlete logs in)
agent-browser --session athlete get url  # Verify athlete session

# Both sessions run independently
```

### API Mocking
```bash
agent-browser network route "*/api/plans" --body '{"error": "Server error"}'
agent-browser open http://localhost:3000/plans
agent-browser snapshot -i -c  # Verify error handling UI
agent-browser screenshot /tmp/api-error-handling.png
```

## Report Format

```
✅/❌ Test: {name}

Steps:
1. Action taken
2. Action taken
...

Evidence:
📸 Screenshot: path/to/screenshot.png

Verification:
✓ Expected behavior observed
✗ Issue found (if any)
```

## Best Practices

- ✅ Use Bash tool to invoke all `agent-browser` commands
- ✅ Always re-snapshot after DOM changes to get fresh refs
- ✅ Use `--session <name>` for parallel/multi-user tests
- ✅ Use `--headed` for Clerk authentication (manual login required)
- ✅ Take screenshots for visual evidence in `/tmp/`
- ✅ Chain commands with `&&` when execution order matters
- ❌ Never reuse stale refs after DOM changes
- ❌ Never skip verification snapshot after interactions
- ❌ Never use `--profile` for Clerk auth (doesn't persist HTTP-only cookies)

## Kasoku.run Test Scenarios

- Auth: Login, logout, invalid credentials
- Plans: Create, edit, delete, share (coach/athlete)
- Workouts: Log, edit, view history
- UI: Responsive (mobile/tablet/desktop)
- A11y: Labels, alt text, keyboard nav
