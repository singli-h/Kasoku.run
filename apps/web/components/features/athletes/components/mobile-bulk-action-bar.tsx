/**
 * MobileBulkActionBar - Sticky bottom bar for bulk athlete operations
 * Shows when athletes are selected on mobile devices
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, ArrowRightLeft, UserMinus, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BulkOperationState } from "../types"

interface MobileBulkActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkOperation: (operation: BulkOperationState) => void
  className?: string
}

export function MobileBulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkOperation,
  className
}: MobileBulkActionBarProps) {
  const isVisible = selectedCount > 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background/95 backdrop-blur-lg border-t shadow-lg",
            "pb-[env(safe-area-inset-bottom)]",
            className
          )}
        >
          <div className="px-4 py-3">
            {/* Selection info row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {selectedCount} selected
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-xs h-8"
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'assign' })}
                className="flex-1 h-11 text-sm font-medium"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Group
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'move' })}
                className="flex-1 h-11 text-sm font-medium"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Move
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkOperation({ isOpen: true, type: 'remove' })}
                className="flex-1 h-11 text-sm font-medium text-destructive hover:text-destructive"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
