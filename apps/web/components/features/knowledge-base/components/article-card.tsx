"use client"

import { useRouter } from "next/navigation"
import { Calendar, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Article {
  id: number
  title: string
  content: unknown // JSONB content from TipTap
  category_id?: number | null
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
  color: string
}

interface ArticleCardProps {
  article: Article
  category?: Category
  viewMode: "grid" | "list"
  onClick?: () => void
}

export function ArticleCard({ article, category, viewMode, onClick }: ArticleCardProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Extract text content from TipTap JSON
  const extractTextContent = (content: unknown): string => {
    if (typeof content === 'string') return content
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const contentObj = content as { content: unknown[] }
      return contentObj.content
        .map((node: unknown) => {
          if (typeof node === 'object' && node !== null) {
            const nodeObj = node as Record<string, unknown>
            if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
              return nodeObj.text
            }
            if ('content' in nodeObj) {
              return extractTextContent(nodeObj)
            }
          }
          return ''
        })
        .join(' ')
        .trim()
    }
    return ''
  }

  const truncateContent = (content: unknown, maxLength: number = 150) => {
    const textContent = extractTextContent(content)
    if (textContent.length <= maxLength) return textContent
    return textContent.substring(0, maxLength) + "..."
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/knowledge-base/${article.id}`)
    }
  }

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                {category && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.name}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                {truncateContent(article.content, 200)}
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                Updated {formatDate(article.updated_at)}
              </div>
            </div>
            <div className="ml-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {article.title}
          </CardTitle>
          {category && (
            <Badge 
              variant="secondary" 
              className="text-xs ml-2 flex-shrink-0"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {truncateContent(article.content)}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(article.updated_at)}
          </div>
          <FileText className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}
