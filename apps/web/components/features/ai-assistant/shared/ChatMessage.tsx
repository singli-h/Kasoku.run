'use client'

/**
 * ChatMessage Component
 *
 * Shared message display component used by both ChatDrawer and ChatSidebar.
 * Handles user and assistant messages with thinking content extraction.
 */

import { useMemo } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'
import { CompactThinkingSection, extractThinkingContent } from '../ThinkingSection'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const textContent = message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')

  // Extract thinking content from message (T064)
  const thinkingContent = useMemo(() => {
    if (isUser) return null
    return extractThinkingContent(
      message.parts.map(part => ({
        type: part.type,
        text: (part.type === 'text' || part.type === 'reasoning') ? (part as { text: string }).text : undefined,
      }))
    )
  }, [message.parts, isUser])

  // Remove thinking content from displayed text if it was extracted
  const displayText = useMemo(() => {
    if (!textContent || !thinkingContent) return textContent

    // Remove thinking tags and their content from display text
    return textContent
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/\*\*Reasoning:?\*\*\s*[\s\S]*?(?=\n\n|\*\*|$)/gi, '')
      .trim()
  }, [textContent, thinkingContent])

  // Check for any tool-related parts (tool-invocation, tool-result, etc.)
  const hasToolParts = message.parts.some((part) => part.type.startsWith('tool-'))

  // Count tool calls in progress (not yet completed)
  const toolCalls = message.parts.filter((part) => {
    if (!part.type.startsWith('tool-') || part.type.startsWith('tool-result')) return false
    const toolPart = part as { state?: string; output?: unknown; result?: unknown }
    const hasOutput = toolPart.output !== undefined || toolPart.result !== undefined
    return !(hasOutput || toolPart.state === 'output-available')
  })

  if (!isUser && !textContent && toolCalls.length > 0) {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing {toolCalls.length} action{toolCalls.length > 1 ? 's' : ''}...</span>
        </div>
      </div>
    )
  }

  // Only return null if message is truly empty (no text, no thinking, no tool parts)
  if (!displayText && !thinkingContent && !hasToolParts) return null

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <span className="text-xs font-medium text-muted-foreground">You</span>
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        {/* Thinking section - collapsible (T064) */}
        {thinkingContent && (
          <CompactThinkingSection content={thinkingContent} />
        )}

        {/* Main message content */}
        {displayText && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            )}
          >
            <p className="whitespace-pre-wrap text-sm">{displayText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
