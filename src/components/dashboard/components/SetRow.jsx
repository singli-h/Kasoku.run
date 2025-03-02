"use client"

import React from "react"
import { Dumbbell, Zap, Wind, Clock, ArrowRight } from "lucide-react"

/**
 * SetRow Component
 * 
 * Displays a single set of exercise training data in a table row format
 * with appropriate icons and input fields for each metric.
 * 
 * @component
 */
const SetRow = ({ detail, index, onInputChange }) => {
  const handleChange = (field, value) => {
    onInputChange(detail.id, field, value === "" ? null : Number(value))
  }

  // Common input field class for consistent styling - narrower and no arrows
  const inputClass = "w-14 px-2 py-2 text-base border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-2 py-2 font-medium text-gray-900 w-10 text-center">{index + 1}</td>
      <td className="px-2 py-2 w-20">
        <input
          type="number"
          value={detail.reps ?? ""}
          onChange={(e) => handleChange("reps", e.target.value)}
          className={inputClass}
          aria-label="Repetitions"
        />
      </td>
      {detail.weight !== null && (
        <td className="px-2 py-2 w-20">
          <div className="flex items-center">
            <Dumbbell size={16} className="text-gray-400 mr-1" />
            <input
              type="number"
              value={detail.weight ?? ""}
              onChange={(e) => handleChange("weight", e.target.value)}
              className={inputClass}
              aria-label="Weight"
            />
            <span className="ml-1 text-xs text-gray-500">kg</span>
          </div>
        </td>
      )}
      {detail.resistance_value !== null && (
        <td className="px-2 py-2 w-20">
          <div className="flex items-center">
            <ArrowRight size={16} className="text-gray-400 mr-1" />
            <input
              type="number"
              value={detail.resistance_value ?? ""}
              onChange={(e) => handleChange("resistance_value", e.target.value)}
              className={inputClass}
              aria-label="Resistance"
            />
            <span className="ml-1 text-xs text-gray-500">kg</span>
          </div>
        </td>
      )}
      {detail.power !== null && (
        <td className="px-2 py-2 w-20">
          <div className="flex items-center">
            <Zap size={16} className="text-gray-400 mr-1" />
            <input
              type="number"
              value={detail.power ?? ""}
              onChange={(e) => handleChange("power", e.target.value)}
              className={inputClass}
              aria-label="Power"
            />
            <span className="ml-1 text-xs text-gray-500">W</span>
          </div>
        </td>
      )}
      {detail.velocity !== null && (
        <td className="px-2 py-2 w-20">
          <div className="flex items-center">
            <Wind size={16} className="text-gray-400 mr-1" />
            <input
              type="number"
              value={detail.velocity ?? ""}
              onChange={(e) => handleChange("velocity", e.target.value)}
              className={inputClass}
              aria-label="Velocity"
            />
            <span className="ml-1 text-xs text-gray-500">m/s</span>
          </div>
        </td>
      )}
      {detail.rest_time !== null && (
        <td className="px-2 py-2 w-20">
          <div className="flex items-center">
            <Clock size={16} className="text-gray-400 mr-1" />
            <input
              type="number"
              value={detail.rest_time ?? ""}
              onChange={(e) => handleChange("rest_time", e.target.value)}
              className={inputClass}
              aria-label="Rest time"
            />
            <span className="ml-1 text-xs text-gray-500">s</span>
          </div>
        </td>
      )}
    </tr>
  )
}

export default SetRow 