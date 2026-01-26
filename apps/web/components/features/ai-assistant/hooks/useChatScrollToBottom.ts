import { useEffect, useRef } from 'react'
import type { UIMessage } from '@ai-sdk/react'

/**
 * Auto-scroll to bottom when messages change
 *
 * @param messages - Array of chat messages
 * @returns Ref to attach to the scroll target element
 */
export function useChatScrollToBottom(messages: UIMessage[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return messagesEndRef
}
