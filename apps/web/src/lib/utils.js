import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { cva } from "class-variance-authority"

/**
 * Utility function to merge class names with Tailwind CSS classes
 * @param  {...string} inputs - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Export cva for reuse in component variants
export { cva } 