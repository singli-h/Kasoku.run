"use server"

import { Suspense } from "react"
import { getCurrentUserAction } from "@/actions/auth/user-actions"
import { KnowledgeBasePageContent } from "@/components/features/knowledge-base/components/knowledge-base-page-content"
import { KnowledgeBaseSkeleton } from "@/components/features/knowledge-base/components/knowledge-base-skeleton"
import { Card, CardContent } from "@/components/ui/card"

async function KnowledgeBaseContentFetcher() {
  const [userResult] = await Promise.all([
    getCurrentUserAction()
  ])
  
  if (!userResult.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading user data: {userResult.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const user = userResult.data

  return (
    <KnowledgeBasePageContent user={user} />
  )
}

export default async function KnowledgeBasePage() {
  return (
    <Suspense fallback={<KnowledgeBaseSkeleton />}>
      <KnowledgeBaseContentFetcher />
    </Suspense>
  )
} 