"use client"

import { memo, useMemo, useEffect, useRef, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { useTheme } from "next-themes"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

// Performance monitoring hook for debugging (optional)
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0)
  renderCount.current++
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`)
    }
  })
  
  return renderCount.current
}

interface RichMessageContentProps {
  content: string
  role: 'user' | 'assistant'
}

// Simple streaming text component for maintaining flow
const StreamingText = memo(({ content }: { content: string }) => (
  <div className="text-foreground whitespace-pre-wrap leading-relaxed font-sans">
    {content}
  </div>
))

StreamingText.displayName = "StreamingText"

// Full markdown component for complete messages
const CompleteMarkdown = memo(({ text }: { text: string }) => {
  const { theme } = useTheme()
  const { copyToClipboard, isCopied } = useCopyToClipboard()

  const renderSpecialMessages = (text: string) => {
    const specialPatterns = [
      { pattern: /🎯\s*\*\*(Action|Quick Action):\*\*\s*(.*?)(?=\n\n|\n$|$)/g, type: 'action', icon: '🎯', color: 'blue' },
      { pattern: /💡\s*\*\*(Tip|Insight):\*\*\s*(.*?)(?=\n\n|\n$|$)/g, type: 'tip', icon: '💡', color: 'yellow' },
      { pattern: /⚠️\s*\*\*(Warning|Important):\*\*\s*(.*?)(?=\n\n|\n$|$)/g, type: 'warning', icon: '⚠️', color: 'orange' },
      { pattern: /✅\s*\*\*(Success|Complete):\*\*\s*(.*?)(?=\n\n|\n$|$)/g, type: 'success', icon: '✅', color: 'green' },
      { pattern: /📝\s*\*\*(Note|Info):\*\*\s*(.*?)(?=\n\n|\n$|$)/g, type: 'note', icon: '📝', color: 'blue' }
    ]

    const parts: React.ReactElement[] = []
    let lastIndex = 0

    specialPatterns.forEach(({ pattern, type, icon, color }) => {
      let match
      pattern.lastIndex = 0 // Reset pattern state

      while ((match = pattern.exec(text)) !== null) {
        // Add content before this match
        if (match.index > lastIndex) {
          const beforeContent = text.slice(lastIndex, match.index).trim()
          if (beforeContent) {
            parts.push(
              <div key={`before-${match.index}`} className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code: ({ children, className, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : ''

                      if (!language) {
                        return (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm" >
                            {children}
                          </code>
                        )
                      }

                      return (
                        <div className="relative group">
                          <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
                            <Badge variant="secondary" className="bg-gray-700 text-gray-100">
                              {language}
                            </Badge>
                            <Button
                              onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-8 w-8 p-0"
                            >
                              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            style={theme === 'dark' ? oneDark : oneLight}
                            language={language}
                            PreTag="div"
                            className="!mt-0 !rounded-t-none"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      )
                    }
                  }}
                >
                  {beforeContent}
                </ReactMarkdown>
              </div>
            )
          }
        }

        // Add the special message
        const messageContent = match[1] || match[0].replace(new RegExp(`^${icon}\\s*\\*\\*\\w+:\\*\\*\\s*`), '')
        
        if (type === 'action') {
          parts.push(
            <Card key={`special-${match.index}`} className={`border-${color}-200 bg-${color}-50 dark:border-${color}-800 dark:bg-${color}-950/20`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{icon}</span>
                  Quick Action
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-foreground">
                  {messageContent}
                </CardDescription>
              </CardContent>
            </Card>
          )
        } else {
          parts.push(
            <Alert key={`special-${match.index}`} className={`border-${color}-200 bg-${color}-50 dark:border-${color}-800 dark:bg-${color}-950/20`}>
              <AlertDescription className="flex items-start gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-foreground">{messageContent}</span>
              </AlertDescription>
            </Alert>
          )
        }

        lastIndex = match.index + match[0].length
      }
    })

    // Add remaining content
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex)
      if (remaining.trim()) {
        parts.push(
          <div key="remaining" className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code: ({ children, className, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''

                  if (!language) {
                    return (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm" >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <div className="relative group">
                      <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
                        <Badge variant="secondary" className="bg-gray-700 text-gray-100">
                          {language}
                        </Badge>
                        <Button
                          onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-8 w-8 p-0"
                        >
                          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        style={theme === 'dark' ? oneDark : oneLight}
                        language={language}
                        PreTag="div"
                        className="!mt-0 !rounded-t-none"
                        
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  )
                }
              }}
            >
              {remaining}
            </ReactMarkdown>
          </div>
        )
      }
    }

    if (parts.length > 1) {
      return <div className="space-y-3">{parts}</div>
    }

    // No special messages found, render normally
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:text-foreground prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2
        prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-1
        prose-h3:text-lg prose-h3:mb-2
        prose-h4:text-base prose-h4:mb-1
        prose-h5:text-sm prose-h5:mb-1  
        prose-h6:text-sm prose-h6:mb-1 prose-h6:text-muted-foreground
        prose-p:text-foreground prose-p:leading-relaxed
        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-em:text-foreground
        prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-transparent prose-pre:p-0
        prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:py-1
        prose-ul:text-foreground prose-ol:text-foreground
        prose-li:text-foreground prose-li:marker:text-muted-foreground
        prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground
        prose-hr:border-border">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: ({ children, className, ...props }) => {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : ''

              if (!language) {
                return (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm" >
                    {children}
                  </code>
                )
              }

              return (
                <div className="relative group">
                  <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
                    <Badge variant="secondary" className="bg-gray-700 text-gray-100">
                      {language}
                    </Badge>
                    <Button
                      onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-8 w-8 p-0"
                    >
                      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    style={theme === 'dark' ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-none"
                    
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              )
            }
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    )
  }

  return <div className="w-full">{renderSpecialMessages(text)}</div>
})

CompleteMarkdown.displayName = "CompleteMarkdown"

export const RichMessageContent = memo(({ content, role }: RichMessageContentProps) => {
  // Detect if content appears to be streaming
  const isStreaming = useMemo(() => {
    if (role === 'user') return false
    
    const trimmed = content.trim()
    
    // Consider very short content as potentially streaming
    if (trimmed.length < 20) return true
    
    // Check for incomplete markdown patterns
    const endsWithIncompleteMarkdown = /[`*_#\-\[]{1,3}$/.test(trimmed)
    if (endsWithIncompleteMarkdown) return true
    
    // Check if it ends mid-sentence (no terminal punctuation and reasonably short)
    const endsWithoutPunctuation = !/[.!?;:]$/.test(trimmed) && trimmed.length < 200
    if (endsWithoutPunctuation) return true
    
    return false
  }, [content, role])

  // Use streaming text for partial content, full markdown for complete content
  if (isStreaming && role === 'assistant') {
    return <StreamingText content={content} />
  }

  return <CompleteMarkdown text={content} />
})

RichMessageContent.displayName = "RichMessageContent" 