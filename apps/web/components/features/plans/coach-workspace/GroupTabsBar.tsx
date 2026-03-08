'use client'

interface AthleteGroup { id: number; name: string }

interface GroupTabsBarProps {
  groups: AthleteGroup[]
  selectedGroupId: number | null
  onSelect: (groupId: number | null) => void
}

export function GroupTabsBar({ groups, selectedGroupId, onSelect }: GroupTabsBarProps) {
  if (groups.length === 0) return null
  return (
    <div className="flex items-center gap-1 border-b pb-2 mb-3 overflow-x-auto shrink-0">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
          selectedGroupId === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        All
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            selectedGroupId === g.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
