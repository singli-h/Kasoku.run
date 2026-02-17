"use server"

import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { SprintSessionSpreadsheet } from "@/components/features/sessions"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface SessionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  // Protect this page - only coaches and individuals can access
  const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })

  const { id } = await params
  const sessionId = id

  if (!sessionId) {
    return (
      <PageLayout
        title="Invalid Session"
        description="The session ID is invalid"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The session ID provided is not valid.
          </p>
          <Link href="/sessions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Session Data Entry"
      description="Enter performance data for athletes"
    >
      <div className="space-y-4">
        <Link href="/sessions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>

        <Suspense fallback={<UnifiedPageSkeleton title="Loading Session..." variant="dashboard" />}>
          <SprintSessionSpreadsheet sessionId={sessionId} effort={0.95} />
        </Suspense>
      </div>
    </PageLayout>
  )
}
