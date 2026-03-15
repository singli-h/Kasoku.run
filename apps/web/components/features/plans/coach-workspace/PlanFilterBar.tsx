'use client'

import { EventGroupBadge } from '@/components/features/athletes/components/event-group-badge'

interface PlanFilterBarProps {
  eventGroups: string[]
  selectedEventGroups: string[]
  onEventGroupToggle: (eventGroup: string) => void
  onEventGroupClear: () => void
}

export function PlanFilterBar({
  eventGroups,
  selectedEventGroups,
  onEventGroupToggle,
  onEventGroupClear,
}: PlanFilterBarProps) {
  if (eventGroups.length === 0) return null

  return (
    <div className="border-b border-border/40 bg-muted/30">
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-3 overflow-x-auto">
        <span className="text-xs font-medium text-muted-foreground mr-0.5 shrink-0 uppercase tracking-wide">Events</span>
        <EventGroupBadge
          value="All"
          interactive
          size="md"
          variant="filter"
          active={selectedEventGroups.length === 0}
          onClick={onEventGroupClear}
        />
        {eventGroups.map(eg => (
          <EventGroupBadge
            key={eg}
            value={eg}
            interactive
            size="md"
            variant="filter"
            active={selectedEventGroups.includes(eg)}
            onClick={() => onEventGroupToggle(eg)}
          />
        ))}
      </div>
    </div>
  )
}
