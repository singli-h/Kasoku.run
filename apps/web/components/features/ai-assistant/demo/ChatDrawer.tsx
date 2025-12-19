"use client"

import { useRef, useEffect } from "react"
import { Send, Sparkles, X, Loader2, Edit2 } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./types"

interface ChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: (content: string) => void
  isTyping: boolean
  suggestedPrompts: string[]
  pendingCount: number
  onReviewChanges: () => void
}

export function ChatDrawer({
  open,
  onOpenChange,
  messages,
  inputValue,
  onInputChange,
  onSend,
  isTyping,
  suggestedPrompts,
  pendingCount,
  onReviewChanges,
}: ChatDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when drawer opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend(inputValue)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85dvh] max-h-[85dvh]">
        {/* Header */}
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <DrawerTitle className="text-base">AI Session Assistant</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Pending Changes Banner */}
        {pendingCount > 0 && (
          <div className="border-b bg-muted/50 px-4 py-2">
            <button
              onClick={onReviewChanges}
              className="flex w-full items-center justify-between rounded-lg bg-background p-3 shadow-sm transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {pendingCount} pending changes
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Review
              </Badge>
            </button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onReviewChanges={onReviewChanges}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Thinking</span>
                    <span className="inline-flex">
                      <span className="animate-bounce [animation-delay:0ms]">.</span>
                      <span className="animate-bounce [animation-delay:150ms]">.</span>
                      <span className="animate-bounce [animation-delay:300ms]">.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested prompts (show when few messages) */}
          {messages.length <= 3 && !isTyping && (
            <div className="mt-6">
              <p className="mb-2 text-xs text-muted-foreground">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSend(prompt)}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl border bg-muted/50 px-4 py-3 pr-12 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "max-h-32 min-h-[48px]"
                )}
                style={{
                  height: "48px",
                }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl"
              disabled={!inputValue.trim() || isTyping}
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function MessageBubble({
  message,
  onReviewChanges,
}: {
  message: ChatMessage
  onReviewChanges: () => void
}) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  )
}
