"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Plus, Filter, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ListContainer } from "@/components/composed"
import { ConversationItem } from "./conversation-item"
import type { ConversationListItem } from "@/types/conversations"
import type { FilterConfig } from "@/types/composed"

interface ConversationListProps {
  userId: string
}

// Mock conversations data for development
const mockConversations: ConversationListItem[] = [
  {
    id: "1",
    user_id: "user_123",
    title: "Getting Started with AI Copilot",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived: false,
    message_count: 12,
    last_message: "Thanks for helping me understand how to implement the user authentication system!",
    last_message_at: new Date().toISOString(),
  },
  {
    id: "2", 
    user_id: "user_123",
    title: "Database Schema Design",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    archived: false,
    message_count: 8,
    last_message: "Can you help me design the relationships between users, tasks, and organizations?",
    last_message_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "3",
    user_id: "user_123", 
    title: "React Component Architecture",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    archived: true,
    message_count: 25,
    last_message: "Perfect! The component structure is now much cleaner and more maintainable.",
    last_message_at: new Date(Date.now() - 172800000).toISOString(),
  }
]

export function ConversationList({ userId }: ConversationListProps) {
  const [allConversations, setAllConversations] = useState<ConversationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "all",
    sort: "updated_at"
  })

  // Fetch conversations only once
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setAllConversations(mockConversations)
      } catch (err) {
        setError("Failed to load conversations")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [userId]) // Only depend on userId

  // Filter and sort conversations using useMemo for performance
  const filteredConversations = useMemo(() => {
    let filtered = [...allConversations]
    
    // Apply status filter
    if (filterValues.status !== "all") {
      filtered = filtered.filter(conversation => 
        filterValues.status === "archived" ? conversation.archived : !conversation.archived
      )
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conversation => 
        conversation.title.toLowerCase().includes(query) ||
        conversation.last_message?.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (filterValues.sort) {
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "message_count":
          return b.message_count - a.message_count
        default: // updated_at
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
    
    return filtered
  }, [allConversations, searchQuery, filterValues])

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleConversationUpdate = () => {
    // Refresh the conversations list
    setAllConversations([...allConversations])
  }

  // Define filters
  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      icon: <Filter className="h-4 w-4" />,
      options: [
        { value: "all", label: "All Conversations" },
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" }
      ]
    }
  ]

  // Define sort options
  const sortOptions = [
    { value: "updated_at", label: "Last Updated" },
    { value: "created_at", label: "Date Created" },
    { value: "title", label: "Title" },
    { value: "message_count", label: "Message Count" }
  ]

  // Header actions
  const headerActions = (
    <Link href="/copilot/new">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Conversation
      </Button>
    </Link>
  )

  // Empty state configuration
  const emptyState = {
    icon: <MessageCircle className="h-12 w-12" />,
    title: "No conversations found",
    description: searchQuery ? 
      `No conversations found matching "${searchQuery}"` :
      "Start a new conversation with AI Copilot to get help with your development tasks",
    actionLabel: "Start Conversation",
    actionHref: "/copilot/new"
  }

  return (
    <ListContainer
      items={filteredConversations}
      loading={isLoading}
      error={error}
      title="AI Copilot"
      description="Manage and review your AI conversation history"
      searchPlaceholder="Search conversations..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      sortOptions={sortOptions}
      sortValue={filterValues.sort}
      onSortChange={(value) => handleFilterChange("sort", value)}
      renderItem={(conversation) => (
        <ConversationItem 
          key={conversation.id} 
          conversation={conversation} 
          onConversationUpdate={handleConversationUpdate}
        />
      )}
      emptyState={emptyState}
      headerActions={headerActions}
    />
  )
} 