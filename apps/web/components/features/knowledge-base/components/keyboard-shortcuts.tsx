"use client"

import { useState } from "react"
import { HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface KeyboardShortcutsProps {
  className?: string
}

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = [
    { keys: "Ctrl+S", description: "Save document" },
    { keys: "Ctrl+Z", description: "Undo" },
    { keys: "Ctrl+Y", description: "Redo" },
    { keys: "Ctrl+Shift+Z", description: "Redo (alternative)" },
    { keys: "Ctrl+B", description: "Bold text" },
    { keys: "Ctrl+I", description: "Italic text" },
    { keys: "Ctrl+U", description: "Underline text" },
  ]

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
        title="Keyboard shortcuts"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> The document auto-saves as you type. 
              Use Ctrl+S to manually save at any time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
