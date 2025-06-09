"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function KnowledgeBaseSkeleton() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mt-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Knowledge Base Articles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Article List Items Skeleton */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 