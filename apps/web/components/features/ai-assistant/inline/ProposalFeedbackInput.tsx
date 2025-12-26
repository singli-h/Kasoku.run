'use client'

/**
 * ProposalFeedbackInput Component
 *
 * Input field for user to provide feedback when requesting regeneration.
 *
 * Single Responsibility: Feedback input UI only
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      <p className="text-sm text-gray-600">
        What would you like the AI to change?
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Use lighter weights, add more sets..."
          className="flex-1"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={!value.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
