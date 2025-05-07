"use client"

import React from "react"
// Icons removed: using generic inputs for dynamic columns

/**
 * SetRow Component
 * 
 * Displays a single set of exercise training data in a table row format
 * with appropriate icons and input fields for each metric.
 * 
 * @component
 */
const SetRow = ({ detail, index, columns, onInputChange }) => {
  const handleChange = (field, value) => {
    onInputChange(detail.id, field, value === "" ? null : Number(value))
  }

  // Common input field class for consistent styling - narrower and no arrows
  const inputClass = "w-14 px-2 py-2 text-base border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Set number column */}
      <td className="px-2 py-2 font-medium text-gray-900 w-10 text-center">{index + 1}</td>
      {/* Dynamic metric columns */}
      {columns.map(cfg => (
        <td key={cfg.key} className="px-2 py-2 w-20">
          <input
            type="number"
            value={detail[cfg.key] ?? ""}
            onChange={e => handleChange(cfg.key, e.target.value)}
            className={inputClass}
            aria-label={cfg.label}
          />
          {cfg.unit && <span className="ml-1 text-xs text-gray-500">{cfg.unit}</span>}
        </td>
      ))}
    </tr>
  )
}

export default SetRow 