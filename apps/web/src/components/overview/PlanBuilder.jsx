"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { ChevronDown, ChevronUp, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { useBrowserSupabaseClient } from '@/lib/supabase'
import { dashboardApi } from '@/lib/supabase-api'
import { PlusCircle, Save } from "lucide-react"

const PlanButton = ({ children, isActive, className = "", ...props }) => {
  return (
    <button
      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
        ${
          isActive
            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
        ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function PlanBuilder({ mesocycle, onUpdate }) {
  const supabase = useBrowserSupabaseClient()
  const [historyState, setHistoryState] = useState({ history: [mesocycle], index: 0 })
  const [expandedSessions, setExpandedSessions] = useState([])
  const [searchTerms, setSearchTerms] = useState({})
  const [currentMesocycle, setMesocycle] = useState(mesocycle)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true)
        const { data, error } = await dashboardApi.getExercises(supabase)
        if (error) throw error
        setExercises(data || [])
      } catch (err) {
        console.error('Error fetching exercises:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [])

  // Reset history when a new mesocycle is passed in
  useEffect(() => {
    if (mesocycle && mesocycle.sessions) {
      setHistoryState({ history: [mesocycle], index: 0 })
      setMesocycle(mesocycle)
    }
  }, [mesocycle])

  // Update currentMesocycle and propagate changes when historyState changes
  useEffect(() => {
    const newMesocycle = historyState.history[historyState.index]
    setMesocycle(newMesocycle)
    onUpdate(newMesocycle)
  }, [historyState, onUpdate]) // Added onUpdate to dependencies

  // Update history atomically with a new mesocycle
  const updateMesocycle = (newMesocycle) => {
    setHistoryState((prev) => {
      const newHistory = [...prev.history.slice(0, prev.index + 1), newMesocycle]
      return { history: newHistory, index: newHistory.length - 1 }
    })
    // Immediate update (the effect will also run)
    setMesocycle(newMesocycle)
    onUpdate(newMesocycle)
  }

  // Undo: move the index back if possible
  const handleUndo = () => {
    setHistoryState((prev) => {
      if (prev.index > 0) {
        return { ...prev, index: prev.index - 1 }
      }
      return prev
    })
  }

  // Redo: move the index forward if possible
  const handleRedo = () => {
    setHistoryState((prev) => {
      if (prev.index < prev.history.length - 1) {
        return { ...prev, index: prev.index + 1 }
      }
      return prev
    })
  }

  const toggleSession = (sessionId) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((s) => s !== sessionId) : [...prev, sessionId],
    )
  }

  const handleExerciseChange = (sessionId, exerciseId, field, value, setIndex = -1) => {
    const newMesocycle = JSON.parse(JSON.stringify(currentMesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    if (!session) return

    // Check in all exercise groups (warmup, gym, or circuits)
    const exercise =
      session.exercises?.find((e) => e.id === exerciseId) ||
      session.warmup?.find((e) => e.id === exerciseId) ||
      session.circuits?.find((e) => e.id === exerciseId)
    if (!exercise) return

    if (setIndex === -1) {
      exercise[field] = value
    } else {
      if (!exercise.sets) exercise.sets = []
      if (!exercise.sets[setIndex]) exercise.sets[setIndex] = {}
      exercise.sets[setIndex][field] = value
    }

    updateMesocycle(newMesocycle)
  }

  const handleAddExercise = (sessionId, type) => {
    const newMesocycle = JSON.parse(JSON.stringify(currentMesocycle))
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
    const newMesocycle = JSON.parse(JSON.stringify(currentMesocycle))
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
    const newMesocycle = JSON.parse(JSON.stringify(currentMesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const exercise = session.exercises.find((e) => e.id === exerciseId)
    const newSetNumber = exercise.sets.length + 1
    exercise.sets.push({ setNumber: newSetNumber, reps: 8, weight: 0, power: 0, velocity: 0 })

    updateMesocycle(newMesocycle)
  }

  const handleRemoveSet = (sessionId, exerciseId, setIndex) => {
    const newMesocycle = JSON.parse(JSON.stringify(currentMesocycle))
    const session = newMesocycle.sessions.find((s) => s.id === sessionId)
    const exercise = session.exercises.find((e) => e.id === exerciseId)
    exercise.sets.splice(setIndex, 1)
    exercise.sets.forEach((set, index) => (set.setNumber = index + 1))

    updateMesocycle(newMesocycle)
  }

  const renderExerciseSearch = (sessionId, exerciseId, currentExerciseName, type) => {
    // Use a unique key that includes the exerciseId.
    const searchKey = `${sessionId}-${exerciseId}-${type}`
    const searchTerm = searchTerms[searchKey] || ""
    const setSearchTerm = (term) => setSearchTerms((prev) => ({ ...prev, [searchKey]: term }))

    const filteredExercises = exercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (type === "gym" ? exercise.type === "gym" : exercise.type === type),
    )

    return (
      <div className="relative">
        <div className="flex items-center">
          <Input
            value={currentExerciseName}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              handleExerciseChange(sessionId, exerciseId, "name", e.target.value)
            }}
            className="pr-8"
            placeholder="Search exercises..."
          />
        </div>
        {searchTerm && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  handleExerciseChange(sessionId, exerciseId, "name", exercise.name)
                  setSearchTerm("")
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

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!exercises.length) return <div>No exercises available</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <PlanButton isActive={true}>
          <PlusCircle className="w-5 h-5" />
          Add Exercise
        </PlanButton>
        
        <PlanButton>
          <Save className="w-5 h-5" />
          Save Plan
        </PlanButton>
      </div>
      <div className="flex justify-between items-center">
        <PlanButton 
          onClick={handleUndo} 
          disabled={historyState.index === 0}
          className={historyState.index === 0 ? "opacity-50 cursor-not-allowed" : ""}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Undo
        </PlanButton>
        <PlanButton
          onClick={handleRedo}
          disabled={historyState.index === historyState.history.length - 1}
          className={historyState.index === historyState.history.length - 1 ? "opacity-50 cursor-not-allowed" : ""}
        >
          Redo <ChevronRight className="h-4 w-4 ml-2" />
        </PlanButton>
      </div>
      <div className="space-y-4">
        {currentMesocycle.sessions.map((session) => (
          <Card key={session.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {session.name} - {session.date}
              </CardTitle>
              <PlanButton 
                onClick={() => toggleSession(session.id)}
                className="hover:bg-gray-100"
              >
                {expandedSessions.includes(session.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </PlanButton>
            </CardHeader>
            {expandedSessions.includes(session.id) && (
              <CardContent>
                <div className="space-y-4">
                  {/* Warm-up Exercises */}
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
                        <PlanButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(session.id, exercise.id, "warmup")}
                        >
                          <Minus className="h-4 w-4" />
                        </PlanButton>
                      </div>
                    ))}
                    <PlanButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "warmup")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Warm-up Exercise
                    </PlanButton>
                  </div>

                  {/* Gym Exercises */}
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
                          <PlanButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExercise(session.id, exercise.id, "gym")}
                          >
                            <Minus className="h-4 w-4" />
                          </PlanButton>
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
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        session.id,
                                        exercise.id,
                                        "reps",
                                        Number(e.target.value),
                                        setIndex,
                                      )
                                    }
                                    className="w-16"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        session.id,
                                        exercise.id,
                                        "weight",
                                        Number(e.target.value),
                                        setIndex,
                                      )
                                    }
                                    className="w-16"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    value={set.power}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        session.id,
                                        exercise.id,
                                        "power",
                                        Number(e.target.value),
                                        setIndex,
                                      )
                                    }
                                    className="w-16"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    value={set.velocity}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        session.id,
                                        exercise.id,
                                        "velocity",
                                        Number(e.target.value),
                                        setIndex,
                                      )
                                    }
                                    className="w-16"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <PlanButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSet(session.id, exercise.id, setIndex)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </PlanButton>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <PlanButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSet(session.id, exercise.id)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Set
                        </PlanButton>
                      </div>
                    ))}
                    <PlanButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "gym")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Gym Exercise
                    </PlanButton>
                  </div>

                  {/* Circuit Exercises */}
                  <div>
                    <h4 className="font-semibold mb-2">Circuits</h4>
                    {session.circuits.map((exercise) => (
                      <div key={exercise.id} className="flex items-center space-x-2 mb-2">
                        {renderExerciseSearch(session.id, exercise.id, exercise.name, "circuit")}
                        <Input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) =>
                            handleExerciseChange(session.id, exercise.id, "reps", Number(e.target.value))
                          }
                          className="w-16"
                          placeholder="Reps"
                          min="0"
                        />
                        <Input
                          value={exercise.duration}
                          onChange={(e) => handleExerciseChange(session.id, exercise.id, "duration", e.target.value)}
                          className="w-24"
                          placeholder="Duration"
                        />
                        <PlanButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(session.id, exercise.id, "circuit")}
                        >
                          <Minus className="h-4 w-4" />
                        </PlanButton>
                      </div>
                    ))}
                    <PlanButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddExercise(session.id, "circuit")}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Circuit Exercise
                    </PlanButton>
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

