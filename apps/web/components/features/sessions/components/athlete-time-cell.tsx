/**
 * AthleteTimeCell
 * An input cell for logging sprint times. Handles converting to/from milliseconds.
 */
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface AthleteTimeCellProps {
  value: number | null // time in ms
  onChange: (value: number | null) => void
}

export function AthleteTimeCell({ value, onChange }: AthleteTimeCellProps) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value === null) {
      setDisplayValue("")
    } else {
      // Convert ms to seconds string
      setDisplayValue((value / 1000).toFixed(2))
    }
  }, [value])

  const handleBlur = () => {
    const seconds = parseFloat(displayValue)
    if (isNaN(seconds)) {
      onChange(null)
    } else {
      // Convert seconds to ms
      onChange(Math.round(seconds * 1000))
    }
  }

  return (
    <Input
      type="number"
      value={displayValue}
      onChange={(e) => setDisplayValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="0.00"
      className="w-24"
    />
  )
} 