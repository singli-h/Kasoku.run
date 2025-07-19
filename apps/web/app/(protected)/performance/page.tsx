"use server"

import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IndividualPerformanceAnalytics, 
  ComparativePerformanceAnalytics, 
  PerformanceAnalyticsSkeleton 
} from "@/components/features/performance"

export default async function PerformancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and compare your performance with comprehensive analytics
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Analytics</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Suspense fallback={<PerformanceAnalyticsSkeleton />}>
            <IndividualPerformanceAnalyticsFetcher />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparative">
          <Suspense fallback={<PerformanceAnalyticsSkeleton />}>
            <ComparativePerformanceAnalyticsFetcher />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function IndividualPerformanceAnalyticsFetcher() {
  // In a real implementation, this would fetch user-specific performance data
  // For now, we'll pass the analytics component directly
  
  return (
    <IndividualPerformanceAnalytics 
      className="w-full"
    />
  )
}

async function ComparativePerformanceAnalyticsFetcher() {
  // In a real implementation, this would fetch comparative performance data
  // with proper anonymization and privacy controls
  
  return (
    <ComparativePerformanceAnalytics 
      className="w-full"
    />
  )
} 