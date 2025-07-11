"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichMessageContentOptimizedProps {
  content: string
  role: 'user' | 'assistant'
  className?: string
}

export function RichMessageContentOptimized({ 
  content, 
  role, 
  className 
}: RichMessageContentOptimizedProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    // Convert **bold** to <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert `code` to <code>
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    
    // Convert URLs to links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
    )
    
    return formatted
  }

  // Check if content contains code blocks
  const hasCodeBlocks = content.includes('```')
  
  // Extract code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const codeBlocks: Array<{ language: string; code: string }> = []
  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  const contentWithoutCodeBlocks = content.replace(codeBlockRegex, '[[CODE_BLOCK]]')

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main content */}
      <div className="prose prose-sm max-w-none">
        {contentWithoutCodeBlocks.split('[[CODE_BLOCK]]').map((part, index) => (
          <div key={index}>
            {part && (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(part) 
                }}
                className="whitespace-pre-wrap"
              />
            )}
            
            {/* Insert code block if it exists */}
            {codeBlocks[index] && (
              <Card className="mt-3 mb-3 border-muted">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
                    <Badge variant="secondary" className="text-xs">
                      {codeBlocks[index].language}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-3 text-sm overflow-x-auto bg-muted/20">
                    <code>{codeBlocks[index].code}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Copy button for assistant messages */}
      {role === 'assistant' && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 