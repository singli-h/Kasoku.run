# ChangeSet Pattern: Documentation Index

**Purpose**: Central index for all ChangeSet pattern documentation
**Last Updated**: 2026-01-07

---

## Core Documents

| Document | Scope |
|----------|-------|
| [Principles](./20260107-concept-changeset-principles.md) | Why, conceptual philosophy, trade-offs |
| [Architecture](./20260107-concept-changeset-architecture.md) | State machine, keyed buffer, data model, persistence |

## Implementation Documents

| Document | Scope |
|----------|-------|
| [Tool Design](./20260107-concept-changeset-tool-design.md) | Tool naming, patterns, schemas, parsing |
| [Transformation Layer](./20260107-concept-changeset-transformation-layer.md) | Tool input to ChangeRequest conversion, entity ID generation |
| [Client Tools](./20260107-concept-changeset-client-tools.md) | Vercel AI SDK patterns, onToolCall, pause-resume, context bridge |
| [Execution Flow](./20260107-concept-changeset-execution-flow.md) | Approve to DB commit, error handling, recovery |
| [Concurrency](./20260107-concept-changeset-concurrency.md) | Optimistic locking, version checks, stale data |
| [Prompting](./20260107-concept-changeset-prompting.md) | System prompt design for ChangeSet-based AI agents |

---

## Reading Order

For new engineers, recommended reading order:

1. **Principles** — Understand the "why" and core concepts
2. **Architecture** — Learn the state machine and data model
3. **Tool Design** — How AI tools are structured
4. **Transformation Layer** — How tool inputs become ChangeRequests
5. **Client Tools** — Runtime handling and pause-resume
6. **Execution Flow** — What happens when user approves
7. **Concurrency** — Handling concurrent modifications
8. **Prompting** — Writing effective AI agent prompts

---

## Quick Reference

### Key Concepts

- **ChangeSet**: A batch of related changes awaiting approval
- **ChangeRequest**: A single atomic operation (create/update/delete)
- **Keyed Buffer**: Map-based storage with upsert semantics
- **Pause-Resume**: AI stream pauses for user decision, resumes after

### State Flow

```
building → pending_approval → executing → approved
                ↓                  ↓
           (rejected)      (execution_failed → building)
```

### Tool Naming

```
{operation}{EntityType}ChangeRequest
```

Examples: `createOrderChangeRequest`, `updateItemChangeRequest`, `deleteTransactionChangeRequest`
