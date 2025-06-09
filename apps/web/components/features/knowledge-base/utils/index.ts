import { 
  Article, 
  ArticleStatus, 
  IntegrationStatus, 
  ArticleFilters,
  ArticleSort 
} from '../types';
import { 
  ARTICLE_STATUS_CONFIG, 
  INTEGRATION_STATUS_CONFIG,
  DEFAULT_CATEGORIES,
  VALIDATION_RULES 
} from '../constants';

// Status utility functions
export function getArticleStatusConfig(status: ArticleStatus) {
  return ARTICLE_STATUS_CONFIG[status];
}

export function getIntegrationStatusConfig(status: IntegrationStatus) {
  return INTEGRATION_STATUS_CONFIG[status];
}

export function getStatusBadgeClasses(status: ArticleStatus | IntegrationStatus) {
  const config = status in ARTICLE_STATUS_CONFIG 
    ? ARTICLE_STATUS_CONFIG[status as ArticleStatus]
    : INTEGRATION_STATUS_CONFIG[status as IntegrationStatus];
  
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`;
}

// Article utility functions
export function generateArticleExcerpt(content: string, maxLength = 200): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/```[\s\S]*?```/g, '[code block]') // Code blocks
    .replace(/`(.*?)`/g, '$1') // Inline code
    .replace(/\n+/g, ' ') // Line breaks
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last space before the max length to avoid cutting words
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Updated just now';
  } else if (diffInHours < 24) {
    return `Updated ${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 48) {
    return 'Updated yesterday';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `Updated ${diffInDays} days ago`;
  }
}

// Search and filtering utilities
export function filterArticles(articles: Article[], filters: ArticleFilters): Article[] {
  return articles.filter(article => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = article.title.toLowerCase().includes(searchLower);
      const matchesContent = article.content.toLowerCase().includes(searchLower);
      const matchesTags = article.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      );
      
      if (!matchesTitle && !matchesContent && !matchesTags) {
        return false;
      }
    }

    // Category filter
    if (filters.category && article.category !== filters.category) {
      return false;
    }

    // Status filter
    if (filters.status && article.status !== filters.status) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        article.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Author filter
    if (filters.authorId && article.authorId !== filters.authorId) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const articleDate = new Date(article.createdAt);
      const { from, to } = filters.dateRange;
      
      if (articleDate < from || articleDate > to) {
        return false;
      }
    }

    return true;
  });
}

export function sortArticles(articles: Article[], sortBy: ArticleSort): Article[] {
  const sortedArticles = [...articles];

  switch (sortBy) {
    case 'date_created':
      return sortedArticles.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    case 'date_updated':
      return sortedArticles.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    
    case 'title_asc':
      return sortedArticles.sort((a, b) => 
        a.title.localeCompare(b.title)
      );
    
    case 'title_desc':
      return sortedArticles.sort((a, b) => 
        b.title.localeCompare(a.title)
      );
    
    case 'view_count':
      return sortedArticles.sort((a, b) => 
        (b.viewCount || 0) - (a.viewCount || 0)
      );
    
    case 'relevance':
    default:
      // For relevance, we'd typically use search scoring
      // For now, return by update date as a fallback
      return sortedArticles.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}

// Validation utilities
export function validateArticleTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  
  if (title.trim().length < VALIDATION_RULES.ARTICLE_TITLE_MIN_LENGTH) {
    return `Title must be at least ${VALIDATION_RULES.ARTICLE_TITLE_MIN_LENGTH} characters`;
  }
  
  if (title.length > VALIDATION_RULES.ARTICLE_TITLE_MAX_LENGTH) {
    return `Title must be less than ${VALIDATION_RULES.ARTICLE_TITLE_MAX_LENGTH} characters`;
  }
  
  return null;
}

export function validateArticleContent(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return 'Content is required';
  }
  
  if (content.trim().length < VALIDATION_RULES.ARTICLE_CONTENT_MIN_LENGTH) {
    return `Content must be at least ${VALIDATION_RULES.ARTICLE_CONTENT_MIN_LENGTH} characters`;
  }
  
  return null;
}

export function validateArticleTags(tags: string[]): string | null {
  if (tags.length > VALIDATION_RULES.MAX_TAGS_PER_ARTICLE) {
    return `Maximum ${VALIDATION_RULES.MAX_TAGS_PER_ARTICLE} tags allowed`;
  }
  
  for (const tag of tags) {
    if (tag.length > VALIDATION_RULES.TAG_MAX_LENGTH) {
      return `Tag "${tag}" is too long (max ${VALIDATION_RULES.TAG_MAX_LENGTH} characters)`;
    }
  }
  
  return null;
}

// Category utilities
export function getCategoryById(categoryId: string) {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getCategoryColor(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.color || '#6B7280';
}

export function getCategoryName(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.name || categoryId;
}

// URL and slug utilities
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length > 0;
}

// Date utilities specifically for knowledge base
export function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else {
    return formatArticleDate(date);
  }
}

// Search highlighting utility
export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Content utilities
export function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateSlug(text);
    
    headings.push({ level, text, id });
  }

  return headings;
}

// Analytics utilities (for future use)
export function calculateEngagementScore(article: Article): number {
  const viewCount = article.viewCount || 0;
  const daysSincePublished = article.publishedAt 
    ? (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  
  // Simple engagement calculation
  // More sophisticated algorithms would consider bounce rate, time spent, etc.
  return daysSincePublished > 0 ? viewCount / daysSincePublished : viewCount;
} 