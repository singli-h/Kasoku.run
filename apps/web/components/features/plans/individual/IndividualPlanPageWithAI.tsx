'use client'

/**
 * IndividualPlanPageWithAI
 *
 * Wrapper component that combines:
 * - PlanContextProvider: Plan-level state management
 * - PlanAssistantWrapper: AI integration with context awareness
 * - IndividualPlanPage: The main UI
 *
 * This is the entry point for the unified Individual Plan Page experience.
 *
 * Architecture:
 * ```
 * IndividualPlanPageWithAI
 *   └── ErrorBoundary (catches AI-related errors)
 *         └── PlanContextProvider
 *               └── PlanAssistantWrapper
 *                     └── IndividualPlanPage (unifiedMode=true)
 * ```
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import { PlanContextProvider } from './context'
import { PlanAssistantWrapper } from './PlanAssistantWrapper'
import { IndividualPlanPage } from './IndividualPlanPage'
import type { MesocycleWithDetails } from '@/types/training'
import type { ExerciseLibraryItem } from '@/components/features/training/types'

interface IndividualPlanPageWithAIProps {
  /** The training block data */
  trainingBlock: MesocycleWithDetails

  /** Other blocks for the block switcher */
  otherBlocks?: {
    upcoming: MesocycleWithDetails[]
    completed: MesocycleWithDetails[]
  }

  /** Exercise library for inline editing */
  exerciseLibrary?: ExerciseLibraryItem[]

  /** Database user ID for exercise search visibility filtering */
  dbUserId?: string

  /**
   * Use inline mode for AI proposals.
   * When true, proposals are displayed inline instead of in an overlay.
   * @default true
   */
  useInlineMode?: boolean
}

/**
 * Fallback component displayed when the AI assistant encounters an error.
 * Allows users to still view their training plan without AI features.
 */
function PlanPageFallback({
  trainingBlock,
  otherBlocks,
  exerciseLibrary,
  error,
  resetErrorBoundary,
}: {
  trainingBlock: MesocycleWithDetails
  otherBlocks?: {
    upcoming: MesocycleWithDetails[]
    completed: MesocycleWithDetails[]
  }
  exerciseLibrary?: ExerciseLibraryItem[]
  error: unknown
  resetErrorBoundary: () => void
}) {
  const router = useRouter()
  return (
    <div className="flex flex-col">
      {/* Error notification banner */}
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">
                AI Assistant Unavailable
              </p>
              <p className="text-xs text-muted-foreground">
                You can still view and edit your training plan manually.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetErrorBoundary}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.refresh()}
              className="px-3 py-1.5 bg-muted text-foreground rounded-md text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
        {!!error && process.env.NODE_ENV === 'development' && (
          <div className="max-w-7xl mx-auto mt-2">
            <pre className="text-xs text-left bg-muted p-3 rounded-md overflow-auto max-h-32">
              {error instanceof Error ? error.message : String(error)}
              {error instanceof Error && error.stack && `\n\n${error.stack}`}
            </pre>
          </div>
        )}
      </div>

      {/* Render the plan page without AI wrapper */}
      <PlanContextProvider trainingBlock={trainingBlock}>
        <IndividualPlanPage
          trainingBlock={trainingBlock}
          otherBlocks={otherBlocks}
          unifiedMode={true}
          exerciseLibrary={exerciseLibrary}
        />
      </PlanContextProvider>
    </div>
  )
}

export function IndividualPlanPageWithAI({
  trainingBlock,
  otherBlocks,
  exerciseLibrary = [],
  dbUserId,
  useInlineMode = true,
}: IndividualPlanPageWithAIProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <PlanPageFallback
          trainingBlock={trainingBlock}
          otherBlocks={otherBlocks}
          exerciseLibrary={exerciseLibrary}
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
      onError={(error, info) => {
        console.error('[IndividualPlanPageWithAI] Error caught by boundary:', error)
        console.error('[IndividualPlanPageWithAI] Component stack:', info.componentStack)
        // Could add error reporting service here (e.g., Sentry)
      }}
      onReset={() => {
        // Reset any state that might have caused the error
        console.log('[IndividualPlanPageWithAI] Error boundary reset')
      }}
    >
      <PlanContextProvider trainingBlock={trainingBlock}>
        <PlanAssistantWrapper
          dbUserId={dbUserId}
          useInlineMode={useInlineMode}
        >
          <IndividualPlanPage
            trainingBlock={trainingBlock}
            otherBlocks={otherBlocks}
            unifiedMode={true}
            exerciseLibrary={exerciseLibrary}
          />
        </PlanAssistantWrapper>
      </PlanContextProvider>
    </ErrorBoundary>
  )
}
