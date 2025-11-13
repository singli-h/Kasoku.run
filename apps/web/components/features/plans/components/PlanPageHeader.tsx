"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Undo, Redo, Edit2, Check, X, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
  // Detail mode toggle props
  pageMode?: "simple" | "detail"
  onPageModeChange?: (mode: "simple" | "detail") => void
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
  pageMode,
  onPageModeChange,
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
    <header className="border-b border-border/40">
      <div className="flex items-center justify-between px-6 py-4 gap-6">
        {/* Left: Back + Title + Subtitle */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 -ml-2"
            onClick={() => router.push(backPath)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Button>

          <div className="min-w-0 flex-1">
            {/* Title with inline editing */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-lg font-semibold h-auto py-1"
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
                <h1 className="text-lg font-semibold truncate">{title}</h1>
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
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {onDateChange ? (
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => onDateChange(e.target.value)}
                      className="h-6 px-2 text-xs border-none bg-transparent hover:bg-muted/50 focus:bg-muted cursor-pointer"
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

        {/* Right: Mode Toggle + Undo/Redo (all inline) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status && (
            <Badge variant={status === "active" ? "default" : "secondary"} className="hidden sm:flex">
              {status}
            </Badge>
          )}
          {rightActions}

          {/* Segmented Control (iOS-style) */}
            {pageMode !== undefined && onPageModeChange && (
            <div className="flex items-center rounded-lg bg-muted p-0.5">
              <button
                onClick={() => onPageModeChange("simple")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  pageMode === "simple"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                    Simple
              </button>
              <button
                onClick={() => onPageModeChange("detail")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  pageMode === "detail"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                    Detail
              </button>
            </div>
            )}

          {/* Undo/Redo - Icon buttons only */}
            {showUndoRedo && (
              <>
                <Button
                variant="ghost"
                size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo"
                className="h-8 w-8"
                >
                <Undo className="h-4 w-4" />
                <span className="sr-only">Undo</span>
                </Button>
                <Button
                variant="ghost"
                size="icon"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo"
                className="h-8 w-8"
                >
                <Redo className="h-4 w-4" />
                <span className="sr-only">Redo</span>
                </Button>
              </>
            )}
          </div>
        </div>
    </header>
  )
}
