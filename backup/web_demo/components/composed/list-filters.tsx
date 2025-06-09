"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ListFiltersProps } from "@/types/composed"

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function ListFilters({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  sortOptions = [],
  sortValue,
  onSortChange,
  className
}: ListFiltersProps) {
  // Local state for immediate input display
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || "")
  
  // Debounce the search value
  const debouncedSearchValue = useDebounce(localSearchValue, 300)

  // Update local state when external searchValue changes
  useEffect(() => {
    setLocalSearchValue(searchValue || "")
  }, [searchValue])

  // Call onSearchChange only when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== searchValue) {
      onSearchChange?.(debouncedSearchValue)
    }
  }, [debouncedSearchValue, searchValue, onSearchChange])

  // Handle input change
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchValue(value)
  }, [])

  return (
    <div className={cn("flex items-center gap-4 flex-wrap", className)}>
      {/* Search input */}
      <div className="relative flex-1 min-w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={localSearchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Custom filters */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filterValues[filter.key] || ""}
          onValueChange={(value) => onFilterChange?.(filter.key, value)}
        >
          <SelectTrigger className="w-40">
            {filter.icon && <span className="mr-2">{filter.icon}</span>}
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Sort options */}
      {sortOptions.length > 0 && onSortChange && (
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
} 