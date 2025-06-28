"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types"
import type { 
  ChatMessage, 
  ChatMessageInsert, 
  ConversationUpdate 
} from "@/types/database"

/**
 * Save a chat message and update conversation metadata
 */
export async function saveMessageAction(
  conversationId: string,
  message: {
    role: 'user' | 'assistant' | 'system'
    content: any
    metadata?: any
  }
): Promise<ActionState<ChatMessage>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, message_count')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError) throw convError

    // Insert message
    const messageData: ChatMessageInsert = {
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      metadata: message.metadata || null
    }

    const { data: chatMessage, error: msgError } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single()

    if (msgError) throw msgError

    // Update conversation metadata
    const updateData: ConversationUpdate = {
      message_count: (conversation.message_count || 0) + 1,
      updated_at: new Date().toISOString()
    }

    // If it's a user or assistant message, update last_message
    if (message.role === 'user' || message.role === 'assistant') {
      updateData.last_message = typeof message.content === 'string' 
        ? message.content.substring(0, 200) // Truncate for preview
        : JSON.stringify(message.content).substring(0, 200)
      updateData.last_message_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .eq('user_id', userId)

    if (updateError) throw updateError

    return {
      isSuccess: true,
      message: "Message saved successfully",
      data: chatMessage
    }
  } catch (error) {
    console.error("Error saving message:", error)
    return { isSuccess: false, message: "Failed to save message" }
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessagesAction(
  conversationId: string
): Promise<ActionState<ChatMessage[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    // Verify conversation belongs to user
    const { error: convError } = await supabase
      .from('conversations')
      .select('id')
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
      message: "Messages retrieved successfully",
      data: messages || []
    }
  } catch (error) {
    console.error("Error getting messages:", error)
    return { isSuccess: false, message: "Failed to get messages" }
  }
}

/**
 * Delete a specific message
 */
export async function deleteMessageAction(
  messageId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Using singleton supabase client
    
    // Get message and verify ownership through conversation
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select(`
        id,
        conversation_id,
        conversations!inner(user_id)
      `)
      .eq('id', messageId)
      .single()

    if (msgError) throw msgError

    // Type assertion for the joined data
    const messageWithConv = message as any
    if (messageWithConv.conversations.user_id !== userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Delete message
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) throw deleteError

    // Get current message count and decrement
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('message_count')
      .eq('id', messageWithConv.conversation_id)
      .single()

    if (convError) throw convError

    // Update conversation message count
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ 
        message_count: Math.max(0, (conversation.message_count || 1) - 1),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageWithConv.conversation_id)

    if (updateError) throw updateError

    return {
      isSuccess: true,
      message: "Message deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting message:", error)
    return { isSuccess: false, message: "Failed to delete message" }
  }
} 