"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Bot, User, Archive, Trash2, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { RichMessageContentOptimized } from "./rich-message-content-optimized"

interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  archived: boolean
  message_count: number
  messages: Array<{
    id: string
    content: string
    role: 'user' | 'assistant'
    created_at: string
  }>
}

interface ConversationDetailContentProps {
  conversation: Conversation
  userId: string
}

export function ConversationDetailContent({ 
  conversation, 
  userId 
}: ConversationDetailContentProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState(conversation.messages)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(conversation.title)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    
    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      content: input,
      role: 'user' as const,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")

    // TODO: Send to AI API and get response
    // For now, add a placeholder response
    setTimeout(() => {
      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        content: "I'm a placeholder response. This chat functionality is not yet implemented but the UI is ready for integration.",
        role: 'assistant' as const,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleTitleSave = () => {
    // TODO: Save title to database
    setIsEditingTitle(false)
  }

  const handleArchive = () => {
    // TODO: Archive conversation
    console.log('Archive conversation')
  }

  const handleDelete = () => {
    // TODO: Delete conversation
    console.log('Delete conversation')
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1">
            <Link href="/copilot">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave()
                    if (e.key === 'Escape') setIsEditingTitle(false)
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div>
                  <h1 className="text-lg font-semibold">{conversation.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {messages.length} messages • {new Date(conversation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
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
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message below.
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
                    <RichMessageContentOptimized 
                      content={message.content} 
                      role={message.role} 
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
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kasoku AI about training, nutrition, recovery..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  )
} 