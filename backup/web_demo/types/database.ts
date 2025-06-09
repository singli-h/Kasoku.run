// Database type definitions for GuideLayer AI

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: OrganizationUpdate
      }
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      memberships: {
        Row: Membership
        Insert: MembershipInsert
        Update: MembershipUpdate
      }
      roles: {
        Row: Role
        Insert: RoleInsert
        Update: RoleUpdate
      }
      user_roles: {
        Row: UserRole
        Insert: UserRoleInsert
        Update: UserRoleUpdate
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      conversations: {
        Row: Conversation
        Insert: ConversationInsert
        Update: ConversationUpdate
      }
      chat_messages: {
        Row: ChatMessage
        Insert: ChatMessageInsert
        Update: ChatMessageUpdate
      }
      kb_articles: {
        Row: KBArticle
        Insert: KBArticleInsert
        Update: KBArticleUpdate
      }
      kb_embeddings: {
        Row: KBEmbedding
        Insert: KBEmbeddingInsert
        Update: KBEmbeddingUpdate
      }
      user_memories: {
        Row: UserMemory
        Insert: UserMemoryInsert
        Update: UserMemoryUpdate
      }
      organization_memories: {
        Row: OrganizationMemory
        Insert: OrganizationMemoryInsert
        Update: OrganizationMemoryUpdate
      }
      external_refs: {
        Row: ExternalRef
        Insert: ExternalRefInsert
        Update: ExternalRefUpdate
      }
      events: {
        Row: Event
        Insert: EventInsert
        Update: EventUpdate
      }
      comments: {
        Row: Comment
        Insert: CommentInsert
        Update: CommentUpdate
      }
    }
  }
}

// Core entity types
export interface Organization {
  id: number
  name: string
  stripe_customer_id: string | null
  subscription_status: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationInsert {
  name: string
  stripe_customer_id?: string | null
  subscription_status?: string | null
}

export interface OrganizationUpdate {
  name?: string
  stripe_customer_id?: string | null
  subscription_status?: string | null
  updated_at?: string
}

export interface User {
  id: number
  clerk_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface UserInsert {
  clerk_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  onboarding_completed?: boolean
}

export interface UserUpdate {
  email?: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  onboarding_completed?: boolean
  updated_at?: string
}

export interface Membership {
  id: number
  organization_id: number
  user_id: number
  created_at: string
}

export interface MembershipInsert {
  organization_id: number
  user_id: number
}

export interface MembershipUpdate {
  organization_id?: number
  user_id?: number
}

export interface Role {
  id: number
  name: string
}

export interface RoleInsert {
  name: string
}

export interface RoleUpdate {
  name?: string
}

export interface UserRole {
  id: number
  membership_id: number
  role_id: number
  assigned_at: string
}

export interface UserRoleInsert {
  membership_id: number
  role_id: number
}

export interface UserRoleUpdate {
  membership_id?: number
  role_id?: number
}

// Application-specific entity types
export interface Task {
  id: number
  organization_id: number
  title: string
  description: string | null
  status: string
  priority: string
  budget: string | null
  timeline: string | null
  workflow: string | null
  resources: string | null
  payload: Record<string, any>
  created_by: number | null
  assignee_id: number | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskInsert {
  organization_id: number
  title: string
  description?: string | null
  status?: string
  priority?: string
  budget?: string | null
  timeline?: string | null
  workflow?: string | null
  resources?: string | null
  payload?: Record<string, any>
  created_by?: number | null
  assignee_id?: number | null
  is_deleted?: boolean
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  budget?: string | null
  timeline?: string | null
  workflow?: string | null
  resources?: string | null
  payload?: Record<string, any>
  assignee_id?: number | null
  is_deleted?: boolean
  deleted_at?: string | null
  updated_at?: string
}

export interface Conversation {
  id: number
  task_id: number
  organization_id: number
  created_by: number | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ConversationInsert {
  task_id: number
  organization_id: number
  created_by?: number | null
  is_deleted?: boolean
}

export interface ConversationUpdate {
  is_deleted?: boolean
  deleted_at?: string | null
  updated_at?: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  sender_id: number | null
  role: string
  content: string
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
}

export interface ChatMessageInsert {
  conversation_id: number
  sender_id?: number | null
  role?: string
  content: string
  is_deleted?: boolean
}

export interface ChatMessageUpdate {
  content?: string
  is_deleted?: boolean
  deleted_at?: string | null
}

// Knowledge Base types
export interface KBArticle {
  id: number
  organization_id: number
  title: string | null
  body: string | null
  created_by: number | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface KBArticleInsert {
  organization_id: number
  title?: string | null
  body?: string | null
  created_by?: number | null
  is_deleted?: boolean
}

export interface KBArticleUpdate {
  title?: string | null
  body?: string | null
  is_deleted?: boolean
  deleted_at?: string | null
  updated_at?: string
}

export interface KBEmbedding {
  id: number
  article_id: number
  chunk_index: number
  content: string | null
  embedding: number[] // Vector type
  created_at: string
}

export interface KBEmbeddingInsert {
  article_id: number
  chunk_index: number
  content?: string | null
  embedding: number[]
}

export interface KBEmbeddingUpdate {
  chunk_index?: number
  content?: string | null
  embedding?: number[]
}

// Memory types
export interface UserMemory {
  id: number
  user_id: number
  memory_text: string | null
  embedding: number[] // Vector type
  created_at: string
}

export interface UserMemoryInsert {
  user_id: number
  memory_text?: string | null
  embedding: number[]
}

export interface UserMemoryUpdate {
  memory_text?: string | null
  embedding?: number[]
}

export interface OrganizationMemory {
  id: number
  organization_id: number
  memory_text: string | null
  embedding: number[] // Vector type
  created_at: string
}

export interface OrganizationMemoryInsert {
  organization_id: number
  memory_text?: string | null
  embedding: number[]
}

export interface OrganizationMemoryUpdate {
  memory_text?: string | null
  embedding?: number[]
}

// Integration types
export interface ExternalRef {
  id: number
  organization_id: number
  entity_type: 'task' | 'kb_article'
  entity_id: number
  platform: string
  external_id: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ExternalRefInsert {
  organization_id: number
  entity_type: 'task' | 'kb_article'
  entity_id: number
  platform: string
  external_id: string
  metadata?: Record<string, any>
}

export interface ExternalRefUpdate {
  entity_type?: 'task' | 'kb_article'
  entity_id?: number
  platform?: string
  external_id?: string
  metadata?: Record<string, any>
  updated_at?: string
}

export interface Event {
  id: number
  organization_id: number | null
  user_id: number | null
  name: string
  properties: Record<string, any>
  created_at: string
}

export interface EventInsert {
  organization_id?: number | null
  user_id?: number | null
  name: string
  properties?: Record<string, any>
}

export interface EventUpdate {
  organization_id?: number | null
  user_id?: number | null
  name?: string
  properties?: Record<string, any>
}

// Comments system
export interface Comment {
  id: number
  organization_id: number
  entity_type: 'task' | 'kb_article'
  entity_id: number
  content: string
  author_id: number | null
  parent_id: number | null
  is_edited: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface CommentInsert {
  organization_id: number
  entity_type: 'task' | 'kb_article'
  entity_id: number
  content: string
  author_id?: number | null
  parent_id?: number | null
  is_edited?: boolean
  is_deleted?: boolean
}

export interface CommentUpdate {
  content?: string
  is_edited?: boolean
  is_deleted?: boolean
  deleted_at?: string | null
  updated_at?: string
}

export interface CommentWithAuthor extends Comment {
  author?: User | null
  replies?: CommentWithAuthor[]
}

// Enum types
export type RoleName = 'system_admin' | 'client_admin' | 'client_team'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled'

export type ChatMessageRole = 'user' | 'assistant'

export type EntityType = 'task' | 'kb_article'

// Composite types for common queries
export interface UserWithMemberships extends User {
  memberships: (Membership & {
    organization: Organization
    user_roles: (UserRole & {
      role: Role
    })[]
  })[]
}

export interface TaskWithDetails extends Task {
  created_by_user?: User | null
  assignee?: User | null
  organization: Organization
  conversation?: Conversation | null
}

export interface ConversationWithMessages extends Conversation {
  task: Task
  chat_messages: (ChatMessage & {
    sender?: User | null
  })[]
}

export interface MembershipWithDetails extends Membership {
  user: User
  organization: Organization
  user_roles: (UserRole & {
    role: Role
  })[]
} 