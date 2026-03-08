"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, Dumbbell, Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RecentSession } from "../types/dashboard-types"
import { isOverdue } from "@/components/composed/workout-session-status-badge"

interface RecentSessionsSectionProps {
  sessions: RecentSession[]
}

export function RecentSessionsSection({ sessions }: RecentSessionsSectionProps) {
  const getStatusConfig = (status: string, sessionDate?: Date) => {
    // Check if pending session is overdue
    if (status === 'pending' && sessionDate && isOverdue(sessionDate)) {
      return { variant: 'outline' as const, label: 'Overdue', color: 'bg-orange-500', isOverdue: true }
    }

    switch (status) {
      case 'completed':
        return { variant: 'default' as const, label: 'Completed', color: 'bg-green-500', isOverdue: false }
      case 'in-progress':
        return { variant: 'secondary' as const, label: 'In Progress', color: 'bg-blue-500', isOverdue: false }
      case 'cancelled':
        return { variant: 'destructive' as const, label: 'Cancelled', color: 'bg-red-500', isOverdue: false }
      default:
        return { variant: 'outline' as const, label: 'Pending', color: 'bg-gray-400', isOverdue: false }
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-primary" />
              Recent Sessions
            </h2>
            <CardDescription className="text-muted-foreground">
              Your latest training sessions
            </CardDescription>
          </div>
          <Link 
            href="/sessions" 
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-semibold border border-transparent hover:border-primary/20 px-2 py-1 rounded-md"
          >
            View All
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">No training sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Start your fitness journey with your first session!
            </p>
            <Link 
              href="/sessions" 
              className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              View Sessions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => {
              const statusConfig = getStatusConfig(session.status, session.date)

              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                    statusConfig.isOverdue ? "border-orange-300 dark:border-orange-700" : "border-border"
                  )}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      statusConfig.color
                    )} />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={statusConfig.variant}
                          className={cn(
                            "text-xs",
                            statusConfig.isOverdue && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                            session.status === 'pending' && !statusConfig.isOverdue && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
                            session.status === 'in-progress' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                            session.status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                            session.status === 'cancelled' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          )}
                        >
                          {statusConfig.isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(session.date, { addSuffix: true })}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {session.athlete && (
                    <Avatar className="h-8 w-8 border-2 border-border">
                      <AvatarImage src={session.athlete.avatar} alt={session.athlete.name} />
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {session.athlete.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 