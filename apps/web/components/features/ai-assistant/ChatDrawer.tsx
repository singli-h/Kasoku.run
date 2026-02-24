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

import { useRef, useEffect, useCallback } from 'react'
import { Bot, Send, X, Loader2, Mic, MicOff, RotateCcw, Maximize2, Minimize2, ArrowLeft, AlertCircle } from 'lucide-react'
import { Drawer } from 'vaul'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'
import { useSpeechRecognition } from './use-speech-recognition'
import { useChatScrollToBottom } from './hooks/useChatScrollToBottom'
import { ChatMessage } from './shared/ChatMessage'
import { EmptyState } from './shared/EmptyState'
import { deduplicateMessages } from './utils/message-utils'

interface ChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: UIMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  /** Stream error message (network failure, timeout, etc.) */
  streamError?: string | null
  /** Callback to clear the error and allow retry */
  onRetry?: () => void
  onStop?: () => void
  onClearChat?: () => void
  /** Whether the drawer is in expanded (full-screen) mode */
  isExpanded?: boolean
  /** Callback to expand to full screen */
  onExpand?: () => void
  /** Callback to collapse back to drawer */
  onCollapse?: () => void
}

export function ChatDrawer({
  open,
  onOpenChange,
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading = false,
  streamError,
  onRetry,
  onStop,
  onClearChat,
  isExpanded = false,
  onExpand,
  onCollapse,
}: ChatDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Deduplicate messages by ID to prevent React key collision warnings
  const uniqueMessages = deduplicateMessages(messages)
  const messagesEndRef = useChatScrollToBottom(uniqueMessages)

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

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-60 flex flex-col bg-background border-t shadow-xl transition-all duration-300",
            isExpanded
              ? "h-full rounded-none"
              : "h-[85vh] rounded-t-2xl"
          )}
        >
          <VisuallyHidden.Root asChild>
            <Drawer.Title>AI Session Assistant Chat</Drawer.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Drawer.Description>Chat interface for AI-powered session modifications</Drawer.Description>
          </VisuallyHidden.Root>

          {/* Drag handle - hidden when expanded */}
          {!isExpanded && (
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            </div>
          )}

          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b px-4 py-3",
            isExpanded && "pt-4"
          )}>
            {/* Left side: Back button when expanded, or bot icon */}
            <div className="flex items-center gap-3">
              {isExpanded && onCollapse ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCollapse}
                  className="gap-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Plan</span>
                </Button>
              ) : (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">AI Assistant</h3>
                    <p className={cn(
                      "text-xs",
                      streamError ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {streamError ? 'Error occurred' : isLoading ? 'Thinking...' : 'Ready to help'}
                    </p>
                  </div>
                </>
              )}
            </div>
            {/* Right side: action buttons */}
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
              {/* Expand/Collapse button */}
              {!isExpanded && onExpand && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExpand}
                  className="h-8 w-8"
                  title="Expand to full screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {isExpanded && onCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCollapse}
                  className="h-8 w-8"
                  title="Collapse to drawer"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // If expanded, collapse first then close
                  if (isExpanded && onCollapse) {
                    onCollapse()
                  }
                  onOpenChange(false)
                }}
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
                {streamError && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-destructive font-medium">Failed to get response</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{streamError}</p>
                      {onRetry && (
                        <button
                          onClick={onRetry}
                          className="text-xs text-primary hover:underline mt-2"
                        >
                          Dismiss and try again
                        </button>
                      )}
                    </div>
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
