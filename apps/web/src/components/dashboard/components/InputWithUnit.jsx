"use client"

import React, { useState, useEffect } from "react"

/**
 * InputWithUnit Component
 * A specialized input field that shows a unit label
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the input
 * @param {number|null} props.value - Current input value
 * @param {string} [props.unit] - Unit to display on the right side
 * @param {Function} props.onChange - Function called when input value changes
 * @param {number} [props.step=1] - Step increment for the number input
 * @param {number} [props.min=0] - Minimum value
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 */
const InputWithUnit = ({ 
  label, 
  value, 
  unit, 
  onChange, 
  step = 1, 
  min = 0, 
  className = "",
  disabled = false 
}) => {
  // Use local state to manage the input value for immediate feedback
  const [localValue, setLocalValue] = useState("");
  
  // Sync the local value with the prop value when it changes externally
  useEffect(() => {
    setLocalValue(value === null || value === undefined ? "" : value.toString());
  }, [value]);

  const handleChange = (e) => {
    // If disabled, don't allow changes
    if (disabled) return;
    
    const inputValue = e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalValue(inputValue);
    
    // If empty string, pass null to parent
    if (inputValue === "") {
      onChange(null);
      return;
    }
    
    // Prevent scientific notation by checking for 'e' or 'E'
    if (inputValue.toLowerCase().includes('e')) {
      return;
    }
    
    // Convert to number and validate
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      // Use setTimeout to prevent the value from being immediately overwritten by React's re-render
      setTimeout(() => {
        onChange(numValue);
      }, 0);
    }
  };

  return (
    <div className={`space-y-1`}>
      <label className={`block text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          step={step}
          min={min}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 
            text-lg h-12 pr-5 pl-2 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${className}`}
        />
        {unit && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${disabled ? 'text-gray-400' : 'text-gray-500'} pointer-events-none`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default InputWithUnit 