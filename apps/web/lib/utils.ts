/*
<ai_context>
Contains the utility functions for the app.
</ai_context>
*/

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract text from a planning_context JSONB field.
 * Handles: string, { text: string }, or unknown JSONB shapes.
 * Returns null if no meaningful text is found.
 */
export function extractPlanningContextText(ctx: unknown): string | null {
  if (!ctx) return null
  if (typeof ctx === 'string') return ctx
  if (typeof ctx === 'object') {
    const text = (ctx as Record<string, unknown>)?.text
    if (typeof text === 'string') return text
  }
  return null
}
