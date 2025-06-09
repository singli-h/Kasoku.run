"use client"

import { useState } from "react"
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ConversationWithMessages } from "@/types/conversations"
import { RichMessageContent } from "./rich-message-content"

interface ConversationDetailContentProps {
  conversation: ConversationWithMessages
  userId: string
}

export function ConversationDetailContent({
  conversation,
  userId
}: ConversationDetailContentProps) {
  const [title, setTitle] = useState(conversation.title)
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    id: conversation.id,
    body: {
      conversationId: conversation.id
    },
    initialMessages: conversation.messages?.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    })) || []
  })

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Link href="/copilot">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {messages.length} messages
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              Archive
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">Start a conversation</p>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your projects, tasks, or need help with coding.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[80%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
                  message.role === 'user' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <Card className={cn(
                  "flex-1 border",
                  message.role === 'user' 
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30" 
                    : "bg-muted/30 border-border"
                )}>
                  <CardContent className="p-3">
                    <RichMessageContent 
                      content={message.content} 
                      role={message.role as 'user' | 'assistant'} 
                    />
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="flex-1 bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask AI Copilot anything..."
              disabled={isLoading}
              className="flex-1"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {error && (
            <p className="text-sm text-destructive mt-2">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
} 