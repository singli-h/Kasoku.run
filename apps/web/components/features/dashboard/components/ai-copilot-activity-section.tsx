"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ExternalLink, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIConversation } from "../types/dashboard-types"

interface AICopilotActivitySectionProps {
  activities: AIConversation[]
}

export function AICopilotActivitySection({ activities }: AICopilotActivitySectionProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center">
              <Bot className="h-5 w-5 mr-2 text-primary" />
              AI Copilot Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Recent AI conversations and help
            </CardDescription>
          </div>
          <Link 
            href="/copilot" 
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-semibold border border-transparent hover:border-primary/20 px-2 py-1 rounded-md"
          >
            View All
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">No AI conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Start a conversation with AI Copilot to get help!
            </p>
            <Link 
              href="/copilot" 
              className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI Copilot
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <Link key={activity.id} href={`/copilot/${activity.id}`}>
                <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </h4>
                        {activity.isUnread && (
                          <Badge 
                            variant="default" 
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {activity.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {activity.messageCount} message{activity.messageCount !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "ml-3 p-2 rounded-full",
                      activity.isUnread 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 