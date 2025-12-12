###############################################################################
# Next.js 16 + React 19.2.1 Migration Script (PowerShell)
#
# CRITICAL: Addresses CVE-2025-55182 (React2Shell RCE)
#
# Usage:
#   .\upgrade-to-next16.ps1 [phase]
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
#   .\upgrade-to-next16.ps1           # Run all phases
#   .\upgrade-to-next16.ps1 0         # Emergency fix only
#   .\upgrade-to-next16.ps1 validate  # Validate after manual upgrade
#
###############################################################################

param(
    [string]$Phase = "all"
)

$ErrorActionPreference = "Stop"

# Configuration
$BackupTag = "backup-before-next16-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

###############################################################################
# Helper Functions
###############################################################################

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    # Check Node.js version
    try {
        $nodeVersion = node --version
        $nodeVersionNum = $nodeVersion -replace 'v', ''
        Write-Success "Node.js $nodeVersionNum"

        # Check if version is >= 20.9.0
        $required = [version]"20.9.0"
        $current = [version]$nodeVersionNum

        if ($current -lt $required) {
            Write-Error-Custom "Node.js version 20.9.0 or higher required. Found: $nodeVersionNum"
            exit 1
        }
    }
    catch {
        Write-Error-Custom "Node.js not found. Please install Node.js 20.9.0 or higher."
        exit 1
    }

    # Check npm version
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion"
    }
    catch {
        Write-Error-Custom "npm not found"
        exit 1
    }

    # Check git status
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning-Custom "Working directory has uncommitted changes"
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    }

    Write-Success "Prerequisites check passed"
}

function New-Backup {
    Write-Info "Creating backup tag: $BackupTag"
    git tag $BackupTag
    Write-Success "Backup tag created"
    Write-Info "To restore: git reset --hard $BackupTag"
}

function Test-Migration {
    Write-Info "Running validation checks..."
    $failed = $false

    # Type check
    Write-Info "Type checking..."
    try {
        npm run type-check
        Write-Success "Type check passed"
    }
    catch {
        Write-Error-Custom "Type check failed"
        $failed = $true
    }

    # Linting
    Write-Info "Linting..."
    try {
        npm run lint
        Write-Success "Lint passed"
    }
    catch {
        Write-Error-Custom "Lint check failed"
        $failed = $true
    }

    # Tests
    Write-Info "Running tests..."
    try {
        npm test -- --passWithNoTests
        Write-Success "Tests passed"
    }
    catch {
        Write-Error-Custom "Tests failed"
        $failed = $true
    }

    # Build
    Write-Info "Building..."
    try {
        npm run build
        Write-Success "Build passed"
    }
    catch {
        Write-Error-Custom "Build failed"
        $failed = $true
    }

    # Version checks
    Write-Info "Verifying versions..."

    $packageJson = Get-Content "apps\web\package.json" -Raw | ConvertFrom-Json

    $reactVersion = $packageJson.dependencies.react
    if ($reactVersion -ne "19.2.1") {
        Write-Error-Custom "React version mismatch. Expected: 19.2.1, Found: $reactVersion"
        $failed = $true
    }
    else {
        Write-Success "React 19.2.1 confirmed"
    }

    $nextVersion = $packageJson.dependencies.next
    if ($nextVersion -ne "16.0.8") {
        Write-Error-Custom "Next.js version mismatch. Expected: 16.0.8, Found: $nextVersion"
        $failed = $true
    }
    else {
        Write-Success "Next.js 16.0.8 confirmed"
    }

    # Check proxy file
    if (-not (Test-Path "apps\web\proxy.ts")) {
        Write-Error-Custom "proxy.ts not found"
        $failed = $true
    }
    else {
        Write-Success "proxy.ts exists"
    }

    # Check middleware removed
    if (Test-Path "apps\web\middleware.ts") {
        Write-Warning-Custom "middleware.ts still exists (should be removed)"
    }
    else {
        Write-Success "middleware.ts removed"
    }

    if (-not $failed) {
        Write-Success "All validation checks passed!"
        return $true
    }
    else {
        return $false
    }
}

###############################################################################
# Phase Functions
###############################################################################

function Invoke-Phase0Emergency {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 0: Emergency React2Shell Fix"
    Write-Info "============================================"

    Write-Info "Installing React 19.2.1 (CVE fix)..."
    npm install --workspace=@kasoku/web react@19.2.1 react-dom@19.2.1 --save-exact

    Write-Success "Phase 0 complete: React2Shell patched"
    Write-Warning-Custom "This is a temporary fix. Run full migration soon."
}

function Invoke-Phase1React {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 1: React Security Patches"
    Write-Info "============================================"

    Write-Info "Updating React to 19.2.1..."
    npm install --workspace=@kasoku/web react@19.2.1 react-dom@19.2.1 --save-exact

    Write-Info "Updating React testing libraries..."
    npm install --workspace=@kasoku/web @testing-library/react@16.3.0 "@types/react@19.0.2" "@types/react-dom@19.0.2" --save-exact

    Write-Info "Updating root testing library..."
    npm install "@testing-library/react@16.3.0" --save-exact

    Write-Success "Phase 1 complete: React updated to 19.2.1"
}

function Invoke-Phase2NextJS {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 2: Next.js Core Upgrade"
    Write-Info "============================================"

    Write-Info "Updating Next.js to 16.0.8..."
    npm install --workspace=@kasoku/web next@16.0.8 eslint-config-next@16.0.8 --save-exact

    Write-Info "Running Next.js codemod..."
    try {
        npx "@next/codemod@canary" upgrade latest
    }
    catch {
        Write-Warning-Custom "Codemod had warnings (may be normal)"
    }

    Write-Info "Generating TypeScript types..."
    try {
        npx --workspace=@kasoku/web next typegen
    }
    catch {
        Write-Warning-Custom "Type generation had warnings (may be normal)"
    }

    Write-Warning-Custom "MANUAL STEP REQUIRED:"
    Write-Warning-Custom "1. Review and update async API usage (params, searchParams)"
    Write-Warning-Custom "2. Rename middleware.ts → proxy.ts (see NEXT16_MIGRATION_PLAN.md)"

    Write-Success "Phase 2 complete: Next.js updated to 16.0.8"
}

function Invoke-Phase3Clerk {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 3: Clerk Authentication Update"
    Write-Info "============================================"

    Write-Info "Updating Clerk packages..."
    npm install --workspace=@kasoku/web "@clerk/nextjs@6.34.1" "@clerk/themes@2.4.29" --save-exact

    Write-Warning-Custom "MANUAL STEP REQUIRED:"
    Write-Warning-Custom "Rename apps\web\middleware.ts → apps\web\proxy.ts"
    Write-Warning-Custom "See detailed instructions in NEXT16_MIGRATION_PLAN.md"

    Write-Success "Phase 3 complete: Clerk updated"
}

function Invoke-Phase4MajorDeps {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 4: Major Dependencies"
    Write-Info "============================================"

    Write-Info "Updating Supabase..."
    npm install --workspace=@kasoku/web "@supabase/supabase-js@2.87.0" --save-exact

    Write-Info "Updating TanStack Query..."
    npm install --workspace=@kasoku/web "@tanstack/react-query@5.80.6" "@tanstack/react-query-devtools@5.80.6" --save-exact

    Write-Info "Updating TipTap editor..."
    npm install --workspace=@kasoku/web "@tiptap/core@3.6.1" "@tiptap/react@3.6.1" "@tiptap/starter-kit@3.6.1" "@tiptap/extension-image@3.6.1" "@tiptap/extension-link@3.6.1" "@tiptap/extension-placeholder@3.6.1" "@tiptap/extension-table@3.6.1" "@tiptap/extension-table-cell@3.6.1" "@tiptap/extension-table-header@3.6.1" "@tiptap/extension-table-row@3.6.1" "@tiptap/extension-task-item@3.6.1" "@tiptap/extension-task-list@3.6.1" "@tiptap/extension-underline@3.6.1" --save-exact

    Write-Info "Updating AI SDK..."
    npm install --workspace=@kasoku/web ai@4.3.16 "@ai-sdk/openai@1.3.22" "@ai-sdk/xai@1.2.16" --save-exact

    Write-Info "Updating form handling..."
    npm install --workspace=@kasoku/web react-hook-form@7.54.1 "@hookform/resolvers@3.9.1" --save-exact

    Write-Info "Updating date handling..."
    npm install --workspace=@kasoku/web date-fns@3.6.0 react-day-picker@9.4.3 --save-exact

    Write-Success "Phase 4 complete: Major dependencies updated"
}

function Invoke-Phase5UI {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 5: UI Libraries"
    Write-Info "============================================"

    Write-Info "Updating Radix UI components..."
    npm install --workspace=@kasoku/web "@radix-ui/react-accordion@1.2.2" "@radix-ui/react-alert-dialog@1.1.4" "@radix-ui/react-aspect-ratio@1.1.1" "@radix-ui/react-avatar@1.1.2" "@radix-ui/react-checkbox@1.1.3" "@radix-ui/react-collapsible@1.1.2" "@radix-ui/react-context-menu@2.2.4" "@radix-ui/react-dialog@1.1.4" "@radix-ui/react-dropdown-menu@2.1.4" "@radix-ui/react-hover-card@1.1.4" "@radix-ui/react-label@2.1.1" "@radix-ui/react-menubar@1.1.4" "@radix-ui/react-navigation-menu@1.2.3" "@radix-ui/react-popover@1.1.4" "@radix-ui/react-progress@1.1.1" "@radix-ui/react-radio-group@1.2.2" "@radix-ui/react-scroll-area@1.2.2" "@radix-ui/react-select@2.1.4" "@radix-ui/react-separator@1.1.1" "@radix-ui/react-slider@1.2.2" "@radix-ui/react-slot@1.1.1" "@radix-ui/react-switch@1.1.2" "@radix-ui/react-tabs@1.1.2" "@radix-ui/react-toast@1.2.4" "@radix-ui/react-toggle@1.1.1" "@radix-ui/react-toggle-group@1.1.1" "@radix-ui/react-tooltip@1.1.6" "@radix-ui/react-icons@1.3.2" --save-exact

    Write-Info "Updating animation and UI utilities..."
    npm install --workspace=@kasoku/web framer-motion@11.11.8 lucide-react@0.436.0 sonner@1.7.1 cmdk@1.0.0 vaul@0.9.9 embla-carousel-react@8.5.1 --save-exact

    Write-Success "Phase 5 complete: UI libraries updated"
}

function Invoke-Phase6DevTools {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 6: Development Tools"
    Write-Info "============================================"

    Write-Info "Updating testing libraries..."
    npm install --workspace=@kasoku/web "@testing-library/react@16.3.0" "@types/node@20.17.0" --save-exact

    Write-Info "Updating Playwright..."
    npm install "@playwright/test@1.55.1" playwright@1.55.1 --save-exact

    Write-Info "Updating Turbo..."
    npm install turbo@2.5.4 --save-exact

    Write-Info "Updating other dev dependencies..."
    npm install --workspace=@kasoku/web "@tailwindcss/typography@0.5.15" eslint-plugin-tailwindcss@3.17.5 jsdom@25.0.1 --save-exact

    Write-Success "Phase 6 complete: Development tools updated"
}

function Invoke-Phase7Minor {
    Write-Host ""
    Write-Info "============================================"
    Write-Info "PHASE 7: Minor Dependencies"
    Write-Info "============================================"

    Write-Info "Updating utilities..."
    npm install --workspace=@kasoku/web class-variance-authority@0.7.1 clsx@2.1.1 lru-cache@10.4.3 tailwind-merge@2.5.2 tailwindcss-animate@1.0.7 zod@3.24.1 react-error-boundary@6.0.0 react-resizable-panels@2.1.7 --save-exact

    Write-Info "Updating markdown/syntax highlighting..."
    npm install --workspace=@kasoku/web react-markdown@10.1.0 react-syntax-highlighter@15.6.1 remark-gfm@4.0.1 rehype-raw@7.0.0 --save-exact

    Write-Info "Updating DnD Kit..."
    npm install --workspace=@kasoku/web "@dnd-kit/core@6.3.1" "@dnd-kit/sortable@10.0.0" "@dnd-kit/utilities@3.2.2" --save-exact

    Write-Info "Updating CodeMirror..."
    npm install --workspace=@kasoku/web "@codemirror/lang-javascript@6.2.4" "@codemirror/lang-python@6.2.1" "@codemirror/state@6.5.2" "@codemirror/theme-one-dark@6.1.2" "@codemirror/view@6.37.1" --save-exact

    Write-Info "Updating integrations..."
    npm install --workspace=@kasoku/web stripe@16.9.0 svix@1.66.0 posthog-js@1.201.0 next-themes@0.4.3 input-otp@1.4.1 recharts@2.15.0 drizzle-orm@0.44.1 --save-exact

    Write-Success "Phase 7 complete: Minor dependencies updated"
}

###############################################################################
# Main Execution
###############################################################################

function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗"
    Write-Host "║      Next.js 16 + React 19.2.1 Migration Script               ║"
    Write-Host "║      CRITICAL: Addresses CVE-2025-55182 (React2Shell)         ║"
    Write-Host "╚════════════════════════════════════════════════════════════════╝"
    Write-Host ""

    # Special handling for validate-only mode
    if ($Phase -eq "validate") {
        $result = Test-Migration
        if (-not $result) {
            exit 1
        }
        exit 0
    }

    # Check prerequisites
    Test-Prerequisites

    # Create backup
    New-Backup

    # Run requested phase(s)
    switch ($Phase) {
        "0" {
            Invoke-Phase0Emergency
        }
        "1" {
            Invoke-Phase1React
        }
        "2" {
            Invoke-Phase2NextJS
        }
        "3" {
            Invoke-Phase3Clerk
        }
        "4" {
            Invoke-Phase4MajorDeps
        }
        "5" {
            Invoke-Phase5UI
        }
        "6" {
            Invoke-Phase6DevTools
        }
        "7" {
            Invoke-Phase7Minor
        }
        "all" {
            Invoke-Phase1React
            Invoke-Phase2NextJS
            Invoke-Phase3Clerk
            Invoke-Phase4MajorDeps
            Invoke-Phase5UI
            Invoke-Phase6DevTools
            Invoke-Phase7Minor
        }
        default {
            Write-Error-Custom "Invalid phase: $Phase"
            Write-Host "Valid phases: 0, 1, 2, 3, 4, 5, 6, 7, all, validate"
            exit 1
        }
    }

    # Run validation
    Write-Host ""
    Write-Info "============================================"
    Write-Info "Running validation checks..."
    Write-Info "============================================"

    $validationResult = Test-Migration

    if ($validationResult) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════╗"
        Write-Host "║                    ✓ MIGRATION SUCCESSFUL                      ║"
        Write-Host "╚════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Write-Success "Next.js 16.0.8 and React 19.2.1 installed"
        Write-Success "All validation checks passed"
        Write-Host ""
        Write-Info "Next steps:"
        Write-Host "  1. Review NEXT16_MIGRATION_PLAN.md for manual steps"
        Write-Host "  2. Rename middleware.ts → proxy.ts (if not done)"
        Write-Host "  3. Update async API usage (if needed)"
        Write-Host "  4. Run manual tests"
        Write-Host "  5. Commit changes"
        Write-Host ""
        Write-Info "Backup tag created: $BackupTag"
        Write-Info "To rollback: git reset --hard $BackupTag"
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════╗"
        Write-Host "║                    ✗ VALIDATION FAILED                         ║"
        Write-Host "╚════════════════════════════════════════════════════════════════╝"
        Write-Host ""
        Write-Error-Custom "Migration completed but validation failed"
        Write-Info "To rollback: git reset --hard $BackupTag"
        Write-Info "Review errors above and check NEXT16_MIGRATION_PLAN.md"
        exit 1
    }
}

# Run main function
Main
