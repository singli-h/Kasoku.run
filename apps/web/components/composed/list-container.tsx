"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ListHeader } from "./list-header"
import { ListFilters } from "./list-filters"
import { ListEmptyState } from "./list-empty-state"
import { ListSkeleton } from "./list-skeleton"
import type { ListContainerProps, ListItem } from "@/types/composed"

export function ListContainer<T extends ListItem>({
  items,
  loading = false,
  error,
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  sortOptions,
  sortValue,
  onSortChange,
  renderItem,
  emptyState,
  headerActions,
  skeletonCount = 6,
  className
}: ListContainerProps<T>) {
  // Error state
  if (error) {
    return (
      <div className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}>
        <ListHeader
          title={title}
          description={description}
          actions={headerActions}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-destructive">Error: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <ListSkeleton 
        count={skeletonCount}
        showFilters={true}
        className={className}
      />
    )
  }

  return (
    <div className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}>
      {/* Header */}
      <ListHeader
        title={title}
        description={description}
        actions={headerActions}
      />

      {/* Filters */}
      <ListFilters
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={onSortChange}
      />

      {/* Content */}
      {items.length === 0 ? (
        <ListEmptyState
          icon={emptyState?.icon}
          title={emptyState?.title || "No items found"}
          description={emptyState?.description || "Create your first item to get started or adjust your filters"}
          actionLabel={emptyState?.actionLabel}
          actionHref={emptyState?.actionHref}
          onAction={emptyState?.onAction}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => renderItem(item))}
        </div>
      )}
    </div>
  )
} 