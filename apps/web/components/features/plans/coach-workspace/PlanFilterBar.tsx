'use client'

interface AthleteGroup { id: number; name: string }

interface PlanFilterBarProps {
  groups: AthleteGroup[]
  selectedGroupId: number | null
  onGroupSelect: (groupId: number | null) => void
  eventGroups: string[]
  selectedEventGroups: string[]
  onEventGroupToggle: (eventGroup: string) => void
  onEventGroupClear: () => void
}

export function PlanFilterBar({
  groups,
  selectedGroupId,
  onGroupSelect,
  eventGroups,
  selectedEventGroups,
  onEventGroupToggle,
  onEventGroupClear,
}: PlanFilterBarProps) {
  const hasGroups = groups.length > 0
  const hasEventGroups = eventGroups.length > 0

  if (!hasGroups && !hasEventGroups) return null

  return (
    <div className="border-b border-border/40 bg-muted/30">
      <div className="flex flex-col gap-3 px-4 sm:px-6 py-3 lg:flex-row lg:items-center lg:gap-0">
        {/* Group pills */}
        {hasGroups && (
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 -mx-1 px-1 pb-1 lg:pb-0">
            <span className="text-xs font-medium text-muted-foreground mr-0.5 shrink-0 uppercase tracking-wide">Group</span>
            <button
              onClick={() => onGroupSelect(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedGroupId === null
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => onGroupSelect(g.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedGroupId === g.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Divider — desktop: vertical line, mobile: hidden (rows stack) */}
        {hasGroups && hasEventGroups && (
          <div className="hidden lg:block w-px h-6 bg-border mx-4 shrink-0" />
        )}

        {/* Event group pills (multi-select toggles) */}
        {hasEventGroups && (
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 -mx-1 px-1 pb-1 lg:pb-0">
            <span className="text-xs font-medium text-muted-foreground mr-0.5 shrink-0 uppercase tracking-wide">Events</span>
            <button
              onClick={onEventGroupClear}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedEventGroups.length === 0
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {eventGroups.map(eg => {
              const isSelected = selectedEventGroups.includes(eg)
              return (
                <button
                  key={eg}
                  onClick={() => onEventGroupToggle(eg)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {eg}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
