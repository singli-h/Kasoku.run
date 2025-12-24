# Pattern Documentation

> **Last Updated**: 2025-12-24

This directory contains reusable code patterns and architectural guidelines for consistent implementation across the Kasoku application.

## Available Patterns

### [Feature Pattern](./feature-pattern.md)
Standard structure and patterns for implementing features in Kasoku. Includes component architecture, server action patterns, data flow, and testing guidelines.

### [ActionState Pattern](./actionstate-pattern.md)
The `ActionState<T>` discriminated union pattern used for all server actions. Provides type-safe error handling and consistent API across all actions.

### [Hooks vs Context](./hooks-vs-context.md)
Decision guide for when to use React Hooks vs Context API for state management. Includes patterns, examples, and anti-patterns.

## Related Documentation

- [API Architecture](../development/api-architecture.md)
- [Component Architecture](../architecture/component-architecture.md)
- [Security Patterns](../security/row-level-security-analysis.md)

