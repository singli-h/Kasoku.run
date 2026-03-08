'use client'

/**
 * useAILayoutMode Hook
 *
 * Responsive layout detection for AI assistant UI.
 * Determines whether to show drawer (mobile/tablet) or side panel (desktop).
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { useState, useEffect } from 'react'

export type AILayoutMode = 'mobile' | 'tablet' | 'desktop'

interface Breakpoints {
  /** Tablet starts at this width (default: 640px) */
  tablet: number
  /** Desktop starts at this width (default: 1024px) */
  desktop: number
}

const DEFAULT_BREAKPOINTS: Breakpoints = {
  tablet: 640,
  desktop: 1024,
}

/**
 * Detect current layout mode based on window width.
 *
 * @param breakpoints - Custom breakpoints (optional)
 * @returns Current layout mode: 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * ```tsx
 * const layoutMode = useAILayoutMode()
 *
 * if (layoutMode === 'desktop') {
 *   return <AISidePanel>{content}</AISidePanel>
 * }
 * return (
 *   <>
 *     {content}
 *     <ChatDrawer />
 *   </>
 * )
 * ```
 */
export function useAILayoutMode(breakpoints?: Partial<Breakpoints>): AILayoutMode {
  const { tablet, desktop } = { ...DEFAULT_BREAKPOINTS, ...breakpoints }

  const [mode, setMode] = useState<AILayoutMode>('mobile')

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth
      if (width >= desktop) {
        setMode('desktop')
      } else if (width >= tablet) {
        setMode('tablet')
      } else {
        setMode('mobile')
      }
    }

    // Initial check
    checkWidth()

    // Listen for resize
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [tablet, desktop])

  return mode
}

/**
 * Check if current layout is mobile.
 */
export function useIsMobile(): boolean {
  const mode = useAILayoutMode()
  return mode === 'mobile'
}

/**
 * Check if current layout is tablet or larger.
 */
export function useIsTabletOrLarger(): boolean {
  const mode = useAILayoutMode()
  return mode === 'tablet' || mode === 'desktop'
}

/**
 * Check if current layout is desktop.
 */
export function useIsDesktop(): boolean {
  const mode = useAILayoutMode()
  return mode === 'desktop'
}

/**
 * Get drawer height based on layout mode.
 * Returns CSS value for drawer height.
 */
export function useDrawerHeight(): string {
  const mode = useAILayoutMode()

  switch (mode) {
    case 'mobile':
      return '85vh'
    case 'tablet':
      return '70vh'
    default:
      return '100%' // Desktop uses side panel, not drawer
  }
}
