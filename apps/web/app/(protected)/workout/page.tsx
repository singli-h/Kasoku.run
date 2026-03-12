import Link from "next/link"
import { History } from "lucide-react"
import { WorkoutPageContent } from "@/components/features/workout/components/pages/workout-page-content"
import { PageLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"

export default async function WorkoutPage() {
  return (
    <PageLayout
      title="My Workouts"
      description="Continue your workout or start a new session"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/workout/history">
            <History className="h-4 w-4 mr-2" />
            View History
          </Link>
        </Button>
      }
    >
      <WorkoutPageContent />
    </PageLayout>
  )
}
