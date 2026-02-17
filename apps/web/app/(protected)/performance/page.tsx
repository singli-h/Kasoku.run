import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { Timer, Dumbbell, Users, Trophy } from "lucide-react"

// Dynamically import each dashboard to code-split per tab.
// Only the active tab's bundle loads since Radix TabsContent
// unmounts inactive content by default.
const SprintAnalyticsDashboard = dynamic(
  () =>
    import("@/components/features/performance/components/sprint/SprintAnalyticsDashboard").then(
      (mod) => mod.SprintAnalyticsDashboard
    ),
  { loading: () => <SprintAnalyticsSkeleton /> }
)

const GymAnalyticsDashboard = dynamic(
  () =>
    import("@/components/features/performance/components/gym/GymAnalyticsDashboard").then(
      (mod) => mod.GymAnalyticsDashboard
    ),
  { loading: () => <UnifiedPageSkeleton title="Gym Analytics" variant="dashboard" /> }
)

const RaceResultsDashboard = dynamic(
  () =>
    import("@/components/features/performance/components/race/RaceResultsDashboard").then(
      (mod) => mod.RaceResultsDashboard
    ),
  { loading: () => <UnifiedPageSkeleton title="Race Results" variant="dashboard" /> }
)

const ComparativePerformanceAnalytics = dynamic(
  () => import("@/components/features/performance/components/comparative-performance-analytics"),
  { loading: () => <UnifiedPageSkeleton title="Comparative Analytics" variant="dashboard" /> }
)

export default function PerformancePage() {
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
          <SprintAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="gym">
          <GymAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="race">
          <RaceResultsDashboard />
        </TabsContent>

        <TabsContent value="compare">
          <ComparativePerformanceAnalytics className="w-full" />
        </TabsContent>
      </Tabs>
    </PageLayout>
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
