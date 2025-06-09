import { Integration, ArticleCategory, ArticleStatus, IntegrationStatus } from '../types';

// Default integrations available in the system
export const DEFAULT_INTEGRATIONS: Omit<Integration, 'id'>[] = [
  {
    name: 'Pipedrive',
    icon: '🔗',
    status: 'available',
    description: 'CRM integration for customer data synchronization',
    capabilities: ['contacts', 'deals', 'activities', 'notes'],
    configUrl: '/knowledge-base/integrations/pipedrive'
  },
  {
    name: 'Notion',
    icon: '📝',
    status: 'available', 
    description: 'Document workspace integration for knowledge sharing',
    capabilities: ['pages', 'databases', 'blocks', 'comments'],
    configUrl: '/knowledge-base/integrations/notion'
  },
  {
    name: 'Slack',
    icon: '💬',
    status: 'available',
    description: 'Team communication and notification integration',
    capabilities: ['channels', 'messages', 'users', 'files'],
    configUrl: '/knowledge-base/integrations/slack'
  },
  {
    name: 'Google Drive',
    icon: '📁',
    status: 'available',
    description: 'Cloud storage integration for file management',
    capabilities: ['files', 'folders', 'sharing', 'comments'],
    configUrl: '/knowledge-base/integrations/google-drive'
  },
  {
    name: 'Asana',
    icon: '✅',
    status: 'available',
    description: 'Project management integration for task tracking',
    capabilities: ['projects', 'tasks', 'teams', 'portfolios'],
    configUrl: '/knowledge-base/integrations/asana'
  },
  {
    name: 'HubSpot',
    icon: '🎯',
    status: 'available',
    description: 'Marketing and sales platform integration',
    capabilities: ['contacts', 'companies', 'deals', 'tickets'],
    configUrl: '/knowledge-base/integrations/hubspot'
  }
];

// Default article categories
export const DEFAULT_CATEGORIES: ArticleCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Basic setup and onboarding guides',
    color: '#3B82F6'
  },
  {
    id: 'tutorials',
    name: 'Tutorials',
    description: 'Step-by-step implementation guides',
    color: '#10B981'
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Technical API documentation',
    color: '#8B5CF6'
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    color: '#F59E0B'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Third-party integration guides',
    color: '#EF4444'
  },
  {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Recommended approaches and methodologies',
    color: '#06B6D4'
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions',
    color: '#84CC16'
  }
];

// Article status configurations
export const ARTICLE_STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    variant: 'secondary' as const,
    color: 'bg-gray-400 dark:bg-gray-600',
    icon: '📝'
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    variant: 'default' as const,
    color: 'bg-yellow-500',
    icon: '👀'
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    variant: 'outline' as const,
    color: 'bg-green-500',
    icon: '✅'
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    variant: 'secondary' as const,
    color: 'bg-gray-400 dark:bg-gray-600',
    icon: '📦'
  }
} as const;

// Integration status configurations
export const INTEGRATION_STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: 'bg-blue-100 text-blue-800',
    icon: '🔌'
  },
  connected: {
    label: 'Connected',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  configure_required: {
    label: 'Configure Required',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚙️'
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  disconnected: {
    label: 'Disconnected',
    color: 'bg-gray-100 text-gray-600',
    icon: '🔌'
  }
} as const;

// Search and pagination defaults
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  MIN_PAGE_SIZE: 6
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_RECENT_SEARCHES: 5
} as const;

// Sort options for articles
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date_created', label: 'Date Created' },
  { value: 'date_updated', label: 'Date Updated' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
  { value: 'view_count', label: 'Most Viewed' }
] as const;

// Filter options
export const FILTER_OPTIONS = {
  status: [
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'archived', label: 'Archived' }
  ],
  timeRange: [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]
} as const;

// Routes
export const KNOWLEDGE_BASE_ROUTES = {
  BASE: '/knowledge-base',
  ARTICLE: (id: string) => `/knowledge-base/articles/${id}`,
  ARTICLE_CREATE: '/knowledge-base/articles/create',
  ARTICLE_EDIT: (id: string) => `/knowledge-base/articles/${id}/edit`,
  INTEGRATIONS: '/knowledge-base/integrations',
  INTEGRATION_CONFIG: (integrationId: string) => `/knowledge-base/integrations/${integrationId}`
} as const;

// Feature flags (for progressive rollout)
export const FEATURE_FLAGS = {
  ENABLE_ARTICLE_ANALYTICS: true,
  ENABLE_REAL_TIME_COLLABORATION: false,
  ENABLE_ARTICLE_VERSIONING: false,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_BULK_OPERATIONS: true
} as const;

// Validation rules
export const VALIDATION_RULES = {
  ARTICLE_TITLE_MIN_LENGTH: 5,
  ARTICLE_TITLE_MAX_LENGTH: 200,
  ARTICLE_EXCERPT_MAX_LENGTH: 500,
  ARTICLE_CONTENT_MIN_LENGTH: 50,
  MAX_TAGS_PER_ARTICLE: 10,
  TAG_MAX_LENGTH: 30
} as const;

// Default content templates
export const ARTICLE_TEMPLATES = {
  TUTORIAL: `# Tutorial Title

## Overview
Brief description of what this tutorial covers.

## Prerequisites
- Requirement 1
- Requirement 2

## Steps

### Step 1: Setup
Instructions for the first step.

### Step 2: Implementation
Instructions for implementation.

### Step 3: Testing
How to verify the implementation.

## Conclusion
Summary and next steps.`,

  API_REFERENCE: `# API Endpoint Name

## Description
Brief description of the API endpoint.

## Endpoint
\`\`\`
GET /api/endpoint
\`\`\`

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1    | string | Yes | Description |

## Response
\`\`\`json
{
  "example": "response"
}
\`\`\`

## Examples
Example usage and responses.`,

  TROUBLESHOOTING: `# Issue Title

## Problem Description
Describe the issue users might encounter.

## Symptoms
- Symptom 1
- Symptom 2

## Causes
Common causes of this issue.

## Solutions

### Solution 1
Step-by-step solution.

### Solution 2 (Alternative)
Alternative solution if the first doesn't work.

## Prevention
How to avoid this issue in the future.`
} as const; 