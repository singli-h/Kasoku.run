'use client'

/**
 * ProposalFeedbackInput Component
 *
 * Input field for user to provide feedback when requesting regeneration.
 *
 * Design: Clean, focused input with minimal chrome.
 *
 * Single Responsibility: Feedback input UI only
 */

import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ProposalFeedbackInputProps {
  /** Current feedback value */
  value: string

  /** Called when feedback changes */
  onChange: (value: string) => void

  /** Called when user submits feedback */
  onSubmit: () => void

  /** Called when user cancels feedback */
  onCancel: () => void
}

export function ProposalFeedbackInput({
  value,
  onChange,
  onSubmit,
  onCancel,
}: ProposalFeedbackInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        How should the AI revise this?
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Use lighter weights, fewer sets..."
          className={cn(
            'flex-1 h-9 text-sm',
            'border-border/60 focus-visible:ring-blue-500/20'
          )}
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!value.trim()}
          className={cn(
            'h-9 px-3',
            'bg-blue-600 hover:bg-blue-700 text-white',
            'disabled:opacity-50'
          )}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
