# Spec-Kit Setup for Kasoku.run

## Installation Complete ✅

Spec-Kit has been successfully installed and configured for this project.

## What Was Installed

- **uv Package Manager**: Python package manager (located at `C:\Users\PC\.local\bin\uv.exe`)
- **Spec-Kit CLI**: Version 0.0.22 (located at `C:\Users\PC\.local\bin\specify.exe`)
- **Claude Integration**: Configured with slash commands for Claude Code

## Directory Structure

```
.
├── .claude/
│   ├── commands/           # Spec-Kit slash commands
│   │   ├── speckit.constitution.md
│   │   ├── speckit.specify.md
│   │   ├── speckit.plan.md
│   │   ├── speckit.tasks.md
│   │   ├── speckit.implement.md
│   │   ├── speckit.clarify.md
│   │   ├── speckit.analyze.md
│   │   └── speckit.checklist.md
│   └── settings.local.json # Permissions (ignored by git)
│
└── .specify/
    ├── memory/             # Constitution & specifications (ignored by git)
    ├── scripts/            # Helper scripts
    └── templates/          # Document templates
```

## Available Slash Commands

Use these commands in Claude Code to manage your specifications:

### Core Workflow (in order)

1. **`/speckit.constitution`** - Establish project principles
   - Define code quality standards
   - Testing requirements
   - User experience consistency
   - Performance requirements

2. **`/speckit.specify`** - Create feature specifications
   - Define requirements clearly
   - Based on constitution principles

3. **`/speckit.plan`** - Create technical implementation plan
   - Architecture decisions
   - Technology stack details
   - Component design

4. **`/speckit.tasks`** - Generate actionable task breakdown
   - Dependency-ordered tasks
   - Clear acceptance criteria

5. **`/speckit.implement`** - Execute all tasks
   - Automated implementation
   - Following the plan

### Enhancement Commands (optional)

- **`/speckit.clarify`** - Ask structured questions to de-risk ambiguous areas
  - Use BEFORE `/speckit.plan` if requirements are unclear

- **`/speckit.analyze`** - Cross-artifact consistency & alignment report
  - Use AFTER `/speckit.tasks`, BEFORE `/speckit.implement`

- **`/speckit.checklist`** - Generate quality checklists
  - Validate requirements completeness
  - Use AFTER `/speckit.plan`

### Utility Commands

- **`/speckit.taskstoissues`** - Convert tasks to GitHub issues

## Getting Started

### Step 1: Create Your Constitution

Start by establishing your project principles:

```
/speckit.constitution Create principles focused on:
- Type safety (strict TypeScript, no any types)
- Server-first architecture (server components by default)
- Authentication security (Clerk + Supabase RLS)
- Testing requirements (unit + E2E with Playwright)
- Performance standards (Core Web Vitals)
```

### Step 2: Specify a Feature

Define what you want to build:

```
/speckit.specify Build a feature that allows coaches to create personalized training plans for athletes with:
- Macrocycle, mesocycle, and microcycle planning
- Exercise preset management
- Session scheduling and tracking
- Real-time progress monitoring
```

### Step 3: Create Implementation Plan

```
/speckit.plan The application uses:
- Next.js 15 with App Router
- Supabase for database (PostgreSQL with RLS)
- Clerk for authentication
- Server actions for mutations
- TypeScript in strict mode
```

### Step 4: Generate & Execute Tasks

```
/speckit.tasks
```

Then review the tasks and implement:

```
/speckit.implement
```

## Integration with Existing Project

Spec-Kit is configured to work with your existing:

- **Architecture**: Next.js 15 + Supabase + Clerk
- **Development Guide**: [CLAUDE.md](../CLAUDE.md)
- **Documentation**: [apps/web/docs/](../apps/web/docs/)
- **Testing**: Jest + Playwright setup

## Security Notes

The following directories are excluded from git (per security recommendations):

- `.claude/settings.local.json` - May contain local permissions
- `.specify/memory/` - May contain sensitive project details

## CLI Usage

You can also use Spec-Kit directly from the command line:

```bash
# Check project status
/c/Users/PC/.local/bin/specify.exe check

# Validate specifications
/c/Users/PC/.local/bin/specify.exe validate

# Generate documentation
/c/Users/PC/.local/bin/specify.exe docs
```

## Workflow Example

Here's a complete workflow for adding a new feature:

```
1. /speckit.constitution  # If not done yet
2. /speckit.specify Build an athlete progress dashboard...
3. /speckit.clarify       # Optional - resolve ambiguities
4. /speckit.plan Uses existing components/features/athletes...
5. /speckit.checklist     # Optional - validate requirements
6. /speckit.tasks
7. /speckit.analyze       # Optional - check consistency
8. /speckit.implement
```

## Best Practices

1. **Start with Constitution**: Establish principles once, reference throughout
2. **Clear Specifications**: Be specific about requirements and constraints
3. **Leverage Existing Code**: Reference existing patterns from CLAUDE.md
4. **Use Optional Commands**: They improve quality and reduce rework
5. **Review Before Implement**: Always review tasks before executing

## Troubleshooting

### Command not found

If slash commands don't work, check that `.claude/commands/` exists with the spec-kit commands.

### Permission issues

If you see permission errors, check `.claude/settings.local.json` and update the `allow` list.

### Update Spec-Kit

```bash
/c/Users/PC/.local/bin/uv.exe tool install specify-cli --from git+https://github.com/github/spec-kit.git --force
```

## Resources

- **Spec-Kit GitHub**: https://github.com/github/spec-kit
- **Project Docs**: [apps/web/docs/](../apps/web/docs/)
- **Development Guide**: [CLAUDE.md](../CLAUDE.md)

## Next Steps

1. Run `/speckit.constitution` to establish your project principles
2. Use `/speckit.specify` to define your next feature
3. Follow the workflow to implement with confidence

---

**Setup Date**: 2025-12-03
**Spec-Kit Version**: 0.0.22
**Status**: ✅ Ready to use
