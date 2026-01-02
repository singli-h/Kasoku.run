'use client'

/**
 * ChatSidebar Component
 *
 * Desktop right sidebar for AI conversation.
 * Clean, minimal design with smooth transitions.
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Loader2, Mic, MicOff, Pin, PinOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'
import { useSpeechRecognition } from './use-speech-recognition'

interface ChatSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPinned?: boolean
  onPinChange?: (pinned: boolean) => void
  messages: UIMessage[]
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  onStop?: () => void
  onClearChat?: () => void
}

const SIDEBAR_WIDTH = 400

export function ChatSidebar({
  open,
  onOpenChange,
  isPinned = false,
  onPinChange,
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading = false,
  onStop,
  onClearChat,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPinned, setLocalPinned] = useState(isPinned)

  // Deduplicate messages by ID to prevent React key collision warnings
  // This can happen when AI SDK adds messages during tool execution flow
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>()
    return messages.filter((message) => {
      if (seen.has(message.id)) {
        return false
      }
      seen.add(message.id)
      return true
    })
  }, [messages])

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

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  const handlePinToggle = () => {
    const newPinned = !localPinned
    setLocalPinned(newPinned)
    onPinChange?.(newPinned)
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        /* Sidebar - pushes content, no backdrop needed */
        <motion.aside
          initial={{ x: SIDEBAR_WIDTH }}
          animate={{ x: 0 }}
          exit={{ x: SIDEBAR_WIDTH }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          style={{ width: SIDEBAR_WIDTH }}
          className="fixed top-0 right-0 z-40 h-full flex flex-col bg-background border-l shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
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
                  onClick={handlePinToggle}
                  className={cn(
                    'h-8 w-8',
                    localPinned && 'text-primary'
                  )}
                  title={localPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                >
                  {localPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </Button>
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
                <EmptyState />
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
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  const textContent = message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')

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

  if (!textContent) return null

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
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{textContent}</p>
      </div>
    </div>
  )
}

function EmptyState() {
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
        <SuggestionChip text="Add 3 sets of face pulls at the end" />
        <SuggestionChip text="Swap back squats for safety bar squats" />
        <SuggestionChip text="Increase all sets by 1 rep" />
      </div>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <div className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
      &ldquo;{text}&rdquo;
    </div>
  )
}
