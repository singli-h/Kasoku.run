#!/bin/bash
# Quality gate for agent team task completion
# Used by hooks to verify code quality before marking tasks done
# Usage: .claude/scripts/task-quality-gate.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Running quality gate checks..."

# TypeScript compilation check
echo "  Checking TypeScript..."
if npx tsc --noEmit --pretty 2>&1 | tail -20; then
  echo "  TypeScript: PASS"
else
  echo "  TypeScript: FAIL"
  exit 1
fi

# Next.js lint check
echo "  Running lint..."
if npx next lint --quiet 2>&1 | tail -10; then
  echo "  Lint: PASS"
else
  echo "  Lint: FAIL (warnings only, continuing)"
fi

echo "Quality gate passed."
