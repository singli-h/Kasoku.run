'use client'

/**
 * ThinkingSection Component
 *
 * Collapsible "Thinking..." section displaying AI reasoning in ChatGPT style.
 * Shows a collapsed indicator by default, expands to show reasoning on click.
 *
 * Features:
 * - Collapsed state: Shows "Thinking..." indicator with toggle icon
 * - Expanded state: Shows full AI reasoning text
 * - Smooth expand/collapse animation
 * - Icon toggle (chevron right/down)
 *
 * @see docs/features/plans/individual/tasks.md T063-T066
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Lightbulb, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThinkingSectionProps {
  /** The thinking/reasoning content to display */
  content: string

  /** Whether the section is initially expanded */
  defaultExpanded?: boolean

  /** Whether AI is currently thinking (shows animated indicator) */
  isThinking?: boolean

  /** Label text (default: "Thinking") */
  label?: string

  /** Additional className for styling */
  className?: string

  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void
}

export function ThinkingSection({
  content,
  defaultExpanded = false,
  isThinking = false,
  label = 'Thinking',
  className,
  onExpandedChange,
}: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback(() => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onExpandedChange?.(newState)
  }, [isExpanded, onExpandedChange])

  // Don't render if no content and not thinking
  if (!content && !isThinking) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border',
        'bg-gradient-to-r from-muted/50 to-muted/30',
        'border-border/60',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header/Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'text-left text-sm text-muted-foreground',
          'hover:bg-muted/50 transition-colors',
          'rounded-lg'
        )}
        aria-expanded={isExpanded}
        aria-controls="thinking-content"
      >
        {/* Toggle icon with animation */}
        <motion.div
          initial={false}
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
        </motion.div>

        {/* Thinking indicator icon */}
        <div className="flex-shrink-0">
          {isThinking ? (
            <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
          ) : (
            <Lightbulb className="h-4 w-4 text-amber-500" />
          )}
        </div>

        {/* Label */}
        <span className="font-medium text-foreground">
          {label}
        </span>

        {/* Thinking animation dots */}
        {isThinking && (
          <span className="flex items-center gap-0.5 ml-1">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              className="w-1 h-1 rounded-full bg-violet-400"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-1 h-1 rounded-full bg-violet-400"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-1 h-1 rounded-full bg-violet-400"
            />
          </span>
        )}

        {/* Content preview when collapsed */}
        {!isExpanded && content && !isThinking && (
          <span className="text-muted-foreground/70 truncate ml-1 flex-1">
            {content.length > 50 ? `${content.slice(0, 50)}...` : content}
          </span>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="thinking-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-3 pb-3 pt-1',
                'border-t border-border/40'
              )}
            >
              <div className="ml-6 text-sm text-muted-foreground whitespace-pre-wrap">
                {content || (isThinking && 'Processing your request...')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Compact variant of ThinkingSection for inline use
 * Shows just the toggle with minimal styling
 */
interface CompactThinkingSectionProps {
  content: string
  isThinking?: boolean
  className?: string
}

export function CompactThinkingSection({
  content,
  isThinking = false,
  className,
}: CompactThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content && !isThinking) return null

  return (
    <div className={cn('text-xs text-muted-foreground', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="h-3 w-3" />
        </motion.div>
        <span className="font-medium">
          {isThinking ? 'Thinking...' : 'Show reasoning'}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-4 pl-2 border-l-2 border-muted text-muted-foreground">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Extract thinking/reasoning content from AI message parts
 */
export function extractThinkingContent(messageParts: Array<{ type: string; text?: string }>): string | null {
  // Look for parts that contain reasoning or thinking markers
  for (const part of messageParts) {
    if (part.type === 'text' && part.text) {
      // Check if the text contains thinking markers
      const text = part.text

      // Look for <thinking>...</thinking> tags
      const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/i)
      if (thinkingMatch) {
        return thinkingMatch[1].trim()
      }

      // Look for reasoning block markers
      const reasoningMatch = text.match(/\*\*Reasoning:?\*\*\s*([\s\S]*?)(?=\n\n|\*\*|$)/i)
      if (reasoningMatch) {
        return reasoningMatch[1].trim()
      }

      // Look for "Let me think..." or similar patterns
      const thinkMatch = text.match(/(?:Let me think|I'm thinking|Analyzing|Considering)[^.]*\.([\s\S]*?)(?=\n\n|$)/i)
      if (thinkMatch) {
        return thinkMatch[0].trim()
      }
    }
  }

  return null
}

export type { ThinkingSectionProps, CompactThinkingSectionProps }
