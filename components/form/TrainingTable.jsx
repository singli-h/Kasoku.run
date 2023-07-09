import React from "react"

const TrainingTable = ({ trainings }) => {
  return (
    <div className="my-4">
      <h2 className="text-gray-200 font-bold text-lg mb-2">
        Training Sessions
      </h2>
      <table className="table-auto w-full text-left whitespace-no-wrap">
        <thead className="text-gray-200">
          <tr>
            <th className="px-4 py-2">Exercise ID</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Reps</th>
            <th className="px-4 py-2">Sets</th>
            <th className="px-4 py-2">Rest Time</th>
            <th className="px-4 py-2">Output</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {trainings.map((training, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}>
              <td className="px-4 py-2">{training.exercise_id}</td>
              <td className="px-4 py-2">{training.date}</td>
              <td className="px-4 py-2">{training.reps}</td>
              <td className="px-4 py-2">{training.sets}</td>
              <td className="px-4 py-2">{training.rest_time}</td>
              <td className="px-4 py-2">{training.output}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TrainingTable
