"use client"

export interface SectionDividerProps {
  label: string
}

/**
 * SectionDivider - Visual separator between exercise sections
 *
 * Displays a section label with a horizontal line
 */
export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
