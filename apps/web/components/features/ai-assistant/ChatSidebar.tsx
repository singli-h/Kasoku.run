'use client'

/**
 * ChatSidebar Component
 *
 * Desktop right sidebar for AI conversation.
 * Clean, minimal design with smooth transitions.
 * Includes collapsible ThinkingSection for AI reasoning (T065).
 *
 * @see docs/features/plans/individual/tasks.md T065
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Loader2, Mic, MicOff, Pin, PinOff, RotateCcw, Maximize2, Minimize2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UIMessage } from '@ai-sdk/react'
import { useSpeechRecognition } from './use-speech-recognition'
import { useChatScrollToBottom } from './hooks/useChatScrollToBottom'
import { ChatMessage } from './shared/ChatMessage'
import { EmptyState } from './shared/EmptyState'
import { deduplicateMessages } from './utils/message-utils'

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
  /** Whether the sidebar is in expanded (full-width) mode */
  isExpanded?: boolean
  /** Callback to expand to full width */
  onExpand?: () => void
  /** Callback to collapse back to sidebar */
  onCollapse?: () => void
}

const SIDEBAR_WIDTH = 400
const EXPANDED_WIDTH = '100vw'

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
  isExpanded = false,
  onExpand,
  onCollapse,
}: ChatSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPinned, setLocalPinned] = useState(isPinned)

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
        /* Sidebar - pushes content, no backdrop needed. Expands to full width when isExpanded */
        <motion.aside
          initial={{ x: isExpanded ? 0 : SIDEBAR_WIDTH, width: isExpanded ? EXPANDED_WIDTH : SIDEBAR_WIDTH }}
          animate={{ x: 0, width: isExpanded ? EXPANDED_WIDTH : SIDEBAR_WIDTH }}
          exit={{ x: isExpanded ? 0 : SIDEBAR_WIDTH, opacity: isExpanded ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className={cn(
            "fixed top-0 right-0 z-40 h-full flex flex-col bg-background border-l shadow-xl",
            isExpanded && "border-l-0"
          )}
        >
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-b",
              isExpanded && "max-w-4xl mx-auto w-full"
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
                      <p className="text-xs text-muted-foreground">
                        {isLoading ? 'Thinking...' : 'Ready to help'}
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
                    title="Expand to full width"
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
                    title="Collapse to sidebar"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                )}
                {/* Pin button - only show when not expanded */}
                {!isExpanded && (
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
            <div className={cn(
              "flex-1 overflow-y-auto p-4",
              isExpanded && "flex justify-center"
            )}>
              <div className={cn(
                "w-full",
                isExpanded && "max-w-4xl"
              )}>
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
            </div>

            {/* Input */}
            <div className={cn(
              "border-t p-4",
              isExpanded && "flex justify-center"
            )}>
              <div className={cn(
                "w-full",
                isExpanded && "max-w-4xl"
              )}>
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
            </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

