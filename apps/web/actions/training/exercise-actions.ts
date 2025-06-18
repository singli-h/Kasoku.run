/*
<ai_context>
Server actions for exercise library management and exercise presets.
Handles exercise CRUD operations, exercise types, and preset group management.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Exercise, ExerciseInsert, ExerciseUpdate,
  ExerciseType,
  Tag, Unit,
  ExercisePresetGroup, ExercisePresetGroupInsert, ExercisePresetGroupUpdate,
  ExercisePreset, ExercisePresetInsert, ExercisePresetUpdate,
  ExercisePresetDetail,
  ExerciseWithDetails,
  ExercisePresetGroupWithDetails,
  CreateSessionForm,
  ExerciseFilters
} from "@/types/training"

// ============================================================================
// EXERCISE LIBRARY ACTIONS
// ============================================================================

/**
 * Get all exercises with optional filtering
 */
export async function getExercisesAction(filters?: ExerciseFilters): Promise<ActionState<ExerciseWithDetails[]>> {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('exercises')
      .select(`
        *,
        exercise_type:exercise_types(*),
        unit:units(*),
        tags:exercise_tags(
          tag:tags(*)
        )
      `)

    // Apply filters
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.exercise_type_id) {
      query = query.eq('exercise_type_id', filters.exercise_type_id)
    }

    if (filters?.unit_id) {
      query = query.eq('unit_id', filters.unit_id)
    }

    // Note: tag filtering would require a more complex query with joins
    
    const { data: exercises, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching exercises:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch exercises: ${error.message}`
      }
    }

    // Transform the data to match our expected interface
    const transformedExercises = exercises?.map(exercise => ({
      ...exercise,
      tags: exercise.tags?.map((tag: any) => tag.tag) || []
    })) || []

    return {
      isSuccess: true,
      message: "Exercises retrieved successfully",
      data: transformedExercises
    }
  } catch (error) {
    console.error('Error in getExercisesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get exercises by tag IDs
 */
export async function getExercisesByTagsAction(tagIds: number[]): Promise<ActionState<ExerciseWithDetails[]>> {
  try {
    const supabase = createServerSupabaseClient()

    // Use a more complex query to filter by tags
    const { data: exerciseTagsData, error: tagsError } = await supabase
      .from('exercise_tags')
      .select('exercise_id')
      .in('tag_id', tagIds)

    if (tagsError) {
      console.error('Error fetching exercise tags:', tagsError)
      return {
        isSuccess: false,
        message: `Failed to fetch exercises by tags: ${tagsError.message}`
      }
    }

    const exerciseIds = exerciseTagsData?.map(et => et.exercise_id).filter((id): id is number => id !== null) || []

    if (exerciseIds.length === 0) {
      return {
        isSuccess: true,
        message: "No exercises found with the specified tags",
        data: []
      }
    }

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_type:exercise_types(*),
        unit:units(*),
        tags:exercise_tags(
          tag:tags(*)
        )
      `)
      .in('id', exerciseIds)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching exercises:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch exercises: ${error.message}`
      }
    }

    // Transform the data to match our expected interface
    const transformedExercises = exercises?.map(exercise => ({
      ...exercise,
      tags: exercise.tags?.map((tag: any) => tag.tag) || []
    })) || []

    return {
      isSuccess: true,
      message: "Exercises retrieved successfully",
      data: transformedExercises
    }
  } catch (error) {
    console.error('Error in getExercisesByTagsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific exercise by ID
 */
export async function getExerciseByIdAction(id: number): Promise<ActionState<ExerciseWithDetails>> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_type:exercise_types(*),
        unit:units(*),
        tags:exercise_tags(
          tag:tags(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching exercise:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Exercise not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch exercise: ${error.message}`
      }
    }

    // Transform the data to match our expected interface
    const transformedExercise = {
      ...exercise,
      tags: exercise.tags?.map((tag: any) => tag.tag) || []
    }

    return {
      isSuccess: true,
      message: "Exercise retrieved successfully",
      data: transformedExercise
    }
  } catch (error) {
    console.error('Error in getExerciseByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new exercise
 */
export async function createExerciseAction(
  exerciseData: ExerciseInsert
): Promise<ActionState<Exercise>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert(exerciseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating exercise:', error)
      return {
        isSuccess: false,
        message: `Failed to create exercise: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise created successfully",
      data: exercise
    }
  } catch (error) {
    console.error('Error in createExerciseAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update an existing exercise
 */
export async function updateExerciseAction(
  id: number,
  updates: Partial<ExerciseUpdate>
): Promise<ActionState<Exercise>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: exercise, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exercise:', error)
      return {
        isSuccess: false,
        message: `Failed to update exercise: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise updated successfully",
      data: exercise
    }
  } catch (error) {
    console.error('Error in updateExerciseAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete an exercise
 */
export async function deleteExerciseAction(id: number): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // First, remove any tag associations
    await supabase
      .from('exercise_tags')
      .delete()
      .eq('exercise_id', id)

    // Then delete the exercise
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting exercise:', error)
      return {
        isSuccess: false,
        message: `Failed to delete exercise: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteExerciseAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EXERCISE TYPE ACTIONS
// ============================================================================

/**
 * Get all exercise types
 */
export async function getExerciseTypesAction(): Promise<ActionState<ExerciseType[]>> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: exerciseTypes, error } = await supabase
      .from('exercise_types')
      .select('*')
      .order('type', { ascending: true })

    if (error) {
      console.error('Error fetching exercise types:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch exercise types: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise types retrieved successfully",
      data: exerciseTypes || []
    }
  } catch (error) {
    console.error('Error in getExerciseTypesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new exercise type
 */
export async function createExerciseTypeAction(
  type: string,
  description?: string
): Promise<ActionState<ExerciseType>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: exerciseType, error } = await supabase
      .from('exercise_types')
      .insert({ type, description })
      .select()
      .single()

    if (error) {
      console.error('Error creating exercise type:', error)
      return {
        isSuccess: false,
        message: `Failed to create exercise type: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise type created successfully",
      data: exerciseType
    }
  } catch (error) {
    console.error('Error in createExerciseTypeAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// TAG MANAGEMENT ACTIONS
// ============================================================================

/**
 * Get all tags
 */
export async function getTagsAction(): Promise<ActionState<Tag[]>> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch tags: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Tags retrieved successfully",
      data: tags || []
    }
  } catch (error) {
    console.error('Error in getTagsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new tag
 */
export async function createTagAction(name: string): Promise<ActionState<Tag>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ name })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return {
        isSuccess: false,
        message: `Failed to create tag: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Tag created successfully",
      data: tag
    }
  } catch (error) {
    console.error('Error in createTagAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Add tags to an exercise
 */
export async function addTagsToExerciseAction(
  exerciseId: number,
  tagIds: number[]
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Create the exercise-tag relationships
    const exerciseTagData = tagIds.map(tagId => ({
      exercise_id: exerciseId,
      tag_id: tagId
    }))

    const { error } = await supabase
      .from('exercise_tags')
      .insert(exerciseTagData)

    if (error) {
      console.error('Error adding tags to exercise:', error)
      return {
        isSuccess: false,
        message: `Failed to add tags to exercise: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Tags added to exercise successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in addTagsToExerciseAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Remove tags from an exercise
 */
export async function removeTagsFromExerciseAction(
  exerciseId: number,
  tagIds: number[]
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('exercise_tags')
      .delete()
      .eq('exercise_id', exerciseId)
      .in('tag_id', tagIds)

    if (error) {
      console.error('Error removing tags from exercise:', error)
      return {
        isSuccess: false,
        message: `Failed to remove tags from exercise: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Tags removed from exercise successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in removeTagsFromExerciseAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// UNIT MANAGEMENT ACTIONS
// ============================================================================

/**
 * Get all units
 */
export async function getUnitsAction(): Promise<ActionState<Unit[]>> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: units, error } = await supabase
      .from('units')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching units:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch units: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Units retrieved successfully",
      data: units || []
    }
  } catch (error) {
    console.error('Error in getUnitsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new unit
 */
export async function createUnitAction(
  name: string,
  description?: string
): Promise<ActionState<Unit>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: unit, error } = await supabase
      .from('units')
      .insert({ name, description })
      .select()
      .single()

    if (error) {
      console.error('Error creating unit:', error)
      return {
        isSuccess: false,
        message: `Failed to create unit: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Unit created successfully",
      data: unit
    }
  } catch (error) {
    console.error('Error in createUnitAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EXERCISE IMPORT/EXPORT ACTIONS
// ============================================================================

/**
 * Export exercises to JSON format
 */
export async function exportExercisesAction(): Promise<ActionState<any>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_type:exercise_types(*),
        unit:units(*),
        tags:exercise_tags(
          tag:tags(*)
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error exporting exercises:', error)
      return {
        isSuccess: false,
        message: `Failed to export exercises: ${error.message}`
      }
    }

    // Transform the data for export
    const exportData = {
      exercises: exercises?.map(exercise => ({
        ...exercise,
        tags: exercise.tags?.map((tag: any) => tag.tag) || []
      })) || [],
      exported_at: new Date().toISOString(),
      version: "1.0"
    }

    return {
      isSuccess: true,
      message: "Exercises exported successfully",
      data: exportData
    }
  } catch (error) {
    console.error('Error in exportExercisesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Import exercises from JSON format
 */
export async function importExercisesAction(
  exercisesData: any[]
): Promise<ActionState<{ imported: number; errors: string[] }>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    let imported = 0
    const errors: string[] = []

    for (const exerciseData of exercisesData) {
      try {
        // Extract the exercise data without tags
        const { tags, ...exerciseFields } = exerciseData
        
        // Create the exercise
        const { data: exercise, error: exerciseError } = await supabase
          .from('exercises')
          .insert(exerciseFields)
          .select()
          .single()

        if (exerciseError) {
          errors.push(`Failed to import exercise "${exerciseData.name}": ${exerciseError.message}`)
          continue
        }

        // Add tags if they exist
        if (tags && tags.length > 0 && exercise) {
          for (const tag of tags) {
            // First, ensure the tag exists
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tag.name)
              .single()

            let tagId = existingTag?.id

            if (!tagId) {
              // Create the tag if it doesn't exist
              const { data: newTag, error: tagError } = await supabase
                .from('tags')
                .insert({ name: tag.name })
                .select('id')
                .single()

              if (tagError) {
                errors.push(`Failed to create tag "${tag.name}" for exercise "${exerciseData.name}": ${tagError.message}`)
                continue
              }
              
              tagId = newTag?.id
            }

            if (tagId) {
              // Create the exercise-tag relationship
              await supabase
                .from('exercise_tags')
                .insert({
                  exercise_id: exercise.id,
                  tag_id: tagId
                })
            }
          }
        }

        imported++
      } catch (error) {
        errors.push(`Failed to import exercise "${exerciseData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      isSuccess: true,
      message: `Import completed: ${imported} exercises imported${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      data: { imported, errors }
    }
  } catch (error) {
    console.error('Error in importExercisesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EXERCISE PRESET GROUP ACTIONS (Training Sessions)
// ============================================================================

/**
 * Create a new exercise preset group (training session)
 */
export async function createExercisePresetGroupAction(
  sessionData: CreateSessionForm,
  microcycleId?: number,
  athleteGroupId?: number
): Promise<ActionState<ExercisePresetGroup>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const presetGroupData: ExercisePresetGroupInsert = {
      name: sessionData.name,
      description: sessionData.description || null,
      date: sessionData.date,
      session_mode: sessionData.session_mode,
      week: sessionData.week,
      day: sessionData.day,
      microcycle_id: microcycleId || null,
      athlete_group_id: athleteGroupId || null,
      user_id: user.id
    }

    const { data: presetGroup, error } = await supabase
      .from('exercise_preset_groups')
      .insert(presetGroupData)
      .select()
      .single()

    if (error) {
      console.error('Error creating exercise preset group:', error)
      return {
        isSuccess: false,
        message: `Failed to create training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session created successfully",
      data: presetGroup
    }
  } catch (error) {
    console.error('Error in createExercisePresetGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get exercise preset groups for a specific microcycle
 */
export async function getExercisePresetGroupsByMicrocycleAction(
  microcycleId: number
): Promise<ActionState<ExercisePresetGroupWithDetails[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const { data: presetGroups, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        microcycle:microcycles(*),
        athlete_group:athlete_groups(*),
        exercise_presets(
          *,
          exercise:exercises(
            *,
            exercise_type:exercise_types(*),
            unit:units(*)
          ),
          exercise_preset_details(*)
        )
      `)
      .eq('microcycle_id', microcycleId)
      .eq('user_id', user.id)
      .order('day', { ascending: true })

    if (error) {
      console.error('Error fetching exercise preset groups:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch training sessions: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training sessions retrieved successfully",
      data: presetGroups || []
    }
  } catch (error) {
    console.error('Error in getExercisePresetGroupsByMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific exercise preset group with all details
 */
export async function getExercisePresetGroupByIdAction(
  id: number
): Promise<ActionState<ExercisePresetGroupWithDetails>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const { data: presetGroup, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        microcycle:microcycles(*),
        athlete_group:athlete_groups(*),
        exercise_presets(
          *,
          exercise:exercises(
            *,
            exercise_type:exercise_types(*),
            unit:units(*)
          ),
          exercise_preset_details(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching exercise preset group:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Training session not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session retrieved successfully",
      data: presetGroup
    }
  } catch (error) {
    console.error('Error in getExercisePresetGroupByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Add an exercise to a preset group
 */
export async function addExerciseToPresetGroupAction(
  presetGroupId: number,
  exerciseId: number,
  presetOrder: number,
  notes?: string,
  supersetId?: number
): Promise<ActionState<ExercisePreset>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const presetData: ExercisePresetInsert = {
      exercise_preset_group_id: presetGroupId,
      exercise_id: exerciseId,
      preset_order: presetOrder,
      notes: notes || null,
      superset_id: supersetId || null
    }

    const { data: preset, error } = await supabase
      .from('exercise_presets')
      .insert(presetData)
      .select()
      .single()

    if (error) {
      console.error('Error adding exercise to preset group:', error)
      return {
        isSuccess: false,
        message: `Failed to add exercise to training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise added to training session successfully",
      data: preset
    }
  } catch (error) {
    console.error('Error in addExerciseToPresetGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update an exercise preset group
 */
export async function updateExercisePresetGroupAction(
  id: number,
  updates: Partial<ExercisePresetGroupUpdate>
): Promise<ActionState<ExercisePresetGroup>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const { data: presetGroup, error } = await supabase
      .from('exercise_preset_groups')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exercise preset group:', error)
      return {
        isSuccess: false,
        message: `Failed to update training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session updated successfully",
      data: presetGroup
    }
  } catch (error) {
    console.error('Error in updateExercisePresetGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete an exercise preset group
 */
export async function deleteExercisePresetGroupAction(id: number): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const { error } = await supabase
      .from('exercise_preset_groups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting exercise preset group:', error)
      return {
        isSuccess: false,
        message: `Failed to delete training session: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Training session deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteExercisePresetGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EXERCISE PRESET DETAIL ACTIONS
// ============================================================================

/**
 * Add exercise preset details (sets/reps specifications) to an exercise preset
 */
export async function addExercisePresetDetailsAction(
  presetId: number,
  details: ExercisePresetDetail[]
): Promise<ActionState<ExercisePresetDetail[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Prepare the details data for insertion
    const detailsData = details.map((detail, index) => ({
      exercise_preset_id: presetId,
      set_index: detail.set_index || index + 1,
      reps: detail.reps,
      weight: detail.weight,
      distance: detail.distance,
      performing_time: detail.performing_time,
      rest_time: detail.rest_time,
      rpe: detail.rpe,
      effort: detail.effort,
      power: detail.power,
      velocity: detail.velocity,
      resistance: detail.resistance,
      resistance_unit_id: detail.resistance_unit_id,
      height: detail.height,
      tempo: detail.tempo,
      metadata: detail.metadata
    }))

    const { data: insertedDetails, error } = await supabase
      .from('exercise_preset_details')
      .insert(detailsData)
      .select()

    if (error) {
      console.error('Error adding exercise preset details:', error)
      return {
        isSuccess: false,
        message: `Failed to add preset details: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise preset details added successfully",
      data: insertedDetails || []
    }
  } catch (error) {
    console.error('Error in addExercisePresetDetailsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update exercise preset details
 */
export async function updateExercisePresetDetailsAction(
  detailId: number,
  updates: Partial<ExercisePresetDetail>
): Promise<ActionState<ExercisePresetDetail>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { data: detail, error } = await supabase
      .from('exercise_preset_details')
      .update(updates)
      .eq('id', detailId)
      .select()
      .single()

    if (error) {
      console.error('Error updating exercise preset detail:', error)
      return {
        isSuccess: false,
        message: `Failed to update preset detail: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise preset detail updated successfully",
      data: detail
    }
  } catch (error) {
    console.error('Error in updateExercisePresetDetailsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Remove exercise preset details
 */
export async function removeExercisePresetDetailsAction(
  presetId: number
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('exercise_preset_details')
      .delete()
      .eq('exercise_preset_id', presetId)

    if (error) {
      console.error('Error removing exercise preset details:', error)
      return {
        isSuccess: false,
        message: `Failed to remove preset details: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Exercise preset details removed successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in removeExercisePresetDetailsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// SESSION PROGRESSION AND ADAPTATION ACTIONS
// ============================================================================

/**
 * Apply automatic progression to exercise preset details based on performance
 */
export async function applyProgressionToPresetAction(
  presetId: number,
  progressionType: 'weight' | 'reps' | 'volume',
  progressionValue: number,
  targetSets?: number[]
): Promise<ActionState<ExercisePresetDetail[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get existing preset details
    const { data: details, error: fetchError } = await supabase
      .from('exercise_preset_details')
      .select('*')
      .eq('exercise_preset_id', presetId)
      .order('set_index', { ascending: true })

    if (fetchError || !details) {
      return {
        isSuccess: false,
        message: `Failed to fetch preset details: ${fetchError?.message}`
      }
    }

    // Apply progression to each set (or specific sets if targetSets provided)
    const updatedDetails = details.map((detail, index) => {
      const shouldUpdate = !targetSets || targetSets.includes(detail.set_index || index + 1)
      
      if (!shouldUpdate) return detail

      const updates: Partial<ExercisePresetDetail> = {}

      switch (progressionType) {
        case 'weight':
          if (detail.weight) {
            updates.weight = Number((detail.weight + progressionValue).toFixed(2))
          }
          break
        case 'reps':
          if (detail.reps) {
            updates.reps = Math.max(1, detail.reps + progressionValue)
          }
          break
        case 'volume':
          // Increase both weight and reps proportionally
          if (detail.weight && detail.reps) {
            const volumeIncrease = progressionValue / 100 // percentage increase
            updates.weight = Number((detail.weight * (1 + volumeIncrease)).toFixed(2))
            updates.reps = Math.max(1, Math.round(detail.reps * (1 + volumeIncrease)))
          }
          break
      }

      return { ...detail, ...updates }
    })

    // Update each detail in the database
    const updatePromises = updatedDetails.map(detail => 
      supabase
        .from('exercise_preset_details')
        .update({
          reps: detail.reps,
          weight: detail.weight,
          distance: detail.distance,
          performing_time: detail.performing_time,
          rest_time: detail.rest_time,
          rpe: detail.rpe,
          effort: detail.effort,
          power: detail.power,
          velocity: detail.velocity,
          resistance: detail.resistance,
          height: detail.height,
          tempo: detail.tempo,
          metadata: detail.metadata
        })
        .eq('id', detail.id)
        .select()
        .single()
    )

    const results = await Promise.all(updatePromises)
    
    // Check for any errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Errors during progression update:', errors)
      return {
        isSuccess: false,
        message: `Failed to apply progression: ${errors[0].error?.message}`
      }
    }

    const updatedData = results.map(result => result.data).filter((data): data is NonNullable<typeof data> => data !== null)

    return {
      isSuccess: true,
      message: `${progressionType} progression applied successfully`,
      data: updatedData
    }
  } catch (error) {
    console.error('Error in applyProgressionToPresetAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Copy a session template with automatic adaptations
 */
export async function copySessionWithAdaptationsAction(
  originalSessionId: number,
  newDate: string,
  adaptations?: {
    weightIncrease?: number
    repIncrease?: number
    volumeIncrease?: number
    restTimeDecrease?: number
  }
): Promise<ActionState<ExercisePresetGroup>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Get the original session with all its details
    const { data: originalSession, error: fetchError } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        exercise_presets(
          *,
          exercise:exercises(*),
          exercise_preset_details(*)
        )
      `)
      .eq('id', originalSessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !originalSession) {
      return {
        isSuccess: false,
        message: "Original session not found"
      }
    }

    // Create new session
    const newSessionData = {
      name: `${originalSession.name} (Adapted)`,
      description: originalSession.description,
      date: newDate,
      session_mode: originalSession.session_mode,
      week: originalSession.week,
      day: originalSession.day,
      microcycle_id: originalSession.microcycle_id,
      athlete_group_id: originalSession.athlete_group_id,
      user_id: user.id
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('exercise_preset_groups')
      .insert(newSessionData)
      .select()
      .single()

    if (sessionError || !newSession) {
      return {
        isSuccess: false,
        message: `Failed to create new session: ${sessionError?.message}`
      }
    }

    // Copy and adapt exercise presets
    if (originalSession.exercise_presets && originalSession.exercise_presets.length > 0) {
      for (const preset of originalSession.exercise_presets) {
        // Create new preset
        const newPresetData = {
          exercise_id: preset.exercise_id,
          exercise_preset_group_id: newSession.id,
          preset_order: preset.preset_order,
          notes: preset.notes,
          superset_id: preset.superset_id
        }

        const { data: newPreset, error: presetError } = await supabase
          .from('exercise_presets')
          .insert(newPresetData)
          .select()
          .single()

        if (presetError || !newPreset) {
          console.error('Error copying preset:', presetError)
          continue
        }

        // Copy and adapt preset details
        if (preset.exercise_preset_details && preset.exercise_preset_details.length > 0) {
                     const adaptedDetails = preset.exercise_preset_details.map(detail => {
             const adaptedDetail = { ...detail }
            
            // Apply adaptations
            if (adaptations?.weightIncrease && detail.weight) {
              adaptedDetail.weight = Number((detail.weight + adaptations.weightIncrease).toFixed(2))
            }
            
            if (adaptations?.repIncrease && detail.reps) {
              adaptedDetail.reps = detail.reps + adaptations.repIncrease
            }
            
            if (adaptations?.volumeIncrease && detail.weight && detail.reps) {
              const volumeMultiplier = 1 + (adaptations.volumeIncrease / 100)
              adaptedDetail.weight = Number((detail.weight * volumeMultiplier).toFixed(2))
              adaptedDetail.reps = Math.round(detail.reps * volumeMultiplier)
            }
            
            if (adaptations?.restTimeDecrease && detail.rest_time) {
              adaptedDetail.rest_time = Math.max(30, detail.rest_time - adaptations.restTimeDecrease)
            }

            return {
              exercise_preset_id: newPreset.id,
              set_index: adaptedDetail.set_index,
              reps: adaptedDetail.reps,
              weight: adaptedDetail.weight,
              distance: adaptedDetail.distance,
              performing_time: adaptedDetail.performing_time,
              rest_time: adaptedDetail.rest_time,
              rpe: adaptedDetail.rpe,
              effort: adaptedDetail.effort,
              power: adaptedDetail.power,
              velocity: adaptedDetail.velocity,
              resistance: adaptedDetail.resistance,
              resistance_unit_id: adaptedDetail.resistance_unit_id,
              height: adaptedDetail.height,
              tempo: adaptedDetail.tempo,
              metadata: adaptedDetail.metadata
            }
          })

          await supabase
            .from('exercise_preset_details')
            .insert(adaptedDetails)
        }
      }
    }

    return {
      isSuccess: true,
      message: "Session copied with adaptations successfully",
      data: newSession
    }
  } catch (error) {
    console.error('Error in copySessionWithAdaptationsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// SESSION COMPLETION AND FEEDBACK ACTIONS
// ============================================================================

/**
 * Get session count analytics for a user
 */
export async function getSessionCountAnalyticsAction(
  timeRange?: {
    start_date: string
    end_date: string
  }
): Promise<ActionState<{
  total_sessions: number
  sessions_by_week: { [week: number]: number }
  sessions_by_day: { [day: number]: number }
}>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    let query = supabase
      .from('exercise_preset_groups')
      .select('week, day, date')
      .eq('user_id', user.id)

    // Apply time range filter if provided
    if (timeRange) {
      query = query
        .gte('date', timeRange.start_date)
        .lte('date', timeRange.end_date)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching session analytics:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch analytics: ${error.message}`
      }
    }

    // Calculate analytics
    const total_sessions = sessions?.length || 0
    
    const sessions_by_week: { [week: number]: number } = {}
    const sessions_by_day: { [day: number]: number } = {}

    sessions?.forEach(session => {
      if (session.week) {
        sessions_by_week[session.week] = (sessions_by_week[session.week] || 0) + 1
      }
      if (session.day) {
        sessions_by_day[session.day] = (sessions_by_day[session.day] || 0) + 1
      }
    })

    const analytics = {
      total_sessions,
      sessions_by_week,
      sessions_by_day
    }

    return {
      isSuccess: true,
      message: "Session analytics retrieved successfully",
      data: analytics
    }
  } catch (error) {
    console.error('Error in getSessionCountAnalyticsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 