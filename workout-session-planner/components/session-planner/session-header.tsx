"use client"

import { useState } from "react"
import { Calendar, Clock, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Session } from "@/types/session"

interface SessionHeaderProps {
  session: Session
  estimatedDuration: number
  pageMode: "simple" | "detail"
  onSessionChange: (updates: Partial<Session>) => void
  onPageModeChange: (mode: "simple" | "detail") => void
  onSave: () => void
  onDiscard: () => void
  hasUnsavedChanges: boolean
}

export function SessionHeader({
  session,
  estimatedDuration,
  pageMode,
  onSessionChange,
  onPageModeChange,
  onSave,
  onDiscard,
  hasUnsavedChanges,
}: SessionHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  return (
    <div className="border-b bg-background sticky top-0 z-10 shadow-sm">
      <div className="p-3 sm:p-4 space-y-3">
        {/* Title Row */}
        <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            {isEditingTitle ? (
              <Input
                value={session.name}
                onChange={(e) => onSessionChange({ name: e.target.value })}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                className="text-xl sm:text-2xl font-bold h-auto py-1 flex-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-muted-foreground transition-colors truncate flex-1"
                onClick={() => setIsEditingTitle(true)}
              >
                {session.name || "Untitled Session"}
              </h1>
            )}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs shrink-0">
                Unsaved
              </Badge>
            )}
          </div>

          {/* Action Buttons - Separated for mobile safety */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onDiscard} className="flex-1 sm:flex-none bg-transparent">
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Discard</span>
            </Button>
            <Button size="sm" onClick={onSave} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={session.date || ""}
              onChange={(e) => onSessionChange({ date: e.target.value })}
              className="h-8 w-auto text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
              Est. {estimatedDuration} min
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={pageMode === "simple" ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageModeChange("simple")}
              className="h-7 text-xs px-2 sm:px-3"
            >
              Simple
            </Button>
            <Button
              variant={pageMode === "detail" ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageModeChange("detail")}
              className="h-7 text-xs px-2 sm:px-3"
            >
              Detail
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
