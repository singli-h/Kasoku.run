'use client'

/**
 * ProposedBlockSummary
 *
 * Card showing the proposed training block summary.
 */

import { Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProposedBlock } from './types'

interface ProposedBlockSummaryProps {
  /** The block data */
  block: ProposedBlock
  /** Additional className */
  className?: string
}

export function ProposedBlockSummary({
  block,
  className,
}: ProposedBlockSummaryProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-lg font-bold">{block.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {block.durationWeeks} weeks
              </Badge>
              <Badge variant="outline" className="text-xs">
                {block.focus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {block.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
