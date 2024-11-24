import React from "react"

const ExerciseTable = ({ exercises }) => {
  return (
    <div className="my-4">
      <h2 className="text-gray-200 font-bold text-lg mb-2">Saved Exercises</h2>
      <table className="table-auto w-full text-left whitespace-no-wrap">
        <thead>
          <tr>
            <th className="px-4 py-2 text-gray-200">Name</th>
            <th className="px-4 py-2 text-gray-200">Type</th>
            <th className="px-4 py-2 text-gray-200">Output Unit</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise, i) => (
            <tr key={i} className="bg-gray-700">
              <td className="px-4 py-2">{exercise.name}</td>
              <td className="px-4 py-2">{exercise.type}</td>
              <td className="px-4 py-2">{exercise.output_unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ExerciseTable
