import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ComparativePerformanceAnalytics,
  SprintAnalyticsDashboard,
  GymAnalyticsDashboard,
  RaceResultsDashboard,
} from "@/components/features/performance"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { Timer, Dumbbell, Users, Trophy } from "lucide-react"

export default async function PerformancePage() {
  return (
    <PageLayout
      title="Performance Analytics"
      description="Track your progress with detailed sprint and gym analytics"
    >
      <Tabs defaultValue="sprint" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="sprint" className="gap-1.5 text-xs sm:text-sm">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Sprint</span>
          </TabsTrigger>
          <TabsTrigger value="gym" className="gap-1.5 text-xs sm:text-sm">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Gym</span>
          </TabsTrigger>
          <TabsTrigger value="race" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Races</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sprint">
          <Suspense fallback={<SprintAnalyticsSkeleton />}>
            <SprintAnalyticsFetcher />
          </Suspense>
        </TabsContent>

        <TabsContent value="gym">
          <Suspense fallback={<UnifiedPageSkeleton title="Gym Analytics" variant="dashboard" />}>
            <GymAnalyticsFetcher />
          </Suspense>
        </TabsContent>

        <TabsContent value="race">
          <Suspense fallback={<UnifiedPageSkeleton title="Race Results" variant="dashboard" />}>
            <RaceResultsFetcher />
          </Suspense>
        </TabsContent>

        <TabsContent value="compare">
          <Suspense fallback={<UnifiedPageSkeleton title="Comparative Analytics" variant="dashboard" />}>
            <ComparativeAnalyticsFetcher />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}

async function SprintAnalyticsFetcher() {
  // SprintAnalyticsDashboard handles its own data fetching via React Query
  return <SprintAnalyticsDashboard />
}

async function GymAnalyticsFetcher() {
  // GymAnalyticsDashboard handles its own data fetching via React Query
  return <GymAnalyticsDashboard />
}

async function RaceResultsFetcher() {
  // RaceResultsDashboard handles its own data fetching via React Query
  return <RaceResultsDashboard />
}

async function ComparativeAnalyticsFetcher() {
  // In production, this would fetch comparative performance data
  // with proper anonymization and privacy controls

  return (
    <ComparativePerformanceAnalytics
      className="w-full"
    />
  )
}

function SprintAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>

      {/* Chart + Benchmark Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 rounded-lg bg-muted animate-pulse" />
        <div className="h-80 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Phase Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-lg bg-muted animate-pulse" />
    </div>
  )
}
