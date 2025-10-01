"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Save, X, Edit2, Check } from "lucide-react"
import type { Session } from "../types"

interface SessionHeaderProps {
  session: Session
  estimatedDuration: number | null
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(session.name || "")

  const handleSaveName = () => {
    onSessionChange({ name: editedName })
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setEditedName(session.name || "")
    setIsEditingName(false)
  }

  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Session Name and Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold h-auto py-1"
                    placeholder="Session name..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold truncate">{session.name || "Untitled Session"}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditedName(session.name || "")
                      setIsEditingName(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Metadata Row */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {session.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                )}
                {estimatedDuration !== null && estimatedDuration > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>~{estimatedDuration} min</span>
                  </div>
                )}
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-auto sm:ml-0">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex border rounded-md">
                <Button
                  size="sm"
                  variant={pageMode === "simple" ? "secondary" : "ghost"}
                  className="rounded-r-none"
                  onClick={() => onPageModeChange("simple")}
                >
                  Simple
                </Button>
                <Button
                  size="sm"
                  variant={pageMode === "detail" ? "secondary" : "ghost"}
                  className="rounded-l-none"
                  onClick={() => onPageModeChange("detail")}
                >
                  Detail
                </Button>
              </div>

              <Button variant="outline" onClick={onDiscard} disabled={!hasUnsavedChanges}>
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Mobile View Mode Toggle */}
          <div className="flex sm:hidden border rounded-md w-full">
            <Button
              size="sm"
              variant={pageMode === "simple" ? "secondary" : "ghost"}
              className="flex-1 rounded-r-none"
              onClick={() => onPageModeChange("simple")}
            >
              Simple
            </Button>
            <Button
              size="sm"
              variant={pageMode === "detail" ? "secondary" : "ghost"}
              className="flex-1 rounded-l-none"
              onClick={() => onPageModeChange("detail")}
            >
              Detail
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
