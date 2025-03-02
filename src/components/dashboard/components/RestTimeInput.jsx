"use client"

import React, { useState, useEffect } from "react"
import InputWithUnit from './InputWithUnit'

/**
 * RestTimeInput Component
 * Specialized input for rest time that can display seconds or minutes
 * 
 * @param {Object} props
 * @param {number} props.value - Time in seconds
 * @param {Function} props.onChange - Callback when value changes, receives value in seconds
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 */
const RestTimeInput = ({ value, onChange, disabled = false }) => {
  const isMinutes = value >= 120
  const [displayValue, setDisplayValue] = useState(
    isMinutes ? Math.round(value / 60 * 10) / 10 : value
  )

  useEffect(() => {
    setDisplayValue(value >= 120 ? Math.round(value / 60 * 10) / 10 : value)
  }, [value])

  const handleValueChange = (newValue) => {
    // If disabled, don't allow changes
    if (disabled) return;
    
    setDisplayValue(newValue)
    const secondsValue = isMinutes ? Math.round(newValue * 60) : newValue
    onChange(secondsValue)
  }

  return (
    <InputWithUnit
      label="Rest"
      value={displayValue}
      unit={isMinutes ? "min" : "sec"}
      onChange={handleValueChange}
      step={isMinutes ? 0.5 : 5}
      min={0}
      disabled={disabled}
    />
  )
}

export default RestTimeInput 