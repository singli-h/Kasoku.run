/*
<ai_context>
PersonalBestsManagement - Component for viewing and editing personal best records.
Shows all PBs in a table with ability to edit, delete, and add new records.
Includes filters by exercise and date range.
</ai_context>
*/

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { getMyPersonalBestsAction, deletePBAction } from "@/actions/athletes"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface PersonalBest {
  id: number
  athlete_id: number
  exercise_id: number | null
  event_id: number | null
  value: number
  unit_id: number
  metadata: any
  achieved_date: string
  session_id: number | null
  verified: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export function PersonalBestsManagement() {
  const { toast } = useToast()
  const [pbs, setPbs] = useState<PersonalBest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPersonalBests()
  }, [])

  const loadPersonalBests = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getMyPersonalBestsAction()

      if (result.isSuccess) {
        setPbs(result.data)
      } else {
        setError(result.message)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load personal bests'
      setError(errorMsg)
      console.error('[PersonalBestsManagement]', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this personal best?')) {
      return
    }

    const result = await deletePBAction(id)

    if (result.isSuccess) {
      toast({
        title: "Success",
        description: "Personal best deleted successfully"
      })
      loadPersonalBests()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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
            onClick={loadPersonalBests}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (pbs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Personal Bests
          </CardTitle>
          <CardDescription>
            No personal bests recorded yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Start training to set your first personal best!
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Manual PB
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Personal Bests
          </h2>
          <p className="text-sm text-muted-foreground">
            {pbs.length} record{pbs.length !== 1 ? 's' : ''} • {pbs.filter(pb => pb.verified).length} verified
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add PB
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise / Event</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead>Date Achieved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pbs.map((pb) => (
                <TableRow key={pb.id}>
                  <TableCell className="font-medium">
                    {pb.exercise_id ? `Exercise ID: ${pb.exercise_id}` : ''}
                    {pb.event_id ? `Event ID: ${pb.event_id}` : ''}
                    {!pb.exercise_id && !pb.event_id && 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pb.value.toFixed(2)}
                    <span className="text-muted-foreground ml-1">
                      (unit: {pb.unit_id})
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(pb.achieved_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {pb.verified ? (
                      <Badge variant="default">Verified</Badge>
                    ) : (
                      <Badge variant="secondary">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Edit PB",
                            description: "Edit functionality coming in next update"
                          })
                        }}
                        title="Edit personal best (coming soon)"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pb.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <p>💡 Personal bests are automatically detected when you complete training sessions</p>
        <p>✅ Verified PBs have been confirmed by a coach</p>
      </div>
    </div>
  )
}
