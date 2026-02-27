#!/bin/bash
# Quality gate for agent team task completion
# Called by TaskCompleted hook — blocks task completion if checks fail
# Exit code 2 = block the action and feed error back to Claude
# Usage: .claude/scripts/task-quality-gate.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Running quality gate checks..."

# 1. TypeScript compilation check
echo "  Checking TypeScript..."
TSC_OUTPUT=$(npx tsc --noEmit --pretty 2>&1 | tail -20)
if [ $? -ne 0 ] || echo "$TSC_OUTPUT" | grep -q "error TS"; then
  echo "  TypeScript: FAIL" >&2
  echo "$TSC_OUTPUT" >&2
  exit 2
fi
echo "  TypeScript: PASS"

# 2. Next.js lint check
echo "  Running lint..."
LINT_OUTPUT=$(npx next lint --quiet 2>&1 | tail -10)
if [ $? -ne 0 ] && echo "$LINT_OUTPUT" | grep -q "Error"; then
  echo "  Lint: FAIL" >&2
  echo "$LINT_OUTPUT" >&2
  exit 2
fi
echo "  Lint: PASS"

# 3. Unit tests
echo "  Running tests..."
TEST_OUTPUT=$(npm test -- --passWithNoTests 2>&1 | tail -20)
if [ $? -ne 0 ]; then
  echo "  Tests: FAIL" >&2
  echo "$TEST_OUTPUT" >&2
  exit 2
fi
echo "  Tests: PASS"

echo "All quality gate checks passed."
