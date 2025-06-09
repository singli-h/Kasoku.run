import type { ListItem } from './composed'

export interface ConversationListItem extends ListItem {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  archived: boolean
  message_count: number
  last_message?: string
  last_message_at?: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: any // JSONB content matching Chat SDK format
  created_at: string
  metadata?: any
}

export interface ConversationWithMessages extends ConversationListItem {
  messages: ConversationMessage[]
}

export interface CreateConversationData {
  title: string
  initial_message?: string
}

export interface UpdateConversationData {
  title?: string
  archived?: boolean
}

export interface ConversationListFilters {
  archived?: boolean
  search?: string
  date_from?: string
  date_to?: string
} 