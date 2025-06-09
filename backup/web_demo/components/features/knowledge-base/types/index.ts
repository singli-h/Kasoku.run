// Knowledge Base Types
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  viewCount?: number;
  isBookmarked?: boolean;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  status: IntegrationStatus;
  description: string;
  lastSync?: Date;
  syncFrequency?: string;
  configUrl?: string;
  errorMessage?: string;
  capabilities: string[];
}

export interface ArticleCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  articleCount?: number;
}

// Article related types
export type ArticleStatus = 'draft' | 'under_review' | 'published' | 'archived';

export type ArticleSort = 
  | 'relevance' 
  | 'date_created' 
  | 'date_updated' 
  | 'title_asc' 
  | 'title_desc'
  | 'view_count';

export interface ArticleFilters {
  search?: string;
  category?: string;
  status?: ArticleStatus;
  tags?: string[];
  authorId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
}

export interface ArticleUpdateInput extends Partial<ArticleCreateInput> {
  id: string;
}

// Integration related types
export type IntegrationStatus = 
  | 'available' 
  | 'connected' 
  | 'configure_required' 
  | 'error' 
  | 'disconnected';

export interface IntegrationConfig {
  apiKey?: string;
  webhook?: string;
  settings: Record<string, any>;
}

export interface IntegrationUpdateInput {
  id: string;
  status?: IntegrationStatus;
  config?: IntegrationConfig;
}

// Search and pagination types
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Form types
export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
}

// Component prop types
export interface ArticleListProps {
  articles: Article[];
  loading?: boolean;
  onArticleSelect?: (article: Article) => void;
  onStatusChange?: (articleId: string, status: ArticleStatus) => void;
}

export interface IntegrationCardsProps {
  integrations: Integration[];
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (integrationId: string) => void;
  onConfigure?: (integrationId: string) => void;
}

export interface ArticleDetailProps {
  article: Article;
  relatedArticles?: Article[];
  onEdit?: () => void;
  onDelete?: () => void;
  onBookmark?: (articleId: string) => void;
}

// Status badge types
export interface StatusBadgeProps {
  status: ArticleStatus | IntegrationStatus;
  className?: string;
}

// Analytics types (for future use)
export interface ArticleAnalytics {
  articleId: string;
  views: number;
  uniqueViews: number;
  readTime: number;
  completionRate: number;
  lastViewed: Date;
} 