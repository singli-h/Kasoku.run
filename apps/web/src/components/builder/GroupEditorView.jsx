"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ExerciseSectionManager from '@/components/mesoWizard/components/ExerciseSectionManager'
import ExerciseTimeline from '@/components/mesoWizard/components/ExerciseTimeline'
import { ArrowLeft } from 'lucide-react'

export default function GroupEditorView({ group, presets, filteredExercises, loadingExercises, onBack, onSave }) {
  const sessionId = group.id

  // Metadata state
  const [name, setName] = useState(group.name || '')
  const [date, setDate] = useState(group.date || '')
  const [sessionMode, setSessionMode] = useState(group.session_mode || 'individual')

  // Map presets to exercises state
  const [exercises, setExercises] = useState(() =>
    presets.map((p) => {
      const exType = p.exercises.exercise_types?.type.toLowerCase() || ''
      return {
        id: p.id,
        session: sessionId,
        part: exType,
        section: exType,
        exercise_id: p.exercise_id,
        superset_id: p.superset_id,
        position: p.preset_order,
        notes: p.notes || '',
        presetDetails: (p.exercise_preset_details || []).map((d) => ({
          set_number: d.set_index,
          reps: d.reps,
          weight: d.weight,
          resistance: d.resistance,
          resistance_unit_id: d.resistance_unit_id,
          distance: d.distance,
          height: d.height,
          tempo: d.tempo,
          rest_time: d.rest_time,
          power: d.power,
          velocity: d.velocity,
          effort: d.effort,
          performing_time: d.performing_time,
          metadata: d.metadata
        }))
      }
    })
  )

  // Active sections based on exercises
  const initialSections = Array.from(new Set(exercises.map((e) => e.section)))
  const [activeSections, setActiveSections] = useState(initialSections)

  // Supersets state
  const [supersets, setSupersets] = useState([])

  // Handlers
  const handleSessionInputChange = useCallback((sid, field, value) => {
    if (field === 'name') setName(value)
    if (field === 'date') setDate(value)
    if (field === 'sessionMode') setSessionMode(value)
  }, [])

  const handleAddExercise = useCallback((exercise) => {
    const newExercise = {
      id: Date.now(),
      session: sessionId,
      part: exercise.type,
      section: exercise.section || exercise.type,
      exercise_id: exercise.id,
      superset_id: null,
      position: Math.max(-1, ...exercises.map((e) => e.position || 0)) + 1,
      notes: '',
      presetDetails: []
    }
    setExercises((prev) => [...prev, newExercise])
  }, [exercises, sessionId])

  const handleRemoveExercise = useCallback((sid, exId) => {
    setExercises((prev) => prev.filter((e) => e.id !== exId))
  }, [])

  const handleExerciseDetailChange = useCallback((sid, exId, field, value, idx) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e
        if (idx >= 0) {
          const det = [...e.presetDetails]
          det[idx] = { ...det[idx], [field]: value }
          return { ...e, presetDetails: det }
        }
        return { ...e, [field]: value }
      })
    )
  }, [])

  const handleExerciseReorder = useCallback((sid, sectionId, reordered) => {
    setExercises(reordered)
  }, [])

  const getOrderedExercises = useCallback((sid, sectionId) => {
    return exercises
      .filter((e) => e.session === sid && e.section === sectionId)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }, [exercises])

  const handleSupersetChange = useCallback((sid, newSups) => {
    setSupersets(newSups)
  }, [])

  const handleSave = () => {
    const updateData = {
      name,
      date,
      sessionMode,
      presets: exercises.map((e) => ({
        exercise_id: e.exercise_id,
        superset_id: e.superset_id,
        preset_order: e.position,
        notes: e.notes,
        presetDetails: e.presetDetails.map((d) => ({
          set_index: d.set_number,
          reps: d.reps,
          weight: d.weight,
          resistance: d.resistance,
          resistance_unit_id: d.resistance_unit_id,
          distance: d.distance,
          height: d.height,
          tempo: d.tempo,
          rest_time: d.rest_time,
          power: d.power,
          velocity: d.velocity,
          effort: d.effort,
          performing_time: d.performing_time,
          metadata: d.metadata
        }))
      }))
    }
    onSave(updateData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Edit Preset Group</h2>
      </div>

      {/* Metadata Form */}
      <Card>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="group-date">Date</Label>
            <Input id="group-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="group-mode">Session Mode</Label>
            <select
              id="group-mode"
              className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2"
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value)}
            >
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Exercises & Timeline */}
      <Tabs defaultValue="exercises">
        <TabsList>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises">
          <ExerciseSectionManager
            sessionId={sessionId}
            exercises={exercises}
            filteredExercises={filteredExercises}
            loadingExercises={loadingExercises}
            handleAddExercise={handleAddExercise}
            handleRemoveExercise={handleRemoveExercise}
            handleExerciseDetailChange={handleExerciseDetailChange}
            handleExerciseReorder={handleExerciseReorder}
            getOrderedExercises={getOrderedExercises}
            sessionSections={{ [sessionId]: activeSections }}
            handleSetActiveSections={(sec) => setActiveSections(sec)}
            mode={sessionMode}
            onSupersetChange={(sups) => handleSupersetChange(sessionId, sups)}
          />
        </TabsContent>
        <TabsContent value="timeline">
          <ExerciseTimeline
            sessionId={sessionId}
            exercises={exercises}
            activeSections={activeSections}
            mode={sessionMode}
            handleExerciseDetailChange={handleExerciseDetailChange}
            errors={{}}
            getSectionName={(id) => id}
            getOrderedExercises={getOrderedExercises}
            supersets={supersets}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
} 