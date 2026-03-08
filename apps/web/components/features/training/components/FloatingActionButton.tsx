"use client"

import { Plus } from "lucide-react"

export interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
}

/**
 * FloatingActionButton - FAB for primary actions (add exercise)
 */
export function FloatingActionButton({ onClick, icon, label }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {icon || <Plus className="w-5 h-5" />}
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}
