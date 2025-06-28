"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types"
import type { 
  Conversation, 
  ConversationInsert, 
  ConversationUpdate, 
  ConversationWithMessages 
} from "@/types/database"

/**
 * Get all conversations for the authenticated user
 */
export async function getConversationsAction(): Promise<ActionState<Conversation[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return {
      isSuccess: true,
      message: "Conversations retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting conversations:", error)
    return { isSuccess: false, message: "Failed to get conversations" }
  }
}

/**
 * Get a specific conversation with messages
 */
export async function getConversationAction(
  conversationId: string
): Promise<ActionState<ConversationWithMessages>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError) throw convError

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    return {
      isSuccess: true,
      message: "Conversation retrieved successfully",
      data: {
        ...conversation,
        messages: messages || []
      }
    }
  } catch (error) {
    console.error("Error getting conversation:", error)
    return { isSuccess: false, message: "Failed to get conversation" }
  }
}

/**
 * Create a new conversation
 */
export async function createConversationAction(
  data: Pick<ConversationInsert, 'title'>
): Promise<ActionState<Conversation>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    const conversationData: ConversationInsert = {
      ...data,
      user_id: userId,
      archived: false,
      message_count: 0
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Conversation created successfully",
      data: conversation
    }
  } catch (error) {
    console.error("Error creating conversation:", error)
    return { isSuccess: false, message: "Failed to create conversation" }
  }
}

/**
 * Update a conversation
 */
export async function updateConversationAction(
  conversationId: string,
  data: ConversationUpdate
): Promise<ActionState<Conversation>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Conversation updated successfully",
      data: conversation
    }
  } catch (error) {
    console.error("Error updating conversation:", error)
    return { isSuccess: false, message: "Failed to update conversation" }
  }
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversationAction(
  conversationId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    // Delete messages first (due to foreign key constraint)
    const { error: msgError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (msgError) throw msgError

    // Delete conversation
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)

    if (convError) throw convError

    return {
      isSuccess: true,
      message: "Conversation deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return { isSuccess: false, message: "Failed to delete conversation" }
  }
}

/**
 * Archive/unarchive a conversation
 */
export async function archiveConversationAction(
  conversationId: string,
  archived: boolean
): Promise<ActionState<Conversation>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ 
        archived,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully`,
      data: conversation
    }
  } catch (error) {
    console.error("Error archiving conversation:", error)
    return { isSuccess: false, message: "Failed to archive conversation" }
  }
} 