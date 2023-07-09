"use client"

import React, { useState } from "react"
import Button from "../common/Button"

const initialExerciseState = {
  name: "",
  type: "gym",
  output_unit: "weight",
}

const ExerciseForm = ({ addExercise }) => {
  const [exercise, setExercise] = useState(initialExerciseState)

  const handleExerciseChange = (event) => {
    setExercise({ ...exercise, [event.target.name]: event.target.value })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    addExercise(exercise)
    setExercise(initialExerciseState) // Clear form after adding
  }

  return (
    <>
      <div className="my-4">
        <h2 className="text-gray-200 font-bold text-lg mb-2">
          Exercise Session
        </h2>
        <div className="mb-4">
          <label
            className="block text-gray-200 text-sm font-bold mb-2"
            htmlFor="name"
          >
            Exercise Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            placeholder="Exercise Name"
            name="name"
            value={exercise.name}
            onChange={handleExerciseChange}
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-200 text-sm font-bold mb-2"
            htmlFor="type"
          >
            Exercise Type
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="type"
            name="type"
            value={exercise.type}
            onChange={handleExerciseChange}
          >
            <option value="gym">Gym</option>
            <option value="sprint">Sprint</option>
            <option value="plyometric">Plyometric</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-200 text-sm font-bold mb-2"
            htmlFor="output_unit"
          >
            Output Unit
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="output_unit"
            name="output_unit"
            value={exercise.output_unit}
            onChange={handleExerciseChange}
          >
            <option value="weight">Weight</option>
            <option value="distance">Distance</option>
            <option value="time">Time</option>
          </select>
        </div>
      </div>
      <Button onClick={handleSubmit}>Add Exercise</Button>
    </>
  )
}

export default ExerciseForm
