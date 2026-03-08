/**
 * Set Row Details Component
 * Expandable detail panel that shows Freelap timing data below a set row
 *
 * Uses Framer Motion for smooth expand/collapse animation
 * Renders as a full-width table row with colSpan
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { FreeelapMetricsTable } from "./freelap-metrics-table"
import { isFreeelapMetadata } from "@/types/freelap"
import type { Json } from "@/types/database"

interface SetRowDetailsProps {
  /** Whether the details panel is expanded */
  isExpanded: boolean
  /** The metadata from workout_log_sets.metadata */
  metadata: Json | null | undefined
  /** Total column count for colspan */
  colSpan: number
  /** Optional className */
  className?: string
}

export function SetRowDetails({
  isExpanded,
  metadata,
  colSpan,
  className
}: SetRowDetailsProps) {
  // Validate metadata is Freelap data
  const freelapData = isFreeelapMetadata(metadata) ? metadata : null

  if (!freelapData) return null

  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <tr className={cn("bg-muted/20", className)}>
          <td colSpan={colSpan} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 ml-8">
                <FreeelapMetricsTable
                  metadata={freelapData}
                />
              </div>
            </motion.div>
          </td>
        </tr>
      )}
    </AnimatePresence>
  )
}

export default SetRowDetails
