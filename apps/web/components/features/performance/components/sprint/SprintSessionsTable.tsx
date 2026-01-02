"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Star, ChevronDown, ChevronUp, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatSprintTime, formatSpeed } from "../../data/sprint-benchmarks"

export interface SprintSessionData {
  id: string
  date: Date | string
  distance: number
  totalTime: number
  reactionTime?: number
  topSpeed?: number
  frequency?: number
  strideLength?: number
  isPB?: boolean
  delta?: number // Difference from best
}

interface SprintSessionsTableProps {
  sessions: SprintSessionData[]
  onUploadClick?: () => void
  className?: string
  maxRows?: number
}

export function SprintSessionsTable({
  sessions,
  onUploadClick,
  className,
  maxRows = 5,
}: SprintSessionsTableProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedSessions = showAll ? sessions : sessions.slice(0, maxRows)
  const hasMore = sessions.length > maxRows

  const formatDelta = (delta: number | undefined): string => {
    if (delta === undefined || delta === 0) return '-'
    const sign = delta > 0 ? '+' : ''
    return `${sign}${delta.toFixed(2)}s`
  }

  const getDeltaColor = (delta: number | undefined): string => {
    if (delta === undefined || delta === 0) return 'text-muted-foreground'
    return delta < 0 ? 'text-green-500' : 'text-red-500'
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
          {onUploadClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadClick}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload CSV
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {sessions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No sprint sessions recorded yet
            </p>
            {onUploadClick && (
              <Button variant="outline" size="sm" onClick={onUploadClick} className="gap-1.5">
                <Upload className="h-4 w-4" />
                Upload Freelap Data
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs font-medium w-[90px]">Date</TableHead>
                    <TableHead className="text-xs font-medium text-center">Dist</TableHead>
                    <TableHead className="text-xs font-medium text-right">Time</TableHead>
                    <TableHead className="text-xs font-medium text-right hidden sm:table-cell">React</TableHead>
                    <TableHead className="text-xs font-medium text-right hidden md:table-cell">Speed</TableHead>
                    <TableHead className="text-xs font-medium text-right hidden lg:table-cell">Freq</TableHead>
                    <TableHead className="text-xs font-medium text-right w-[70px]">vs Best</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {displayedSessions.map((session, index) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={cn(
                          "border-border/30 hover:bg-muted/30 transition-colors",
                          session.isPB && "bg-primary/5"
                        )}
                      >
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm tabular-nums">
                              {format(new Date(session.date), 'MMM d')}
                            </span>
                            {session.isPB && (
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {session.distance}m
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-right">
                          <span className={cn(
                            "text-sm font-medium tabular-nums",
                            session.isPB && "text-primary"
                          )}>
                            {formatSprintTime(session.totalTime)}
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-right hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {session.reactionTime
                              ? formatSprintTime(session.reactionTime, 3)
                              : '-'
                            }
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-right hidden md:table-cell">
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {session.topSpeed
                              ? formatSpeed(session.topSpeed)
                              : '-'
                            }
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-right hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {session.frequency
                              ? `${session.frequency.toFixed(2)} Hz`
                              : '-'
                            }
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-right">
                          {session.isPB ? (
                            <Badge className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1.5">
                              PB
                            </Badge>
                          ) : (
                            <span className={cn(
                              "text-sm tabular-nums",
                              getDeltaColor(session.delta)
                            )}>
                              {formatDelta(session.delta)}
                            </span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="pt-3 border-t border-border/30 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Show {sessions.length - maxRows} More
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
