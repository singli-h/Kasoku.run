/**
 * Workout History Page Component
 * Displays paginated list of completed training sessions with filtering options
 */

"use client"

import { useState, useEffect } from "react"
import { useSessionsHistory } from '../../hooks/use-workout-queries'
import { Calendar, Clock, Target, TrendingUp, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getPastSessionsAction } from "@/actions/workout/workout-session-actions"
import { WorkoutSessionCard } from '@/components/composed'
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { WorkoutLoadingCard } from '../error-loading'
import { SessionDetailsDialog } from './SessionDetailsDialog'
import type { WorkoutLogWithDetails } from "@/types/training"

interface WorkoutHistoryPageProps {
  className?: string
}

interface SessionFilters {
  startDate: string
  endDate: string
  limit: number
}

export function WorkoutHistoryPage({ className }: WorkoutHistoryPageProps) {
  const [page, setPage] = useState(1)
  const [selectedSession, setSelectedSession] = useState<WorkoutLogWithDetails | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState<SessionFilters>({
    startDate: "",
    endDate: "",
    limit: 10
  })

  // Fetch past sessions with optimized query
  const { data, isLoading, error, refetchHistory } = useSessionsHistory({
    page,
    filters,
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [filters])

  const handleFilterChange = (key: keyof SessionFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }


  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Target className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Failed to load workout history</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetchHistory()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <FeatureErrorBoundary featureName="Workout History" customMessage="Something went wrong while loading your workout history. Please try again.">
      <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Sessions per page</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 sessions</SelectItem>
                  <SelectItem value="10">10 sessions</SelectItem>
                  <SelectItem value="20">20 sessions</SelectItem>
                  <SelectItem value="50">50 sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ startDate: "", endDate: "", limit: 10 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: filters.limit }).map((_, i) => (
              <WorkoutLoadingCard 
                key={i} 
                title="Loading session..."
                description="Please wait while we fetch your workout history"
              />
            ))}
          </div>
        ) : (data as any)?.sessions?.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No completed sessions found</h3>
            <p className="text-muted-foreground">
              {filters.startDate || filters.endDate 
                ? "Try adjusting your date filters to see more sessions."
                : "Complete some workouts to see your history here."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Sessions Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(data as any)?.sessions?.map((session: any) => (
                <WorkoutSessionCard
                  key={(session as any).id}
                  session={session}
                  onAction={(session) => {
                    setSelectedSession(session as WorkoutLogWithDetails)
                    setDetailsOpen(true)
                  }}
                  actionLabel="View Details"
                  actionIcon={<Eye className="h-4 w-4" />}
                  showDetails={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {data && (data as any).totalCount > filters.limit && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * filters.limit) + 1} to {Math.min(page * filters.limit, (data as any).totalCount)} of {(data as any).totalCount} sessions
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil((data as any).totalCount / filters.limit) }, (_, i) => i + 1)
                      .filter(pageNum => 
                        pageNum === 1 || 
                        pageNum === Math.ceil((data as any).totalCount / filters.limit) ||
                        Math.abs(pageNum - page) <= 2
                      )
                      .map((pageNum, index, array) => (
                        <div key={pageNum} className="flex items-center">
                          {index > 0 && array[index - 1] !== pageNum - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!(data as any).hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Details Dialog */}
      <SessionDetailsDialog
        session={selectedSession}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      </div>
    </FeatureErrorBoundary>
  )
}
