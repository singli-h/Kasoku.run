"use server"

import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IndividualPerformanceAnalytics, 
  ComparativePerformanceAnalytics
} from "@/components/features/performance"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"

export default async function PerformancePage() {
  return (
    <PageLayout
      title="Performance Analytics"
      description="Track your progress and compare your performance with comprehensive analytics"
    >
      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Analytics</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Suspense fallback={<UnifiedPageSkeleton title="Performance Analytics" variant="dashboard" />}>
            <IndividualPerformanceAnalyticsFetcher />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparative">
          <Suspense fallback={<UnifiedPageSkeleton title="Performance Analytics" variant="dashboard" />}>
            <ComparativePerformanceAnalyticsFetcher />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageLayout>
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