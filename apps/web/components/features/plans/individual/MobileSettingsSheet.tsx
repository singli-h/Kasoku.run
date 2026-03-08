'use client'

/**
 * MobileSettingsSheet
 *
 * Bottom sheet for mobile settings including advanced fields toggle.
 * Opens from the mobile header settings button.
 *
 * Implements T052 from tasks.md (Phase 10: User Story 8)
 *
 * @see docs/features/plans/individual/tasks.md
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { AdvancedFieldsToggle } from './AdvancedFieldsToggle'

interface MobileSettingsSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Whether advanced fields are currently visible */
  showAdvancedFields: boolean
  /** Callback when advanced fields toggle changes */
  onAdvancedFieldsChange: (checked: boolean) => void
  /** Whether the settings are still loading */
  isLoading?: boolean
}

/**
 * Mobile settings sheet with training view preferences.
 *
 * @example
 * ```tsx
 * <MobileSettingsSheet
 *   open={settingsOpen}
 *   onOpenChange={setSettingsOpen}
 *   showAdvancedFields={showAdvancedFields}
 *   onAdvancedFieldsChange={toggleAdvancedFields}
 * />
 * ```
 */
export function MobileSettingsSheet({
  open,
  onOpenChange,
  showAdvancedFields,
  onAdvancedFieldsChange,
  isLoading = false,
}: MobileSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>View Settings</SheetTitle>
          <SheetDescription>
            Customize how your training plan is displayed
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
          {/* Advanced Fields Toggle */}
          <AdvancedFieldsToggle
            checked={showAdvancedFields}
            onCheckedChange={(checked) => {
              onAdvancedFieldsChange(checked)
            }}
            variant="card"
            isLoading={isLoading}
          />

          {/* Placeholder for future settings */}
          {/*
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Light, dark, or system
                </p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">System</span>
          </div>
          */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
