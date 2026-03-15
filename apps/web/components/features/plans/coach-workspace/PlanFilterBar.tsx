'use client'

import { HelpCircle } from 'lucide-react'
import { SubgroupBadge } from '@/components/features/athletes/components/subgroup-badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface PlanFilterBarProps {
  subgroups: string[]
  selectedSubgroups: string[]
  onSubgroupToggle: (subgroup: string) => void
  onSubgroupClear: () => void
}

export function PlanFilterBar({
  subgroups,
  selectedSubgroups,
  onSubgroupToggle,
  onSubgroupClear,
}: PlanFilterBarProps) {
  if (subgroups.length === 0) return null

  return (
    <div className="border-b border-border/40 bg-muted/30">
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-3 overflow-x-auto">
        <span className="text-xs font-medium text-muted-foreground mr-0.5 shrink-0 uppercase tracking-wide">Subgroups</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="How subgroup filtering works" className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 text-xs space-y-2 p-3">
            <p className="font-medium text-sm">How subgroup filtering works</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><span className="text-foreground font-medium">Select one or more</span> subgroups to filter sessions.</li>
              <li><span className="text-foreground font-medium">Sessions show</span> if they have a matching session-level tag OR any exercise tagged with the selected subgroup.</li>
              <li><span className="text-foreground font-medium">Untagged sessions</span> (no tags at session or exercise level) are always visible — they apply to all athletes.</li>
              <li><span className="text-foreground font-medium">Multiple selections</span> combine with OR — selecting SS + MWF shows sessions relevant to either.</li>
            </ul>
            <div className="pt-1 border-t text-muted-foreground/80">
              <p>Tip: Use session tags for schedule groups (MW, MWF) and exercise tags for subgroups (SS, LS).</p>
            </div>
          </PopoverContent>
        </Popover>
        <SubgroupBadge
          value="All"
          interactive
          size="md"
          variant="filter"
          active={selectedSubgroups.length === 0}
          onClick={onSubgroupClear}
        />
        {subgroups.map(sg => (
          <SubgroupBadge
            key={sg}
            value={sg}
            interactive
            size="md"
            variant="filter"
            active={selectedSubgroups.includes(sg)}
            onClick={() => onSubgroupToggle(sg)}
          />
        ))}
      </div>
    </div>
  )
}
