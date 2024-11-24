import React, { useState } from "react"
import Button from "../../components/common/Button"

const initialTrainingState = {
  exercise_id: "",
  date: "",
  reps: "",
  sets: "",
  rest_time: "",
  output: "",
}

const TrainingForm = ({ addTraining, savedExercises }) => {
  const [training, setTraining] = useState(initialTrainingState)

  const handleTrainingChange = (event) => {
    setTraining({ ...training, [event.target.name]: event.target.value })
  }

  const handleSubmit = () => {
    addTraining(training)
    setTraining(initialTrainingState) // Clear form after adding
  }

  return (
    <div className="my-4">
      <h2 className="text-gray-200 font-bold text-lg mb-2">Training Session</h2>

      <div className="mb-4">
        <label
          htmlFor="exercise_id"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Exercise
        </label>
        <select
          id="exercise_id"
          name="exercise_id"
          value={training.exercise_id}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Select Exercise</option>
          {savedExercises.map((exercise, i) => (
            <option key={i} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label
          htmlFor="date"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Date
        </label>
        <input
          id="date"
          type="date"
          name="date"
          value={training.date}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="reps"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Reps
        </label>
        <input
          id="reps"
          type="number"
          name="reps"
          value={training.reps}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="sets"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Sets
        </label>
        <input
          id="sets"
          type="number"
          name="sets"
          value={training.sets}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="rest_time"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Rest Time
        </label>
        <input
          id="rest_time"
          type="number"
          name="rest_time"
          value={training.rest_time}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="output"
          className="block text-gray-200 text-sm font-bold mb-2"
        >
          Output
        </label>
        <input
          id="output"
          type="number"
          name="output"
          value={training.output}
          onChange={handleTrainingChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <Button onClick={handleSubmit}>Add Training</Button>
    </div>
  )
}

export default TrainingForm
