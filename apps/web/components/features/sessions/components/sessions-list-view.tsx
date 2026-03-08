/*
<ai_context>
SessionsListView - List of all active group sessions for the coach.
Card grid layout with session details and click to open spreadsheet.
Shows session name, date, athlete group, and status.
</ai_context>
*/

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, ExternalLink, AlertCircle } from "lucide-react"
import { getGroupSessionsAction } from "@/actions/sessions"

export function SessionsListView() {
  const [sessions, setSessions] = useState<{
    id: number
    name: string
    date: string
    athleteGroupName: string
    athleteCount: number
    status: string
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getGroupSessionsAction()

      if (result.isSuccess) {
        setSessions(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMsg)
      console.error('[SessionsListView]', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Sessions</CardTitle>
          <CardDescription>
            There are no active group training sessions at the moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a training plan and assign it to an athlete group to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} ready for data entry
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSessions}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/sessions/${session.id}`}
            className="group"
          >
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="group-hover:text-blue-600">
                      {session.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Group:</span>
                    <span className="text-sm text-muted-foreground">
                      {session.athleteGroupName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Athletes:</span>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {session.athleteCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant={
                        session.status === 'assigned'
                          ? 'default'
                          : session.status === 'ongoing'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {session.status === 'assigned' && 'Ready'}
                      {session.status === 'ongoing' && 'In Progress'}
                      {session.status === 'completed' && 'Completed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
