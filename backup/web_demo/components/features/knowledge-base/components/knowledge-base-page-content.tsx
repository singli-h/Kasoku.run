"use client"

import { useState } from "react"
import { Plus, BookOpen, Clock, Eye, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListContainer } from "@/components/composed/list-container"
import { ListItem } from "@/components/composed/list-item"
import { IntegrationCards } from "./integration-cards"
import { 
  DEFAULT_CATEGORIES, 
  ARTICLE_STATUS_CONFIG,
  DEFAULT_INTEGRATIONS 
} from "../constants"
import type { User } from "@/types"
import type { Article, ArticleFilters } from "../types"
import type { ListItem as BaseListItem, FilterConfig } from "@/types/composed"

interface KnowledgeBasePageContentProps {
  user: User
}

// Article adapted for ListItem (both have string id, so this should work)
interface ArticleListItem extends Article {}

// Mock articles data for development
const mockArticles: ArticleListItem[] = [
  {
    id: "1",
    title: "Getting Started with AI Agents",
    content: "Complete guide to setting up and using AI agents in your workflow...",
    excerpt: "Learn how to configure AI agents for maximum productivity",
    status: "published",
    category: "getting-started",
    tags: ["ai", "agents", "setup"],
    authorId: "user-1",
    authorName: "John Doe",
    viewCount: 142,
    isBookmarked: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: new Date("2024-01-15")
  },
  {
    id: "2", 
    title: "Advanced Workflow Automation",
    content: "Deep dive into creating complex automation workflows...",
    excerpt: "Master advanced automation techniques and best practices",
    status: "published",
    category: "tutorials",
    tags: ["automation", "workflows", "advanced"],
    authorId: "user-2",
    authorName: "Jane Smith",
    viewCount: 89,
    isBookmarked: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
    publishedAt: new Date("2024-01-12")
  },
  {
    id: "3",
    title: "Integration Best Practices",
    content: "How to effectively integrate third-party services...",
    excerpt: "Connect your favorite tools with our platform seamlessly",
    status: "published", 
    category: "integrations",
    tags: ["integrations", "api", "best-practices"],
    authorId: "user-1",
    authorName: "John Doe",
    viewCount: 67,
    isBookmarked: false,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    publishedAt: new Date("2024-01-08")
  }
]

export function KnowledgeBasePageContent({ user }: KnowledgeBasePageContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Filter articles based on search and filters
  const filteredArticles = mockArticles.filter(article => {
    // Search filter
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Category filter
    if (filters.category && article.category !== filters.category) {
      return false
    }

    // Status filter  
    if (filters.status && article.status !== filters.status) {
      return false
    }

    return true
  })

  // Filter configurations for ListContainer
  const filterConfigs: FilterConfig[] = [
    {
      key: "category",
      label: "Categories",
      type: "select",
      options: DEFAULT_CATEGORIES.map(cat => ({
        value: cat.id,
        label: cat.name
      }))
    },
    {
      key: "status", 
      label: "Status",
      type: "select",
      options: Object.entries(ARTICLE_STATUS_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label
      }))
    }
  ]

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "date_created", label: "Date Created" },
    { value: "date_updated", label: "Date Updated" },
    { value: "title", label: "Title" },
    { value: "view_count", label: "Most Viewed" }
  ]

  const renderArticleItem = (article: ArticleListItem) => {
    const category = DEFAULT_CATEGORIES.find(cat => cat.id === article.category)
    const statusConfig = ARTICLE_STATUS_CONFIG[article.status]

    return (
      <ListItem
        key={article.id}
        href={`/knowledge-base/articles/${article.id}`}
      >
        <div className="flex items-start justify-between p-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold hover:text-primary transition-colors">
                {article.title}
              </h3>
              {category && (
                <Badge variant="secondary">
                  {category.name}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.ceil(article.content.length / 1000) || 5} min read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.viewCount || 0} views
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                {article.authorName || "Unknown"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={statusConfig.label === 'Published' ? 'default' : 'secondary'}
            >
              {statusConfig.label}
            </Badge>
            {article.isBookmarked && (
              <Badge variant="outline">Bookmarked</Badge>
            )}
          </div>
        </div>
      </ListItem>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Discover guides, tutorials, and integrations to enhance your workflow
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Knowledge Base Articles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ListContainer
            items={filteredArticles}
            title="Articles"
            description={`${filteredArticles.length} articles available`}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search articles..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
            sortOptions={sortOptions}
            renderItem={renderArticleItem}
            emptyState={{
              title: "No articles found",
              description: "No articles match your current filters. Try adjusting your search criteria.",
              actionLabel: "Clear Filters",
              onAction: () => {
                setSearchQuery("")
                setFilters({})
              }
            }}
            headerActions={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Article
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationCards integrations={DEFAULT_INTEGRATIONS.map((integration, index) => ({
            ...integration,
            id: `integration-${index + 1}`
          }))} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 