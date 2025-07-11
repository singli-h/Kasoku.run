/**
 * AthleteTimeCell
 * An input cell for logging sprint times. Handles converting to/from milliseconds.
 * Includes validation and error handling for sprint time input.
 */
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AthleteTimeCellProps {
  value: number | null // time in ms
  onChange: (value: number | null) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function AthleteTimeCell({ 
  value, 
  onChange, 
  disabled = false,
  className,
  placeholder = "0.00"
}: AthleteTimeCellProps) {
  const [displayValue, setDisplayValue] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (value === null) {
      setDisplayValue("")
    } else {
      // Convert ms to seconds string
      setDisplayValue((value / 1000).toFixed(2))
    }
    setIsValid(true)
  }, [value])

  const validateTime = (timeString: string): boolean => {
    if (!timeString || timeString.trim() === "") return true // Empty is valid
    
    const time = parseFloat(timeString)
    
    // Check if it's a valid number
    if (isNaN(time)) return false
    
    // Check reasonable bounds for sprint times (0.1 to 300 seconds)
    if (time < 0.1 || time > 300) return false
    
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)
    
    // Validate input
    const valid = validateTime(newValue)
    setIsValid(valid)
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    if (!displayValue || displayValue.trim() === "") {
      onChange(null)
      setIsValid(true)
      return
    }

    const seconds = parseFloat(displayValue)
    if (isNaN(seconds)) {
      setIsValid(false)
      return
    }

    // Additional validation on blur
    if (seconds < 0.1 || seconds > 300) {
      setIsValid(false)
      return
    }

    // Convert seconds to ms and update
    onChange(Math.round(seconds * 1000))
    setIsValid(true)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys, backspace, delete, tab, escape, enter
    if ([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter'
    ].includes(e.key)) {
      return
    }

    // Allow numeric input and decimal point
    if (e.key >= '0' && e.key <= '9') {
      return
    }

    if (e.key === '.' && !displayValue.includes('.')) {
      return
    }

    // Block all other keys
    e.preventDefault()
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-24 text-center",
          !isValid && "border-red-500 focus:border-red-500",
          isFocused && isValid && "border-blue-500",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      />
      {!isValid && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500">
          Invalid time
        </div>
      )}
    </div>
  )
} 