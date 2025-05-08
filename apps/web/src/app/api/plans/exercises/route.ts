import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/plans/exercises
 * 
 * Retrieves all exercises with their types for use in the planner.
 * This endpoint is accessible to all authenticated users.
 * 
 * @returns Response with all exercises and their types
 */
export async function GET() {
  try {
    // Authenticate the user
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const clerkId = auth;
    
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch exercises with their types
    const { data: exercises, error } = await supabase
      .from("exercises")
      .select(`
        *,
        exercise_types (
          id,
          type,
          description
        )
      `)
      .order('name');
    
    if (error) {
      console.error("[API] Error fetching exercises:", error);
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
    
    if (!exercises || exercises.length === 0) {
      console.log("[API] No exercises found");
      return NextResponse.json({ status: 'success', data: { exercises: [] } }, { status: 200 });
    }
    
    // Format exercises for frontend
    // Map exercise type values to match the expected format in the UI components:
    // "Gym" -> "gym", "Isometric" -> "isometric", etc.
    const formattedExercises = exercises.map(exercise => {
      // Get the type from the exercise_types relation and convert to lowercase
      const typeValue = exercise.exercise_types?.type || 'Gym';
      const normalizedType = typeValue.toLowerCase();
      
      return {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        videoUrl: exercise.video_url,
        // Use the normalized lowercase type to match what the UI components expect
        type: normalizedType
      };
    });
    
    return NextResponse.json({ 
      status: 'success', 
      data: { exercises: formattedExercises } 
    }, { status: 200 });
    
  } catch (error) {
    console.error("[API] Unexpected error in getExercisesForPlanner:", error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 