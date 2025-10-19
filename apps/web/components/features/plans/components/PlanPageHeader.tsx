"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Undo, Redo, Edit2, Check, X, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface PlanPageHeaderProps {
  title: string
  subtitle?: string
  backPath: string
  backLabel?: string
  status?: "active" | "draft" | "completed"
  showUndoRedo?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  rightActions?: React.ReactNode
  // New props for inline editing
  editable?: boolean
  onTitleChange?: (newTitle: string) => void
  // Session-specific props
  date?: string
  onDateChange?: (newDate: string) => void
  metadata?: string // e.g., "~45 min • 6 exercises"
}

export function PlanPageHeader({
  title,
  subtitle,
  backPath,
  backLabel = "Back",
  status,
  showUndoRedo = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  rightActions,
  editable = false,
  onTitleChange,
  date,
  onDateChange,
  metadata,
}: PlanPageHeaderProps) {
  const router = useRouter()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  const handleSaveTitle = () => {
    if (onTitleChange && editedTitle.trim()) {
      onTitleChange(editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(title)
    setIsEditingTitle(false)
  }

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => router.push(backPath)}
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div className="min-w-0 flex-1">
            {/* Title with inline editing */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold h-auto py-1"
                  placeholder="Enter name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <Button size="sm" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold truncate">{title}</h1>
                {editable && onTitleChange && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditedTitle(title)
                      setIsEditingTitle(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Subtitle / Date / Metadata */}
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {onDateChange ? (
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => onDateChange(e.target.value)}
                      className="h-6 px-2 text-sm border-none bg-transparent hover:bg-muted/50 focus:bg-muted cursor-pointer"
                    />
                  ) : (
                    <span>{new Date(date).toLocaleDateString()}</span>
                  )}
                </div>
              )}
              {metadata && <span>{metadata}</span>}
              {subtitle && !date && !metadata && <span className="truncate">{subtitle}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showUndoRedo && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
          {status && (
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status}
            </Badge>
          )}
          {rightActions}
        </div>
      </div>
    </header>
  )
}
