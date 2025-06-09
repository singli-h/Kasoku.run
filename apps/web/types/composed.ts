import { ReactNode } from "react"

// Base interface for all list items
export interface ListItem {
  id: string | number
  [key: string]: any
}

// Configuration for different filter types
export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multi-select' | 'date-range'
  options?: { value: string; label: string }[]
  placeholder?: string
  icon?: ReactNode
}

// Configuration for empty state display
export interface EmptyStateConfig {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

// Configuration for status/badge display
export interface StatusConfig {
  label: string
  className: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color?: string
}

// Generic list container props
export interface ListContainerProps<T extends ListItem> {
  items: T[]
  loading?: boolean
  error?: string | null
  title: string
  description?: string
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  sortOptions?: { value: string; label: string }[]
  sortValue?: string
  onSortChange?: (value: string) => void
  renderItem: (item: T) => ReactNode
  emptyState?: EmptyStateConfig
  headerActions?: ReactNode
  skeletonCount?: number
  className?: string
}

// Props for individual list items
export interface ListItemProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  variant?: 'default' | 'compact'
  showActions?: boolean
  actions?: ReactNode
}

// Props for list header component
export interface ListHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
  className?: string
}

// Props for list filters component
export interface ListFiltersProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  sortOptions?: { value: string; label: string }[]
  sortValue?: string
  onSortChange?: (value: string) => void
  className?: string
}

// Props for empty state component
export interface EmptyStateProps extends EmptyStateConfig {
  className?: string
}

// Props for skeleton loader
export interface ListSkeletonProps {
  count?: number
  variant?: 'default' | 'compact'
  showFilters?: boolean
  className?: string
}

// Common patterns for status and priority configs
export type StatusConfigMap = Record<string, StatusConfig>

export type PriorityConfigMap = Record<string, StatusConfig>

// Utility type for common list operations
export interface ListOperations<T extends ListItem> {
  onItemClick?: (item: T) => void
  onItemEdit?: (item: T) => void
  onItemDelete?: (item: T) => void
  onItemUpdate?: (item: T, updates: Partial<T>) => void
} 