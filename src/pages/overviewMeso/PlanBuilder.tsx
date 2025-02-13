"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/Card"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Label from "../../components/common/Label"
import { ChevronDown, ChevronUp, Plus, Minus, ChevronLeft, ChevronRight, Search } from "lucide-react"
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { exerciseLibrary } from "../../../mockData"

const PlanBuilder = ({ mesocycle, onUpdate }) => {
  const [expandedSessions, setExpandedSessions] = useState([])
  const [history, setHistory] = useState([mesocycle])
  const [historyIndex, setHistoryIndex] = useState(0)
  // const [searchTerm, setSearchTerm] = useState("")

  const toggleSession = (sessionId) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((s) => s !== sessionId) : [...prev, sessionId],
    )
  }

  // const handleDragEnd = (result) => {
  //   if (!result.destination) return

  //   const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
  //   const [reorderedItem] = newMesocycle.sessions.splice(result.source.index, 1)
  //   newMesocycle.sessions.splice(result.destination.index, 0, reorderedItem)

  //   updateMesocycle(newMesocycle)
  // }

  const handleExerciseChange = (sessionId, exerciseId, field, value, setIndex = -1) => {
    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const exercise = session.exercises.find((e) => e.id === exerciseId)

    if (setIndex === -1) {
      exercise[field] = value
    } else {
      exercise.sets[setIndex][field] = value
    }

    updateMesocycle(newMesocycle)
  }

  const handleAddExercise = (sessionId, type) => {
    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const newExercise = { id: Date.now(), name: "New Exercise" }

    if (type === "warmup") {
      newExercise.duration = "5 min"
      session.warmup.push(newExercise)
    } else if (type === "gym") {
      newExercise.sets = [{ setNumber: 1, reps: 8, weight: 0, power: 0, velocity: 0 }]
      newExercise.oneRepMax = "0%"
      session.exercises.push(newExercise)
    } else if (type === "circuit") {
      newExercise.reps = 10
      newExercise.duration = "30 sec"
      session.circuits.push(newExercise)
    }

    updateMesocycle(newMesocycle)
  }

  const handleRemoveExercise = (sessionId, exerciseId, type) => {
    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)

    if (type === "warmup") {
      session.warmup = session.warmup.filter((e) => e.id !== exerciseId)
    } else if (type === "gym") {
      session.exercises = session.exercises.filter((e) => e.id !== exerciseId)
    } else if (type === "circuit") {
      session.circuits = session.circuits.filter((e) => e.id !== exerciseId)
    }

    updateMesocycle(newMesocycle)
  }

  const handleAddSet = (sessionId, exerciseId) => {
    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const exercise = session.exercises.find((e) => e.id === exerciseId)
    const newSetNumber = exercise.sets.length + 1
    exercise.sets.push({ setNumber: newSetNumber, reps: 8, weight: 0, power: 0, velocity: 0 })

    updateMesocycle(newMesocycle)
  }

  const handleRemoveSet = (sessionId, exerciseId, setIndex) => {
    const newMesocycle = JSON.parse(JSON.stringify(mesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const exercise = session.exercises.find((e) => e.id === exerciseId)
    exercise.sets.splice(setIndex, 1)
    exercise.sets.forEach((set, index) => (set.setNumber = index + 1))

    updateMesocycle(newMesocycle)
  }

  const updateMesocycle = (newMesocycle) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newMesocycle])
    setHistoryIndex((prev) => prev + 1)
    onUpdate(newMesocycle)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      onUpdate(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      onUpdate(history[historyIndex + 1])
    }
  }

  const [localSearchTerm, setLocalSearchTerm] = useState("") // Moved useState declaration outside renderExerciseSearch

  const renderExerciseSearch = (sessionId, exerciseId, currentExerciseName, type) => {
    const localFilteredExercises = exerciseLibrary.filter((exercise) =>
      exercise.name.toLowerCase().includes(localSearchTerm.toLowerCase()),
    )

    return (
      <div className="relative">
        <div className="flex items-center">
          <Input
            value={currentExerciseName}
            onChange={(e) => handleExerciseChange(sessionId, exerciseId, "name", e.target.value)}
            className="pr-8"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0"
            onClick={() => setLocalSearchTerm(currentExerciseName)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {localSearchTerm && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg">
            {localFilteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  handleExerciseChange(sessionId, exerciseId, "name", exercise.name)
                  setLocalSearchTerm("")
                }}
              >
                {exercise.name}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // const filteredExercises = exerciseLibrary.filter((exercise) =>
  //   exercise.name.toLowerCase().includes(searchTerm.toLowerCase()),
  // )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={handleUndo} disabled={historyIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Undo
        </Button>
        <Button onClick={handleRedo} disabled={historyIndex === history.length - 1}>
          Redo <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <div className="space-y-4">
        {mesocycle.sessions.map((session) => (
          <Card key={session.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {session.name} - {session.date}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => toggleSession(session.id)}>
                {expandedSessions.includes(session.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            {expandedSessions.includes(session.id) && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Warm-up</h4>
                    {session.warmup.map((exercise) => (
                      <div key={exercise.id} className="flex items-center space-x-2 mb-2">
                        {renderExerciseSearch(session.id, exercise.id, exercise.name, "warmup")}
                        <Input
                          value={exercise.duration}
                          onChange={(e) => handleExerciseChange(session.id, exercise.id, "duration", e.target.value)}
                          className="w-24"
                          placeholder="Duration"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(session.id, exercise.id, "warmup")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "warmup")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Warm-up Exercise
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gym Exercises</h4>
                    {session.exercises.map((exercise) => (
                      <div key={exercise.id} className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          {renderExerciseSearch(session.id, exercise.id, exercise.name, "gym")}
                          <Input
                            value={exercise.oneRepMax}
                            onChange={(e) => handleExerciseChange(session.id, exercise.id, "oneRepMax", e.target.value)}
                            className="w-24"
                            placeholder="1RM %"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExercise(session.id, exercise.id, "gym")}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 text-left">Set</th>
                              <th className="px-2 py-1 text-left">Reps</th>
                              <th className="px-2 py-1 text-left">Weight</th>
                              <th className="px-2 py-1 text-left">Power</th>
                              <th className="px-2 py-1 text-left">Velocity</th>
                              <th className="px-2 py-1 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exercise.sets.map((set, setIndex) => (
                              <tr key={setIndex}>
                                <td className="px-2 py-1">{set.setNumber}</td>
                                <td className="px-2 py-1">
                                  <Input
                                    value={set.reps}
                                    onChange={(e) =>
                                      handleExerciseChange(session.id, exercise.id, "reps", e.target.value, setIndex)
                                    }
                                    className="w-16"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    value={set.weight}
                                    onChange={(e) =>
                                      handleExerciseChange(session.id, exercise.id, "weight", e.target.value, setIndex)
                                    }
                                    className="w-16"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    value={set.power}
                                    onChange={(e) =>
                                      handleExerciseChange(session.id, exercise.id, "power", e.target.value, setIndex)
                                    }
                                    className="w-16"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    value={set.velocity}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        session.id,
                                        exercise.id,
                                        "velocity",
                                        e.target.value,
                                        setIndex,
                                      )
                                    }
                                    className="w-16"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSet(session.id, exercise.id, setIndex)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSet(session.id, exercise.id)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Set
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "gym")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Gym Exercise
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Circuits</h4>
                    {session.circuits.map((exercise) => (
                      <div key={exercise.id} className="flex items-center space-x-2 mb-2">
                        {renderExerciseSearch(session.id, exercise.id, exercise.name, "circuit")}
                        <Input
                          value={exercise.reps}
                          onChange={(e) => handleExerciseChange(session.id, exercise.id, "reps", e.target.value)}
                          className="w-16"
                          placeholder="Reps"
                        />
                        <Input
                          value={exercise.duration}
                          onChange={(e) => handleExerciseChange(session.id, exercise.id, "duration", e.target.value)}
                          className="w-24"
                          placeholder="Duration"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(session.id, exercise.id, "circuit")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "circuit")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Circuit Exercise
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Label>AI-generated notes:</Label>
                    <p className="text-sm text-gray-600">{session.notes}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PlanBuilder

