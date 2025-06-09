"use client"

import { useChat } from "@ai-sdk/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"
import { RichMessageContent } from "./rich-message-content"

interface ChatProps {
  className?: string
}

export default function Chat({ className }: ChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat"
  })

  return (
    <Card className={`h-[600px] flex flex-col ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with the AI assistant</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 border ${
                    message.role === "user"
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30 ml-12"
                      : "bg-muted/30 border-border mr-12"
                  }`}
                >
                  <RichMessageContent 
                    content={message.content} 
                    role={message.role as 'user' | 'assistant'} 
                  />
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-3">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
} 