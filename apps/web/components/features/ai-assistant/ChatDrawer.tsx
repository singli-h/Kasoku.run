'use client'

/**
 * ChatDrawer Component
 *
 * Mobile sliding drawer interface for AI conversation.
 * Uses Vaul for drawer behavior.
 * Consistent styling with ChatSidebar.
 * Includes collapsible ThinkingSection for AI reasoning (T064).
 *
 * @see docs/features/plans/individual/tasks.md T064
 */

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { Bot, Send, X, Loader2, Mic, MicOff, RotateCcw } from 'lucide-react'
import { Drawer } from 'vaul'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'
import { useSpeechRecognition } from './use-speech-recognition'
import { CompactThinkingSection, extractThinkingContent } from './ThinkingSection'
import { deduplicateMessages } from './utils/message-utils'

interface ChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: UIMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  onStop?: () => void
  onClearChat?: () => void
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
  onClearChat,
}: ChatDrawerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Deduplicate messages by ID to prevent React key collision warnings
  const uniqueMessages = deduplicateMessages(messages)

  const handleTranscript = useCallback(
    (transcript: string) => {
      const newValue = input.trim()
        ? `${input.trim()} ${transcript.trim()}`
        : transcript.trim()
      onInputChange(newValue)
    },
    [input, onInputChange]
  )

  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    continuous: false,
    language: 'en-US',
  })

  const handleMicToggle = useCallback(() => {
    isListening ? stopListening() : startListening()
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-60 flex h-[85vh] flex-col rounded-t-2xl bg-background border-t shadow-xl">
          <VisuallyHidden.Root asChild>
            <Drawer.Title>AI Session Assistant Chat</Drawer.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Drawer.Description>Chat interface for AI-powered session modifications</Drawer.Description>
          </VisuallyHidden.Root>

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Thinking...' : 'Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onClearChat && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClearChat}
                  className="h-8 w-8"
                  title="Start new chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {uniqueMessages.length === 0 ? (
              <EmptyState
                onSuggestionClick={(suggestion) => {
                  onInputChange(suggestion)
                  inputRef.current?.focus()
                }}
              />
            ) : (
              <div className="space-y-4">
                {uniqueMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {isListening && (
              <div className="flex items-center gap-2 mb-2 text-sm text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span>{transcript || 'Listening...'}</span>
              </div>
            )}
            {speechError && (
              <p className="text-xs text-destructive mb-2">{speechError}</p>
            )}

            <form onSubmit={onSubmit} className="flex gap-2">
              {isSpeechSupported && (
                <Button
                  type="button"
                  variant={isListening ? 'default' : 'outline'}
                  size="icon"
                  onClick={handleMicToggle}
                  disabled={isLoading}
                  className={cn(
                    'shrink-0',
                    isListening && 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  )}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Input
                ref={inputRef}
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

function ChatMessage({ message }: { message: UIMessage }) {
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
        text: part.type === 'text' ? (part as { text: string }).text : undefined
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

  if (!displayText && !thinkingContent) return null

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

interface EmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
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

interface SuggestionChipProps {
  text: string
  onClick?: () => void
}

function SuggestionChip({ text, onClick }: SuggestionChipProps) {
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

/**
 * Trigger button for opening the chat drawer/sidebar.
 */
interface ChatTriggerProps {
  onClick: () => void
  hasChanges?: boolean
  changeCount?: number
  hidden?: boolean
}

export function ChatTrigger({
  onClick,
  hasChanges = false,
  changeCount = 0,
  hidden = false,
}: ChatTriggerProps) {
  if (hidden) return null

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
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
