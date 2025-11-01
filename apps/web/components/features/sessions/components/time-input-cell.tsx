/*
<ai_context>
TimeInputCell - Input component for entering sprint times with PB-based targets.
Shows calculated target time as placeholder based on athlete's PB and effort level.
Handles time input in seconds (e.g., "12.45") and converts to milliseconds for storage.
Displays PB indicator when new PB is achieved.
</ai_context>
*/

"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { calculateSprintTarget } from "@/lib/sprint-pacing-utils"
import { PBIndicator } from "./pb-indicator"

interface TimeInputCellProps {
  athleteId: number
  exerciseId: number
  setIndex: number
  value: number | null // Time in seconds
  onChange: (value: number | null) => void
  personalBest?: {
    value: number // PB time in seconds
    unitId: number
    achievedDate: string
  }
  effort?: number // 0-1 (e.g., 0.95 for 95% effort)
  disabled?: boolean
  autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export const TimeInputCell = forwardRef<HTMLInputElement, TimeInputCellProps>(
  (props, ref) => {
    const {
      athleteId,
      exerciseId,
      setIndex,
      value,
      onChange,
      personalBest,
      effort = 0.95, // Default 95% effort
      disabled = false,
      autoFocus = false,
      onKeyDown
    } = props
  const [inputValue, setInputValue] = useState("")
  const [isNewPB, setIsNewPB] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Forward ref to parent component
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  // Calculate target time based on PB and effort
  const targetTime = personalBest
    ? calculateSprintTarget(
        [{ ...personalBest, athlete_id: athleteId, exercise_id: exerciseId, id: 0, achieved_date: personalBest.achievedDate, verified: false, unit_id: personalBest.unitId }],
        exerciseId,
        effort
      ).targetSeconds
    : null

  // Sync input value with prop value
  useEffect(() => {
    if (value !== null) {
      setInputValue(value.toFixed(2))
    } else {
      setInputValue("")
    }
  }, [value])

  // Check if new PB
  useEffect(() => {
    if (value !== null && personalBest) {
      setIsNewPB(value < personalBest.value)
    } else {
      setIsNewPB(false)
    }
  }, [value, personalBest])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow only valid time format (numbers and single decimal point)
    if (newValue === "" || /^\d*\.?\d{0,2}$/.test(newValue)) {
      setInputValue(newValue)
    }
  }

  const handleBlur = () => {
    if (inputValue === "") {
      onChange(null)
      return
    }

    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed)
      setInputValue(parsed.toFixed(2)) // Normalize format
    } else {
      // Invalid input, revert to previous value
      if (value !== null) {
        setInputValue(value.toFixed(2))
      } else {
        setInputValue("")
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "." ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight"
    ) {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      }
      // Pass through to parent for navigation
      onKeyDown?.(e)
      return
    }

    // Block non-numeric keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const placeholder = targetTime !== null
    ? `${targetTime.toFixed(2)}s`
    : "0.00"

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "text-center font-mono tabular-nums",
          isNewPB && "border-green-500 bg-green-50 font-bold text-green-700"
        )}
      />
      {isNewPB && (
        <div className="absolute -right-1 -top-1">
          <PBIndicator size="sm" />
        </div>
      )}
    </div>
  )
})

TimeInputCell.displayName = 'TimeInputCell'
