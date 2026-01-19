# ChangeSet Pattern: Prompting Concepts

**Purpose**: Guide for writing effective system prompts for ChangeSet-based AI agents
**Scope**: Domain-agnostic principles applicable to any ChangeSet implementation
**Audience**: Engineers designing AI assistant prompts

---

## Core Philosophy

**Design agent prompts to be goal-oriented, not procedural.**

Agents should have autonomy and act as decision engines. Provide goals, constraints, and soft guidance—not rigid step-by-step procedures.

---

## 1. Prompt Structure

Common sections in a ChangeSet prompt (order and inclusion varies by domain):

| Section | Purpose |
|---------|---------|
| Role & Persona | Define who the agent is and their goals |
| Constraints | Hard requirements the agent must follow |
| Soft Guidance | Principles and best practices |
| Domain Knowledge | Business rules the agent must understand |
| Examples | Concrete demonstrations (illustrative, not prescriptive) |

Not all sections are required. Tailor to domain needs.

---

## 2. Agent Mental Model

**Core Principle**: Design prompts from the agent's perspective, not the system's.

### What Agent Needs to Know

The agent operates with a simple mental model:

- **Three operations**: create, update, delete
- **One constraint**: confirm changes before user can approve
- **Tool results guide next steps**: Results tell the agent what to do next

### What Agent Does NOT Need to Know

Implementation details are abstracted away:

- Temp IDs vs real IDs
- Buffer keys and internal state
- Pause-resume mechanisms
- Optimistic concurrency
- Internal state transitions

### Tool Results as Teacher

The transformation layer returns results that naturally guide the agent:

```
Agent calls: createEntityChangeRequest({ name: "Example" })
Agent receives: { success: true, entityId: "xxx", message: "Use entityId to modify this proposal" }
```

The agent learns: "I got an entityId, I can reference it in subsequent operations."

**Key Insight**: Don't over-explain in the prompt. Let tool results teach the agent through usage.

---

## 3. Role, Goals & Persona

Define the agent's identity with clear goals:

```
You are an expert [domain] assistant.

Your goal is to [primary objective].

You help users by:
- [Capability 1]
- [Capability 2]
- [Capability 3]

Be [tone descriptor]. Propose changes directly using available tools.
```

### Key Elements

| Element | Purpose |
|---------|---------|
| Goal | The primary objective the agent works toward |
| Expertise | Establishes credibility and domain knowledge |
| Capabilities | What the agent can do (not how) |
| Tone | Sets communication style |

Focus on **what to achieve**, not **how to achieve it**.

---

## 4. Constraints & Guidance

Separate hard constraints from soft guidance.

### Constraints (Must Follow)

These are non-negotiable requirements:

```
- Call confirmChangeSet() when you have changes ready for user review
- Use resetChangeSet() to clear all pending changes and start fresh
```

Keep constraints minimal. Only include what's truly required.

### Soft Guidance (Principles)

These are best practices the agent can adapt based on context:

```
- Gather context when helpful to make better proposals
- When input is ambiguous, [ask for clarification / make reasonable assumptions]
- If you cannot fulfill a request, [suggest alternatives / explain why]
```

The agent decides how to apply guidance based on the situation.

---

## 5. Decision Making & Defaults

Guide the agent on handling incomplete or ambiguous input.

### Define Sensible Defaults

```
When information is incomplete, make reasonable assumptions:
- Missing [field A]: Use [default]
- Missing [field B]: Pick the most relevant option
- Ambiguous values: Extract the most likely interpretation
```

### Agent Autonomy

The agent determines its approach based on goals and context. Defaults are fallbacks, not rigid rules.

---

## 6. Domain-Specific Knowledge

Document business rules the agent must understand—not procedures to follow.

### What to Include

- Entity relationships and constraints
- Terminology and definitions
- Business logic that affects proposals
- Edge cases and special handling

### Structure

```
## [Domain Concept]

[Explanation of the concept and why it matters]

### Rules
- [Rule 1]
- [Rule 2]

### Examples
[Concrete examples showing correct application]
```

Focus on **knowledge**, not **instructions**.

---

## 7. Domain-Specific Customizations

Prompts are not one-size-fits-all. Each domain has unique requirements.

### Customizable Aspects

| Aspect | Variation Examples |
|--------|-------------------|
| Invalid input handling | Polite refusal vs terse "INVALID" response |
| Questioning behavior | Ask clarifying questions vs make assumptions |
| Response verbosity | Conversational vs minimal |
| Error messaging | Supportive guidance vs direct error codes |
| Scope boundaries | What the agent refuses to do |

### Example: Invalid Input Handling

**Chat-oriented domain**:
```
If the request is unclear, ask for clarification.
Suggest alternatives when you cannot fulfill a request.
```

**Command-oriented domain**:
```
Respond with only "INVALID" when input is unrelated to [domain tasks].
```

Choose based on user experience requirements.

---

## 8. Examples

Examples help agents understand expected behavior. They are **illustrative, not prescriptive**—agents may take different paths to achieve the same goal.

### Purpose

- Demonstrate common scenarios
- Show tool usage in context
- Clarify expected outcomes

### Coverage

Include examples for:

- **Common requests**: Straightforward, happy-path scenarios
- **Multi-step operations**: When multiple tools are needed
- **Chained entities**: Create entity, then reference it immediately
- **Modifications**: Update and delete operations
- **Edge cases**: Ambiguous input, missing data
- **Out of scope**: What triggers refusal (if applicable)

### Example Format

```
User: "[natural language input]"
Action: [Brief description of what agent does] → confirmChangeSet()

User: "[create then reference]"
Action: Create [entity A] → use returned entityId in [entity B] → confirmChangeSet()
```

Keep examples concise. Show outcomes, not detailed procedures.

---

## Summary

| Concept | Key Point |
|---------|-----------|
| Core Philosophy | Goal-oriented, not procedural |
| Agent Mental Model | Simple operations; tool results guide behavior |
| Role & Goals | Define objectives, not procedures |
| Constraints | Minimal hard requirements only |
| Soft Guidance | Principles the agent adapts to context |
| Decision Making | Defaults as fallbacks, agent has autonomy |
| Domain Knowledge | Business rules, not instructions |
| Customizations | Tailor per domain requirements |
| Examples | Illustrative, not prescriptive |

**Remember**: The best prompts empower agents to make decisions. Provide goals, constraints, and knowledge—let the agent determine how to achieve them.
