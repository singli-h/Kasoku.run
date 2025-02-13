"use client"

import * as React from "react"
import { cn } from "@/libs/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    className={cn(
      "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
      className
    )}
    ref={ref}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"

export { Checkbox } 