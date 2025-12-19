"use client"

import { Calendar, Dumbbell, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MockSession } from "./types"

interface MockSessionCardProps {
  session: MockSession
}

const statusConfig = {
  upcoming: { label: "Upcoming", variant: "outline" as const },
  "in-progress": { label: "In Progress", variant: "default" as const },
  completed: { label: "Completed", variant: "secondary" as const },
}

export function MockSessionCard({ session }: MockSessionCardProps) {
  const status = statusConfig[session.status]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{session.date}</span>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {session.exercises.map((exercise, index) => {
            const firstSet = exercise.sets[0]
            const setsCount = exercise.sets.length
            return (
              <div
                key={exercise.id}
                className={cn(
                  "flex items-center justify-between rounded-lg bg-muted/50 p-3",
                  "border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {setsCount} sets x {firstSet?.reps ?? '-'}
                      </span>
                      {firstSet?.weight && (
                        <>
                          <span>@</span>
                          <span>{firstSet.weight}kg</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {firstSet?.restTime && firstSet.restTime > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{firstSet.restTime >= 60 ? `${Math.floor(firstSet.restTime / 60)}m` : `${firstSet.restTime}s`}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-center gap-6 border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span>{session.exercises.length} exercises</span>
          </div>
          <div className="flex items-center gap-1">
            <span>
              {session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} total sets
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
