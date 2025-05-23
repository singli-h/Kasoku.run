import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ExerciseDetailFields from './ExerciseDetailFields'
import { PlusCircle, X } from 'lucide-react'
import { validateExercise } from '../hooks/validation'
import { Badge } from '@/components/ui/badge'

// ExerciseItemFull: renders an exercise with default (first-set) view and full individual sets view
export default function ExerciseItemFull({
  exercise,
  mode = 'individual',
  onChangeExerciseField,           // (field, value) => void
  onChangeSetDetail,               // (setIndex, field, value) => void
  onAddSet,                        // () => void
  onRemoveSet,                     // (setIndex) => void
  // errors = {}, // This will now be managed internally by validationErrors state
  // Props for cross-section context, passed from SupersetContainer or ExerciseSectionManager
  hostSectionId, // The ID of the section this item is currently being rendered in (e.g., host superset's section)
  getSectionName // Function to resolve a sectionId to a display name
}) {
  const [localExercise, setLocalExercise] = useState(exercise)
  const { set_details = [] } = localExercise
  const [isEditingSets, setIsEditingSets] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Sync props -> local state if exercise changes externally
  // Also re-validate when the exercise prop or mode changes.
  useEffect(() => {
    setLocalExercise(exercise)
    setValidationErrors(validateExercise(exercise, mode))
  }, [exercise, mode])

  // Re-validate whenever localExercise state changes internally
  useEffect(() => {
    setValidationErrors(validateExercise(localExercise, mode))
  }, [localExercise, mode])

  // Helper: update local and notify parent, then re-validate
  function updateField(field, value) {
    const updatedExercise = { ...localExercise, [field]: value }
    setLocalExercise(updatedExercise)
    onChangeExerciseField(field, value) // Notify parent
    // setValidationErrors(validateExercise(updatedExercise, mode)) // Validation will run due to localExercise change effect
  }

  function updateSetDetail(idx, field, value) {
    // Create the updated exercise first to validate it
    const newSetDetails = [...localExercise.set_details]
    if (newSetDetails[idx]) {
      newSetDetails[idx] = { ...newSetDetails[idx], [field]: value }
    }
    const updatedExercise = { ...localExercise, set_details: newSetDetails }
    
    setLocalExercise(updatedExercise) // Update local state, which will trigger validation via useEffect
    onChangeSetDetail(idx, field, value) // Notify parent
  }

  // When number of sets changes, parent (ExerciseSectionManager) will update the exercise prop,
  // which will trigger re-validation via the useEffect for [exercise, mode].
  function updateNumberOfSets(newCount) {
    const currentCount = set_details.length
    if (newCount === currentCount) return

    // Calculate the difference and create new default sets if adding
    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        // Delegate actual set creation to parent via onAddSet.
        // The parent will update the `exercise` prop, triggering re-render and re-validation.
        onAddSet()
      }
    } else if (newCount < currentCount) {
      for (let i = currentCount - 1; i >= newCount; i--) {
        // Delegate removal to parent.
        onRemoveSet(i)
      }
    }
    // No direct local state update here, rely on parent to send new `exercise` prop
  }

  const primary = set_details[0] || {}
  const errors = validationErrors

  return (
    <div className="border rounded-md p-3 bg-white space-y-2">
      {/* Name & Type display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-base text-slate-700">{localExercise.name}</h4>
          {hostSectionId && exercise.current_section_id && hostSectionId !== exercise.current_section_id && getSectionName && (
            <Badge variant="outline" className="text-xs border-purple-400 text-purple-600 bg-purple-50">
              From: {getSectionName(exercise.current_section_id)}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Edit Sets toggle */}
          <Button size="sm" variant="outline" onClick={() => setIsEditingSets(prev => !prev)}>
            {isEditingSets ? 'Done Sets' : 'Edit Sets'}
          </Button>
        </div>
      </div>

      {/* Default view: first-set inputs propagate to others */}
      {!isEditingSets ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <div>
            <label className="block text-xs font-medium">Sets</label>
            <Input
              type="number"
              value={set_details.length}
              min={1}
              onChange={e => updateNumberOfSets(Number(e.target.value))}
              className={errors?.sets ? "border-red-500" : ""}
            />
            {errors?.sets && <p className="text-xs text-red-500 mt-1">{errors.sets}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium">Reps</label>
            <Input
              type="number"
              value={primary.reps || ''}
              onChange={e => updateSetDetail(0, 'reps', e.target.value)}
              className={errors?.reps || errors?.['set_details[0].reps'] ? "border-red-500" : ""}
            />
            {(errors?.reps || errors?.['set_details[0].reps']) && <p className="text-xs text-red-500 mt-1">{errors.reps || errors['set_details[0].reps']}</p>}
          </div>
          {mode === 'individual' ? (
            <>
              <div>
                <label className="block text-xs font-medium">Weight</label>
                <Input
                  type="text"
                  value={primary.weight || ''}
                  onChange={e => updateSetDetail(0, 'weight', e.target.value)}
                  className={errors?.weight || errors?.['set_details[0].weight'] ? "border-red-500" : ""}
                />
                {(errors?.weight || errors?.['set_details[0].weight']) && <p className="text-xs text-red-500 mt-1">{errors.weight || errors['set_details[0].weight']}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium">Rest</label>
                <Input
                  type="text"
                  value={primary.rest_time || ''}
                  onChange={e => updateSetDetail(0, 'rest_time', e.target.value)}
                  className={errors?.rest_time || errors?.['set_details[0].rest_time'] ? "border-red-500" : ""}
                />
                {(errors?.rest_time || errors?.['set_details[0].rest_time']) && <p className="text-xs text-red-500 mt-1">{errors.rest_time || errors['set_details[0].rest_time']}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium">Effort%</label>
                <Input
                  type="number"
                  value={primary.effort || ''}
                  onChange={e => updateSetDetail(0, 'effort', e.target.value)}
                  className={errors?.effort || errors?.['set_details[0].effort'] ? "border-red-500" : ""}
                />
                {(errors?.effort || errors?.['set_details[0].effort']) && <p className="text-xs text-red-500 mt-1">{errors.effort || errors['set_details[0].effort']}</p>}
              </div>
            </>
          ) : (
            // group mode: distance/time
            <>
              <div>
                <label className="block text-xs font-medium">Distance</label>
                <Input
                  type="text"
                  value={primary.distance || ''}
                  onChange={e => updateSetDetail(0, 'distance', e.target.value)}
                  className={errors?.distance || errors?.['set_details[0].distance'] ? "border-red-500" : ""}
                />
                {(errors?.distance || errors?.['set_details[0].distance']) && <p className="text-xs text-red-500 mt-1">{errors.distance || errors['set_details[0].distance']}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium">Time (s)</label>
                <Input
                  type="text"
                  value={primary.performing_time || ''}
                  onChange={e => updateSetDetail(0, 'performing_time', e.target.value)}
                  className={errors?.performing_time || errors?.['set_details[0].performing_time'] ? "border-red-500" : ""}
                />
                {(errors?.performing_time || errors?.['set_details[0].performing_time']) && <p className="text-xs text-red-500 mt-1">{errors.performing_time || errors['set_details[0].performing_time']}</p>}
              </div>
            </>
          )}
          {/* Details popover toggle */}
          <div className="col-span-full">
            <ExerciseDetailFields
              exercise={localExercise}
              mode={mode}
              onChange={(details) => updateField('secondary_details', details)}
              errors={errors}
            />
          </div>
          {/* Notes */}
          <div className="col-span-full">
            <label className="block text-xs font-medium">Notes</label>
            <Textarea
              value={localExercise.notes || ''}
              onChange={e => updateField('notes', e.target.value)}
              rows={2}
              className={errors?.notes ? "border-red-500" : ""}
            />
            {errors?.notes && <p className="text-xs text-red-500 mt-1">{errors.notes}</p>}
          </div>
        </div>
      ) : (
        /* Individual sets editing view */
        <div className="space-y-2">
          {set_details.map((set, idx) => (
            <div key={set.ui_id || `set-${idx}`} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
              <div className="col-span-full flex items-center justify-between">
                <p className="text-sm font-medium">Set {idx + 1}</p>
                <Button variant="ghost" size="sm" onClick={() => onRemoveSet(idx)}><X /></Button>
              </div>
              <div>
                <label className="block text-xs">Reps</label>
                <Input
                  type="number"
                  value={set.reps || ''}
                  onChange={e => updateSetDetail(idx, 'reps', e.target.value)}
                  className={errors?.[`set_details[${idx}].reps`] ? "border-red-500" : ""}
                />
                {errors?.[`set_details[${idx}].reps`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].reps`]}</p>}
              </div>
              {mode === 'individual' ? (
                <>
                  <div>
                    <label className="block text-xs">Weight</label>
                    <Input
                      type="text"
                      value={set.weight || ''}
                      onChange={e => updateSetDetail(idx, 'weight', e.target.value)}
                      className={errors?.[`set_details[${idx}].weight`] ? "border-red-500" : ""}
                    />
                    {errors?.[`set_details[${idx}].weight`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].weight`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs">Rest</label>
                    <Input
                      type="text"
                      value={set.rest_time || ''}
                      onChange={e => updateSetDetail(idx, 'rest_time', e.target.value)}
                      className={errors?.[`set_details[${idx}].rest_time`] ? "border-red-500" : ""}
                    />
                    {errors?.[`set_details[${idx}].rest_time`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].rest_time`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs">Effort%</label>
                    <Input
                      type="number"
                      value={set.effort || ''}
                      onChange={e => updateSetDetail(idx, 'effort', e.target.value)}
                      className={errors?.[`set_details[${idx}].effort`] ? "border-red-500" : ""}
                    />
                    {errors?.[`set_details[${idx}].effort`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].effort`]}</p>}
                  </div>
                </>
              ) : (
                // group mode: distance/time
                <>
                  <div>
                    <label className="block text-xs">Distance</label>
                    <Input
                      type="text"
                      value={set.distance || ''}
                      onChange={e => updateSetDetail(idx, 'distance', e.target.value)}
                      className={errors?.[`set_details[${idx}].distance`] ? "border-red-500" : ""}
                    />
                    {errors?.[`set_details[${idx}].distance`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].distance`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs">Time (s)</label>
                    <Input
                      type="text"
                      value={set.performing_time || ''}
                      onChange={e => updateSetDetail(idx, 'performing_time', e.target.value)}
                      className={errors?.[`set_details[${idx}].performing_time`] ? "border-red-500" : ""}
                    />
                    {errors?.[`set_details[${idx}].performing_time`] && <p className="text-xs text-red-500 mt-1">{errors[`set_details[${idx}].performing_time`]}</p>}
                  </div>
                </>
              )}
              <div className="col-span-full">
                 <ExerciseDetailFields
                    exercise={set}
                    isSetDetail={true}
                    mode={mode}
                    setIndex={idx}
                    onChange={(details) => {
                        for (const [key, val] of Object.entries(details)) {
                            updateSetDetail(idx, key, val)
                        }
                    }}
                    errors={errors}
                  />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={onAddSet} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Set
          </Button>
        </div>
      )}
    </div>
  )
} 