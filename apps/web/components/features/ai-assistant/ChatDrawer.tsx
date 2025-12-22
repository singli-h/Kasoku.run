'use client'

/**
 * ChatDrawer Component
 *
 * Sliding drawer interface for AI conversation.
 * Uses Vaul for drawer behavior.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, Loader2 } from 'lucide-react'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'

interface ChatDrawerProps {
  /** Whether the drawer is open */
  open: boolean

  /** Called when drawer open state changes */
  onOpenChange: (open: boolean) => void

  /** Chat messages */
  messages: UIMessage[]

  /** Input value */
  input: string

  /** Handle input change */
  onInputChange: (value: string) => void

  /** Handle form submission */
  onSubmit: (e: React.FormEvent) => void

  /** Whether AI is currently generating a response */
  isLoading?: boolean

  /** Stop generation callback */
  onStop?: () => void
}

export function ChatDrawer({
  open,
  onOpenChange,
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading = false,
  onStop,
}: ChatDrawerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex h-[85vh] flex-col rounded-t-[10px] bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">AI Assistant</h3>
                <p className="text-xs text-gray-500">
                  {isLoading ? 'Thinking...' : 'Ready to help'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Ask me to modify the session..."
                className="flex-1"
                disabled={isLoading}
              />
              {isLoading && onStop ? (
                <Button type="button" variant="outline" onClick={onStop}>
                  Stop
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/**
 * Individual chat message component.
 */
function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  // Extract text content from message parts
  const textContent = message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')

  // Skip if no text content (e.g., tool-only messages)
  if (!textContent) {
    return null
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-gray-200' : 'bg-blue-100'
        )}
      >
        {isUser ? (
          <span className="text-xs font-medium">You</span>
        ) : (
          <Bot className="h-4 w-4 text-blue-600" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{textContent}</p>
      </div>
    </div>
  )
}

/**
 * Empty state shown when no messages.
 */
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <Bot className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="mb-2 font-medium">How can I help?</h3>
      <p className="mb-4 max-w-sm text-sm text-gray-500">
        I can help you modify this session. Try asking me to:
      </p>
      <div className="space-y-2 text-sm text-gray-600">
        <SuggestionChip text="Add 3 sets of face pulls at the end" />
        <SuggestionChip text="Swap back squats for safety bar squats" />
        <SuggestionChip text="Increase all sets by 1 rep" />
        <SuggestionChip text="Find exercises for posterior chain" />
      </div>
    </div>
  )
}

/**
 * Clickable suggestion chip.
 */
function SuggestionChip({ text }: { text: string }) {
  return (
    <div className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700">
      "{text}"
    </div>
  )
}

/**
 * Trigger button for opening the chat drawer.
 */
interface ChatTriggerProps {
  onClick: () => void
  hasChanges?: boolean
  changeCount?: number
}

export function ChatTrigger({
  onClick,
  hasChanges = false,
  changeCount = 0,
}: ChatTriggerProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
      size="icon"
    >
      <Bot className="h-6 w-6" />
      {hasChanges && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {changeCount}
        </span>
      )}
    </Button>
  )
}
