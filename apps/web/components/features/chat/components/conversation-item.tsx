"use client"

import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ListItem } from "@/components/composed"
import type { ConversationListItem } from "@/types/conversations"

interface ConversationItemProps {
  conversation: ConversationListItem
  onConversationUpdate?: () => void
}

export function ConversationItem({
  conversation,
  onConversationUpdate
}: ConversationItemProps) {
  const actionsDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {
          // TODO: Navigate to conversation detail
          window.location.href = `/copilot/${conversation.id}`
        }}>
          View Conversation
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          // TODO: Implement rename conversation
          console.log('Rename conversation', conversation.id)
        }}>
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          // TODO: Implement archive conversation
          console.log('Archive conversation', conversation.id)
        }}>
          {conversation.archived ? 'Unarchive' : 'Archive'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => {
            // TODO: Implement delete conversation
            console.log('Delete conversation', conversation.id)
          }}
        >
          Delete Conversation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <ListItem
      href={`/copilot/${conversation.id}`}
      showActions={true}
      actions={actionsDropdown}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground hover:text-primary transition-colors">
              {conversation.title}
            </h3>
            
            {conversation.last_message && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {conversation.last_message}
              </p>
            )}
            
            <div className="flex items-center space-x-2 mt-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                conversation.archived ? "bg-gray-400 dark:bg-gray-600" : "bg-blue-500"
              )} />
              
              <Badge 
                variant={conversation.archived ? 'secondary' : 'default'}
                className={cn(
                  "text-xs",
                  conversation.archived 
                    ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                )}
              >
                {conversation.archived ? 'Archived' : 'Active'}
              </Badge>

              <Badge variant="outline" className="text-xs">
                {conversation.message_count} messages
              </Badge>
              
              <span className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Conversation icon */}
          <div className="h-8 w-8 border-2 border-border rounded-full flex items-center justify-center bg-muted">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </ListItem>
  )
} 