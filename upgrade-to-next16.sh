#!/bin/bash

###############################################################################
# Next.js 16 + React 19.2.1 Migration Script
#
# CRITICAL: Addresses CVE-2025-55182 (React2Shell RCE)
#
# Usage:
#   ./upgrade-to-next16.sh [phase]
#
# Phases:
#   0 - Emergency React2Shell fix only
#   1 - React security patches
#   2 - Next.js core upgrade
#   3 - Clerk authentication update
#   4 - Major dependencies
#   5 - UI libraries
#   6 - Development tools
#   7 - Minor dependencies
#   all - Run all phases (default)
#   validate - Run validation only
#
# Examples:
#   ./upgrade-to-next16.sh           # Run all phases
#   ./upgrade-to-next16.sh 0         # Emergency fix only
#   ./upgrade-to-next16.sh validate  # Validate after manual upgrade
#
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PHASE="${1:-all}"
BACKUP_TAG="backup-before-next16-$(date +%Y%m%d-%H%M%S)"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check Node.js version
  NODE_VERSION=$(node --version | cut -d'v' -f2)
  REQUIRED_NODE="20.9.0"

  if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    log_error "Node.js version $REQUIRED_NODE or higher required. Found: $NODE_VERSION"
    exit 1
  fi
  log_success "Node.js $NODE_VERSION"

  # Check npm version
  NPM_VERSION=$(npm --version)
  log_success "npm $NPM_VERSION"

  # Check git status
  if [ -n "$(git status --porcelain)" ]; then
    log_warning "Working directory has uncommitted changes"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  log_success "Prerequisites check passed"
}

create_backup() {
  log_info "Creating backup tag: $BACKUP_TAG"
  git tag "$BACKUP_TAG"
  log_success "Backup tag created"
  log_info "To restore: git reset --hard $BACKUP_TAG"
}

run_validation() {
  log_info "Running validation checks..."

  # Type check
  log_info "Type checking..."
  npm run type-check || { log_error "Type check failed"; return 1; }
  log_success "Type check passed"

  # Linting
  log_info "Linting..."
  npm run lint || { log_error "Lint check failed"; return 1; }
  log_success "Lint passed"

  # Tests
  log_info "Running tests..."
  npm test -- --passWithNoTests || { log_error "Tests failed"; return 1; }
  log_success "Tests passed"

  # Build
  log_info "Building..."
  npm run build || { log_error "Build failed"; return 1; }
  log_success "Build passed"

  # Version checks
  log_info "Verifying versions..."

  REACT_VERSION=$(node -e "console.log(require('./apps/web/package.json').dependencies.react)")
  if [ "$REACT_VERSION" != "19.2.1" ]; then
    log_error "React version mismatch. Expected: 19.2.1, Found: $REACT_VERSION"
    return 1
  fi
  log_success "React 19.2.1 confirmed"

  NEXT_VERSION=$(node -e "console.log(require('./apps/web/package.json').dependencies.next)")
  if [ "$NEXT_VERSION" != "16.0.8" ]; then
    log_error "Next.js version mismatch. Expected: 16.0.8, Found: $NEXT_VERSION"
    return 1
  fi
  log_success "Next.js 16.0.8 confirmed"

  # Check proxy file
  if [ ! -f "apps/web/proxy.ts" ]; then
    log_error "proxy.ts not found"
    return 1
  fi
  log_success "proxy.ts exists"

  # Check middleware removed
  if [ -f "apps/web/middleware.ts" ]; then
    log_warning "middleware.ts still exists (should be removed)"
  else
    log_success "middleware.ts removed"
  fi

  log_success "All validation checks passed!"
  return 0
}

###############################################################################
# Phase Functions
###############################################################################

phase_0_emergency() {
  echo ""
  log_info "============================================"
  log_info "PHASE 0: Emergency React2Shell Fix"
  log_info "============================================"

  log_info "Installing React 19.2.1 (CVE fix)..."
  npm install --workspace=@kasoku/web react@19.2.1 react-dom@19.2.1 --save-exact

  log_success "Phase 0 complete: React2Shell patched"
  log_warning "This is a temporary fix. Run full migration soon."
}

phase_1_react() {
  echo ""
  log_info "============================================"
  log_info "PHASE 1: React Security Patches"
  log_info "============================================"

  log_info "Updating React to 19.2.1..."
  npm install --workspace=@kasoku/web \
    react@19.2.1 \
    react-dom@19.2.1 \
    --save-exact

  log_info "Updating React testing libraries..."
  npm install --workspace=@kasoku/web \
    @testing-library/react@16.3.0 \
    @types/react@19.0.2 \
    @types/react-dom@19.0.2 \
    --save-exact

  log_info "Updating root testing library..."
  npm install @testing-library/react@16.3.0 --save-exact

  log_success "Phase 1 complete: React updated to 19.2.1"
}

phase_2_nextjs() {
  echo ""
  log_info "============================================"
  log_info "PHASE 2: Next.js Core Upgrade"
  log_info "============================================"

  log_info "Updating Next.js to 16.0.8..."
  npm install --workspace=@kasoku/web \
    next@16.0.8 \
    eslint-config-next@16.0.8 \
    --save-exact

  log_info "Running Next.js codemod..."
  npx @next/codemod@canary upgrade latest || log_warning "Codemod had warnings (may be normal)"

  log_info "Generating TypeScript types..."
  npx --workspace=@kasoku/web next typegen || log_warning "Type generation had warnings (may be normal)"

  log_warning "MANUAL STEP REQUIRED:"
  log_warning "1. Review and update async API usage (params, searchParams)"
  log_warning "2. Rename middleware.ts → proxy.ts (see NEXT16_MIGRATION_PLAN.md)"

  log_success "Phase 2 complete: Next.js updated to 16.0.8"
}

phase_3_clerk() {
  echo ""
  log_info "============================================"
  log_info "PHASE 3: Clerk Authentication Update"
  log_info "============================================"

  log_info "Updating Clerk packages..."
  npm install --workspace=@kasoku/web \
    @clerk/nextjs@6.34.1 \
    @clerk/themes@2.4.29 \
    --save-exact

  log_warning "MANUAL STEP REQUIRED:"
  log_warning "Rename apps/web/middleware.ts → apps/web/proxy.ts"
  log_warning "See detailed instructions in NEXT16_MIGRATION_PLAN.md"

  log_success "Phase 3 complete: Clerk updated"
}

phase_4_major_deps() {
  echo ""
  log_info "============================================"
  log_info "PHASE 4: Major Dependencies"
  log_info "============================================"

  log_info "Updating Supabase..."
  npm install --workspace=@kasoku/web @supabase/supabase-js@2.87.0 --save-exact

  log_info "Updating TanStack Query..."
  npm install --workspace=@kasoku/web \
    @tanstack/react-query@5.80.6 \
    @tanstack/react-query-devtools@5.80.6 \
    --save-exact

  log_info "Updating TipTap editor..."
  npm install --workspace=@kasoku/web \
    @tiptap/core@3.6.1 \
    @tiptap/react@3.6.1 \
    @tiptap/starter-kit@3.6.1 \
    @tiptap/extension-image@3.6.1 \
    @tiptap/extension-link@3.6.1 \
    @tiptap/extension-placeholder@3.6.1 \
    @tiptap/extension-table@3.6.1 \
    @tiptap/extension-table-cell@3.6.1 \
    @tiptap/extension-table-header@3.6.1 \
    @tiptap/extension-table-row@3.6.1 \
    @tiptap/extension-task-item@3.6.1 \
    @tiptap/extension-task-list@3.6.1 \
    @tiptap/extension-underline@3.6.1 \
    --save-exact

  log_info "Updating AI SDK..."
  npm install --workspace=@kasoku/web \
    ai@4.3.16 \
    @ai-sdk/openai@1.3.22 \
    @ai-sdk/xai@1.2.16 \
    --save-exact

  log_info "Updating form handling..."
  npm install --workspace=@kasoku/web \
    react-hook-form@7.54.1 \
    @hookform/resolvers@3.9.1 \
    --save-exact

  log_info "Updating date handling..."
  npm install --workspace=@kasoku/web \
    date-fns@3.6.0 \
    react-day-picker@9.4.3 \
    --save-exact

  log_success "Phase 4 complete: Major dependencies updated"
}

phase_5_ui() {
  echo ""
  log_info "============================================"
  log_info "PHASE 5: UI Libraries"
  log_info "============================================"

  log_info "Updating Radix UI components..."
  npm install --workspace=@kasoku/web \
    @radix-ui/react-accordion@1.2.2 \
    @radix-ui/react-alert-dialog@1.1.4 \
    @radix-ui/react-aspect-ratio@1.1.1 \
    @radix-ui/react-avatar@1.1.2 \
    @radix-ui/react-checkbox@1.1.3 \
    @radix-ui/react-collapsible@1.1.2 \
    @radix-ui/react-context-menu@2.2.4 \
    @radix-ui/react-dialog@1.1.4 \
    @radix-ui/react-dropdown-menu@2.1.4 \
    @radix-ui/react-hover-card@1.1.4 \
    @radix-ui/react-label@2.1.1 \
    @radix-ui/react-menubar@1.1.4 \
    @radix-ui/react-navigation-menu@1.2.3 \
    @radix-ui/react-popover@1.1.4 \
    @radix-ui/react-progress@1.1.1 \
    @radix-ui/react-radio-group@1.2.2 \
    @radix-ui/react-scroll-area@1.2.2 \
    @radix-ui/react-select@2.1.4 \
    @radix-ui/react-separator@1.1.1 \
    @radix-ui/react-slider@1.2.2 \
    @radix-ui/react-slot@1.1.1 \
    @radix-ui/react-switch@1.1.2 \
    @radix-ui/react-tabs@1.1.2 \
    @radix-ui/react-toast@1.2.4 \
    @radix-ui/react-toggle@1.1.1 \
    @radix-ui/react-toggle-group@1.1.1 \
    @radix-ui/react-tooltip@1.1.6 \
    @radix-ui/react-icons@1.3.2 \
    --save-exact

  log_info "Updating animation and UI utilities..."
  npm install --workspace=@kasoku/web \
    framer-motion@11.11.8 \
    lucide-react@0.436.0 \
    sonner@1.7.1 \
    cmdk@1.0.0 \
    vaul@0.9.9 \
    embla-carousel-react@8.5.1 \
    --save-exact

  log_success "Phase 5 complete: UI libraries updated"
}

phase_6_dev_tools() {
  echo ""
  log_info "============================================"
  log_info "PHASE 6: Development Tools"
  log_info "============================================"

  log_info "Updating testing libraries..."
  npm install --workspace=@kasoku/web \
    @testing-library/react@16.3.0 \
    @types/node@20.17.0 \
    --save-exact

  log_info "Updating Playwright..."
  npm install @playwright/test@1.55.1 playwright@1.55.1 --save-exact

  log_info "Updating Turbo..."
  npm install turbo@2.5.4 --save-exact

  log_info "Updating other dev dependencies..."
  npm install --workspace=@kasoku/web \
    @tailwindcss/typography@0.5.15 \
    eslint-plugin-tailwindcss@3.17.5 \
    jsdom@25.0.1 \
    --save-exact

  log_success "Phase 6 complete: Development tools updated"
}

phase_7_minor() {
  echo ""
  log_info "============================================"
  log_info "PHASE 7: Minor Dependencies"
  log_info "============================================"

  log_info "Updating utilities..."
  npm install --workspace=@kasoku/web \
    class-variance-authority@0.7.1 \
    clsx@2.1.1 \
    lru-cache@10.4.3 \
    tailwind-merge@2.5.2 \
    tailwindcss-animate@1.0.7 \
    zod@3.24.1 \
    react-error-boundary@6.0.0 \
    react-resizable-panels@2.1.7 \
    --save-exact

  log_info "Updating markdown/syntax highlighting..."
  npm install --workspace=@kasoku/web \
    react-markdown@10.1.0 \
    react-syntax-highlighter@15.6.1 \
    remark-gfm@4.0.1 \
    rehype-raw@7.0.0 \
    --save-exact

  log_info "Updating DnD Kit..."
  npm install --workspace=@kasoku/web \
    @dnd-kit/core@6.3.1 \
    @dnd-kit/sortable@10.0.0 \
    @dnd-kit/utilities@3.2.2 \
    --save-exact

  log_info "Updating CodeMirror..."
  npm install --workspace=@kasoku/web \
    @codemirror/lang-javascript@6.2.4 \
    @codemirror/lang-python@6.2.1 \
    @codemirror/state@6.5.2 \
    @codemirror/theme-one-dark@6.1.2 \
    @codemirror/view@6.37.1 \
    --save-exact

  log_info "Updating integrations..."
  npm install --workspace=@kasoku/web \
    stripe@16.9.0 \
    svix@1.66.0 \
    posthog-js@1.201.0 \
    next-themes@0.4.3 \
    input-otp@1.4.1 \
    recharts@2.15.0 \
    drizzle-orm@0.44.1 \
    --save-exact

  log_success "Phase 7 complete: Minor dependencies updated"
}

###############################################################################
# Main Execution
###############################################################################

main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║      Next.js 16 + React 19.2.1 Migration Script               ║"
  echo "║      CRITICAL: Addresses CVE-2025-55182 (React2Shell)         ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""

  # Special handling for validate-only mode
  if [ "$PHASE" = "validate" ]; then
    run_validation
    exit $?
  fi

  # Check prerequisites
  check_prerequisites

  # Create backup
  create_backup

  # Run requested phase(s)
  case "$PHASE" in
    0)
      phase_0_emergency
      ;;
    1)
      phase_1_react
      ;;
    2)
      phase_2_nextjs
      ;;
    3)
      phase_3_clerk
      ;;
    4)
      phase_4_major_deps
      ;;
    5)
      phase_5_ui
      ;;
    6)
      phase_6_dev_tools
      ;;
    7)
      phase_7_minor
      ;;
    all)
      phase_1_react
      phase_2_nextjs
      phase_3_clerk
      phase_4_major_deps
      phase_5_ui
      phase_6_dev_tools
      phase_7_minor
      ;;
    *)
      log_error "Invalid phase: $PHASE"
      echo "Valid phases: 0, 1, 2, 3, 4, 5, 6, 7, all, validate"
      exit 1
      ;;
  esac

  # Run validation
  echo ""
  log_info "============================================"
  log_info "Running validation checks..."
  log_info "============================================"

  if run_validation; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    ✓ MIGRATION SUCCESSFUL                      ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    log_success "Next.js 16.0.8 and React 19.2.1 installed"
    log_success "All validation checks passed"
    echo ""
    log_info "Next steps:"
    echo "  1. Review NEXT16_MIGRATION_PLAN.md for manual steps"
    echo "  2. Rename middleware.ts → proxy.ts (if not done)"
    echo "  3. Update async API usage (if needed)"
    echo "  4. Run manual tests"
    echo "  5. Commit changes"
    echo ""
    log_info "Backup tag created: $BACKUP_TAG"
    log_info "To rollback: git reset --hard $BACKUP_TAG"
    echo ""
  else
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    ✗ VALIDATION FAILED                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    log_error "Migration completed but validation failed"
    log_info "To rollback: git reset --hard $BACKUP_TAG"
    log_info "Review errors above and check NEXT16_MIGRATION_PLAN.md"
    exit 1
  fi
}

# Run main function
main
