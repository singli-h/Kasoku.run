import type { UIMessage } from '@ai-sdk/react'

/**
 * Deduplicate messages by ID to prevent React key collision warnings.
 * This can happen when AI SDK adds messages during tool execution flow.
 */
export function deduplicateMessages(messages: UIMessage[]): UIMessage[] {
  const seen = new Set<string>()
  return messages.filter((message) => {
    if (seen.has(message.id)) return false
    seen.add(message.id)
    return true
  })
}
