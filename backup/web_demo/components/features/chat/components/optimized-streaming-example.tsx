/**
 * Optimized Streaming Markdown Component
 * 
 * Implements Vercel AI SDK best practices for streaming markdown with code blocks:
 * 1. experimental_throttle for controlling update frequency
 * 2. Block-based memoization to prevent unnecessary re-renders
 * 3. Stable component structure for consistent performance
 * 
 * Based on Vercel's "Markdown Chatbot with Memoization" cookbook:
 * https://sdk.vercel.ai/examples/chatbot/markdown-with-memoization
 */

"use client"

import { memo, useMemo, useCallback, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

// Block types for memoization
interface MarkdownBlock {
  id: string
  content: string
  type: 'text' | 'code' | 'incomplete'
  hash: string // For change detection
}

// Performance monitoring (development only)
const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())
  
  renderCount.current++
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now()
      console.log(`[${componentName}] Render #${renderCount.current} took ${endTime - startTime.current}ms`)
      startTime.current = endTime
    }
  })
}

// Optimized block parser with caching
const parseContentIntoBlocks = (content: string): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = []
  let blockIndex = 0

  // Handle complete code blocks first
  const codeBlockRegex = /```[\s\S]*?```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index)
      if (textContent.trim()) {
        blocks.push({
          id: `text-${blockIndex++}`,
          content: textContent,
          type: 'text',
          hash: btoa(textContent) // Simple hash for change detection
        })
      }
    }

    // Add code block
    blocks.push({
      id: `code-${blockIndex++}`,
      content: match[0],
      type: 'code',
      hash: btoa(match[0])
    })

    lastIndex = codeBlockRegex.lastIndex
  }

  // Handle remaining content
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex)
    
    // Check for incomplete code block
    const incompleteMatch = remaining.match(/```[\s\S]*$/)
    if (incompleteMatch) {
      const beforeIncomplete = remaining.slice(0, incompleteMatch.index!)
      
      if (beforeIncomplete.trim()) {
        blocks.push({
          id: `text-${blockIndex++}`,
          content: beforeIncomplete,
          type: 'text',
          hash: btoa(beforeIncomplete)
        })
      }
      
      // Add incomplete code block with temporary closing
      const incompleteContent = incompleteMatch[0] + '\n```'
      blocks.push({
        id: `incomplete-${blockIndex++}`,
        content: incompleteContent,
        type: 'incomplete',
        hash: btoa(incompleteContent)
      })
    } else if (remaining.trim()) {
      blocks.push({
        id: `text-${blockIndex++}`,
        content: remaining,
        type: 'text',
        hash: btoa(remaining)
      })
    }
  }

  return blocks
}

// Memoized individual block component
const MarkdownBlock = memo(({ 
  block, 
  components 
}: { 
  block: MarkdownBlock
  components: any 
}) => {
  usePerformanceMonitor(`MarkdownBlock-${block.type}`)
  
  return (
    <div data-block-id={block.id} data-block-type={block.type}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {block.content}
      </ReactMarkdown>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if the block hash changed
  return prevProps.block.hash === nextProps.block.hash
})

MarkdownBlock.displayName = "MarkdownBlock"

// Optimized streaming markdown component
export const OptimizedStreamingMarkdown = memo(({ 
  content, 
  isStreaming 
}: { 
  content: string
  isStreaming: boolean 
}) => {
  const { theme } = useTheme()
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  
  usePerformanceMonitor('OptimizedStreamingMarkdown')

  // Parse content into memoizable blocks
  const blocks = useMemo(() => {
    return parseContentIntoBlocks(content)
  }, [content])

  // Stable markdown components configuration
  const markdownComponents = useMemo(() => ({
    code: ({ children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      if (!language) {
        return (
          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        )
      }

      return (
        <div className="not-prose relative group my-4">
          <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
            <Badge variant="secondary" className="bg-gray-700 text-gray-100 font-mono text-xs">
              {language}
            </Badge>
            <Button
              onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-6 w-6 p-0"
            >
              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="bg-gray-950 rounded-b-lg overflow-hidden">
            <SyntaxHighlighter
              style={theme === 'dark' ? oneDark : oneLight}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1rem',
                borderRadius: '0 0 0.5rem 0.5rem',
                background: 'transparent',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        </div>
      )
    },
    
    // Stable component definitions
    p: ({ children }: any) => (
      <p className="mb-4 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-300">
        {children}
      </p>
    ),
    
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {children}
      </h1>
    ),
    
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">
        {children}
      </h2>
    ),
    
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold mt-4 mb-2">
        {children}
      </h3>
    ),
    
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-950/20 text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    ),
    
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    
    em: ({ children }: any) => (
      <em className="italic text-gray-700 dark:text-gray-300">
        {children}
      </em>
    )
  }), [theme, copyToClipboard, isCopied])

  // Render memoized blocks
  return (
    <div className="prose prose-sm max-w-none">
      {blocks.map(block => (
        <MarkdownBlock 
          key={block.id}
          block={block}
          components={markdownComponents}
        />
      ))}
      
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="inline-flex items-center ml-1 mt-2">
          <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm" />
        </div>
      )}
    </div>
  )
})

OptimizedStreamingMarkdown.displayName = "OptimizedStreamingMarkdown"

// Example usage with useChat hook
export const OptimizedChatExample = () => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    // Key optimization: Throttle updates to every 50ms (Vercel recommendation)
    experimental_throttle: 50
  })

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          const isStreaming = isLastMessage && isLoading && message.role === 'assistant'
          
          return (
            <div key={message.id} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
                  <OptimizedStreamingMarkdown 
                    content={message.content}
                    isStreaming={isStreaming}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
} 