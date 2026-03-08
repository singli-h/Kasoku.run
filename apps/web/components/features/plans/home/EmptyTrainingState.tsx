'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Plus } from "lucide-react"
import Link from "next/link"

/**
 * Empty state shown when individual user has no training blocks
 */
export function EmptyTrainingState() {
  return (
    <div className="space-y-8">
      {/* Hero Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Start Your Training Journey</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first Training Block to organize your workouts and track your progress.
          </p>
          <Button asChild size="lg">
            <Link href="/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Training Block
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
