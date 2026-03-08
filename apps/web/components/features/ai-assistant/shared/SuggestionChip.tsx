'use client'

/**
 * SuggestionChip Component
 *
 * Shared suggestion button/chip for chat interfaces.
 * Can be interactive or static depending on whether onClick is provided.
 */

interface SuggestionChipProps {
  text: string
  onClick?: () => void
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  if (!onClick) {
    // If no handler, display as static text without interactive styling
    return (
      <div className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-sm">
        &ldquo;{text}&rdquo;
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground hover:bg-muted/80 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Try suggestion: ${text}`}
    >
      &ldquo;{text}&rdquo;
    </button>
  )
}
