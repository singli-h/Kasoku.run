"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ExerciseSectionManager from '@/components/mesoWizard/components/ExerciseSectionManager'
import ExerciseTimeline from '@/components/mesoWizard/components/ExerciseTimeline'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useSession } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function GroupEditorView({ group, presets, filteredExercises, loadingExercises, onBack, onSave }) {
  const sessionId = group.id
  const router = useRouter()
  const { session } = useSession()

  // Metadata state
  const [name, setName] = useState(group.name || '')
  const [date, setDate] = useState(group.date ? new Date(group.date).toISOString().split('T')[0] : '')
  const [sessionMode, setSessionMode] = useState(group.session_mode || 'individual')
  const [description, setDescription] = useState(group.description || '')

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
      description,
      date,
      session_mode: sessionMode,
      presets: exercises.map((e) => ({
        id: typeof e.id === 'number' && e.id > 1000000000 ? null : e.id,
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this preset group? This action cannot be undone.')) {
      return;
    }
    try {
      const token = await session?.getToken();
      if (!token) {
        alert('Authentication error. Please try again.');
        return;
      }
      const res = await fetch(`/api/plans/preset-groups/${group.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to delete preset group');
      }
      alert('Preset group deleted successfully.');
      router.push('/plans?tab=builder');
    } catch (error) {
      console.error("Failed to delete preset group:", error);
      alert(`Error deleting: ${error.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Metadata Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Group Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="font-medium">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sprint Day Focus" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-date" className="font-medium">Date (Optional)</Label>
            <Input id="group-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-mode" className="font-medium">Session Mode</Label>
            <select
              id="group-mode"
              className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 h-10 focus:border-primary focus:ring-primary"
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value)}
            >
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="group-description" className="font-medium">Description (Optional)</Label>
            <textarea 
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose or focus of this preset group..."
              rows={3}
              className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 focus:border-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercises & Timeline */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Exercises</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="exercises">Manage Exercises</TabsTrigger>
              <TabsTrigger value="timeline">View Timeline</TabsTrigger>
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
                handleSetActiveSections={(sectionsArray) => setActiveSections(sectionsArray[sessionId] || [])}
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
                allExercises={exercises}
                currentActiveSections={activeSections}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions - Footer of the page or a final card */}
      <Card className="shadow-lg">
        <CardFooter className="flex justify-between items-center py-4 px-6 border-t">
          <Button variant="destructive" onClick={handleDelete} className="flex items-center">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Group
          </Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onBack} size="lg">Cancel</Button>
            <Button onClick={handleSave} size="lg">Save Changes</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 