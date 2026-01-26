'use client'

/**
 * EmptyState Component
 *
 * Shared empty state display for chat interfaces.
 * Shows welcome message and suggestion chips.
 */

import { Bot } from 'lucide-react'
import { SuggestionChip } from './SuggestionChip'

interface EmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const suggestions = [
    'Add 3 sets of face pulls at the end',
    'Swap back squats for safety bar squats',
    'Increase all sets by 1 rep',
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold text-foreground">How can I help?</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        I can help you modify this session. Try asking me to:
      </p>
      <div className="space-y-2 text-sm">
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion}
            text={suggestion}
            onClick={onSuggestionClick ? () => onSuggestionClick(suggestion) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
