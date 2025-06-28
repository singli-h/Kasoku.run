"use client"

import { memo, useMemo, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic imports for heavy components
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <Skeleton className="h-20 w-full" />,
  ssr: false
})

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then(mod => mod.Prism),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
    ssr: false
  }
)

// Dynamic import for syntax highlighter styles
const getSyntaxHighlighterStyle = async (isDark: boolean) => {
  if (isDark) {
    const { oneDark } = await import("react-syntax-highlighter/dist/esm/styles/prism")
    return oneDark
  } else {
    const { oneLight } = await import("react-syntax-highlighter/dist/esm/styles/prism")
    return oneLight
  }
}

// Dynamic import for markdown plugins
const getMarkdownPlugins = async () => {
  const [{ default: remarkGfm }, { default: rehypeRaw }] = await Promise.all([
    import("remark-gfm"),
    import("rehype-raw")
  ])
  return { remarkGfm, rehypeRaw }
}

interface RichMessageContentOptimizedProps {
  content: string
  role: 'user' | 'assistant'
}

// Simple text component for user messages (no need for heavy markdown)
const SimpleText = memo(({ content }: { content: string }) => (
  <div className="text-foreground whitespace-pre-wrap leading-relaxed">
    {content}
  </div>
))

SimpleText.displayName = "SimpleText"

// Code block component with dynamic syntax highlighter
const CodeBlock = memo(({ 
  children, 
  language, 
  isDark 
}: { 
  children: string
  language: string
  isDark: boolean 
}) => {
  const [style, setStyle] = useState<any>(null)
  
  useMemo(async () => {
    try {
      const highlighterStyle = await getSyntaxHighlighterStyle(isDark)
      setStyle(highlighterStyle)
    } catch (error) {
      console.warn("Failed to load syntax highlighter style:", error)
    }
  }, [isDark])

  if (!language) {
    return (
      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-xs text-gray-300 font-medium uppercase">
          {language}
        </span>
      </div>
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-t-none" />}>
        {style ? (
          <SyntaxHighlighter
            style={style}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none"
          >
            {children}
          </SyntaxHighlighter>
        ) : (
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-b-lg overflow-x-auto">
            <code className="text-sm font-mono">{children}</code>
          </pre>
        )}
      </Suspense>
    </div>
  )
})

CodeBlock.displayName = "CodeBlock"

// Optimized markdown component
const OptimizedMarkdown = memo(({ 
  content, 
  isDark 
}: { 
  content: string
  isDark: boolean 
}) => {
  const [plugins, setPlugins] = useState<any>(null)
  
  useMemo(async () => {
    try {
      const markdownPlugins = await getMarkdownPlugins()
      setPlugins(markdownPlugins)
    } catch (error) {
      console.warn("Failed to load markdown plugins:", error)
    }
  }, [])

  // Fallback to simple text if content is too simple
  const isSimpleText = !content.includes('```') && 
                      !content.includes('#') && 
                      !content.includes('**') && 
                      !content.includes('*') &&
                      !content.includes('[') &&
                      !content.includes('|')

  if (isSimpleText) {
    return <SimpleText content={content} />
  }

  return (
    <Suspense fallback={<Skeleton className="h-20 w-full" />}>
      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground">
        <ReactMarkdown
          remarkPlugins={plugins ? [plugins.remarkGfm] : []}
          rehypePlugins={plugins ? [plugins.rehypeRaw] : []}
          components={{
            code: ({ children, className, ...props }) => {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : ''
              
              return (
                <CodeBlock
                  language={language}
                  isDark={isDark}
                >
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              )
            },
            // Optimize other components
            pre: ({ children }) => <div>{children}</div>,
            blockquote: ({ children }) => (
              <Card className="border-l-4 border-blue-500 my-4">
                <CardContent className="p-4">
                  {children}
                </CardContent>
              </Card>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Suspense>
  )
})

OptimizedMarkdown.displayName = "OptimizedMarkdown"

export const RichMessageContentOptimized = memo(({ 
  content, 
  role 
}: RichMessageContentOptimizedProps) => {
  const [isDark, setIsDark] = useState(false)
  
  // Simple theme detection without next-themes dependency
  useMemo(() => {
    if (typeof window !== 'undefined') {
      const checkTheme = () => {
        const theme = document.documentElement.classList.contains('dark')
        setIsDark(theme)
      }
      
      checkTheme()
      
      // Watch for theme changes
      const observer = new MutationObserver(checkTheme)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })
      
      return () => observer.disconnect()
    }
  }, [])

  // For user messages, use simple text (no need for markdown)
  if (role === 'user') {
    return <SimpleText content={content} />
  }

  // For assistant messages, use optimized markdown
  return (
    <OptimizedMarkdown 
      content={content} 
      isDark={isDark}
    />
  )
})

RichMessageContentOptimized.displayName = "RichMessageContentOptimized" 