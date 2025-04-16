import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const authResult = await auth();
  
  if (!authResult || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  try {
    if (type === 'exercises') {
      const exercises = await edgeFunctions.planner.getExercises();
      return NextResponse.json(exercises);
    } else if (type === 'mesocycle' && id) {
      const mesocycle = await edgeFunctions.planner.getMesocycle(id);
      return NextResponse.json(mesocycle);
    } else if (type === 'microcycle' && id) {
      const microcycle = await edgeFunctions.planner.getMicrocycle(id);
      return NextResponse.json(microcycle);
    } else {
      return NextResponse.json(
        { error: `Invalid request. Type '${type}' or ID '${id}' is invalid` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error(`Error in GET /api/planner/${type}:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST handler for /api/planner/[type] routes
 */
export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  const authResult = await auth();
  
  if (!authResult || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;
  const userId = authResult.userId;

  try {
    // Get the request data
    const requestData = await request.json();
    console.log(`[DEBUG] Received request data for ${type}:`, JSON.stringify(requestData));
    
    // Fetch the user profile to get the user role
    const userProfileResponse = await fetch(`/api/user-profile`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    if (!userProfileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: userProfileResponse.status }
      );
    }
    
    const userProfile = await userProfileResponse.json();
    
    // Check if the user has the coach role
    if (!userProfile.metadata || !userProfile.metadata.roles || !userProfile.metadata.roles.includes('coach')) {
      return NextResponse.json(
        { error: 'Only coaches can create plans' },
        { status: 403 }
      );
    }
    
    // Get coach ID from the coaches table
    const coachResponse = await fetch(`/api/coaches?clerk_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    if (!coachResponse.ok) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }
    
    const coaches = await coachResponse.json();
    
    if (!coaches.length) {
      return NextResponse.json(
        { error: 'Coach record not found' },
        { status: 404 }
      );
    }
    
    const coachId = coaches[0].id;
    
    if (type === 'mesocycle') {
      // Add coach_id and userRole to the request data
      const mesocycleData = {
        ...requestData,
        coach_id: coachId,
        userRole: 'coach' // For backward compatibility
      };
      
      const result = await edgeFunctions.planner.createMesocycle(mesocycleData);
      return NextResponse.json(result);
    } else if (type === 'microcycle') {
      // Handle different data formats from clients
      // The new format sends {microcycle: {...}, sessions: [...]}
      // The old format might send the data directly

      // Determine which format we're dealing with
      let microcycleData: any = {};
      let sessions: any[] = [];

      if (requestData.microcycle) {
        // New format with nested microcycle object
        const { microcycle, sessions: reqSessions = [] } = requestData;
        
        // Extract data from the microcycle object, preferring camelCase fields
        microcycleData = {
          name: microcycle.name,
          description: microcycle.description,
          startDate: microcycle.startDate || microcycle.start_date, // Backward compatibility
          endDate: microcycle.endDate || microcycle.end_date,       // Backward compatibility
          mesocycleId: microcycle.mesocycleId || microcycle.mesocycle_id, // Backward compatibility
          volume: microcycle.volume,
          intensity: microcycle.intensity,
          athleteGroupId: microcycle.athleteGroupId || microcycle.athlete_group_id, // Backward compatibility
          coach_id: coachId,
          userRole: 'coach' // For backward compatibility
        };
        
        // Log warning if snake_case fields are used
        if (microcycle.start_date || microcycle.end_date || microcycle.mesocycle_id || microcycle.athlete_group_id) {
          console.warn('[API Warning] snake_case field names are deprecated. Please use camelCase field names.');
        }
        
        sessions = reqSessions;
      } else {
        // Old format or direct data structure
        microcycleData = {
          name: requestData.name,
          description: requestData.description,
          startDate: requestData.startDate || requestData.start_date, // Backward compatibility
          endDate: requestData.endDate || requestData.end_date,      // Backward compatibility
          mesocycleId: requestData.mesocycleId || requestData.mesocycle_id, // Backward compatibility
          volume: requestData.volume,
          intensity: requestData.intensity,
          athleteGroupId: requestData.athleteGroupId || requestData.athlete_group_id, // Backward compatibility
          coach_id: coachId,
          userRole: 'coach' // For backward compatibility
        };
        
        // Log warning if snake_case fields are used
        if (requestData.start_date || requestData.end_date || requestData.mesocycle_id || requestData.athlete_group_id) {
          console.warn('[API Warning] snake_case field names are deprecated. Please use camelCase field names.');
        }
        
        sessions = requestData.sessions || [];
      }
      
      // Validate required fields
      if (!microcycleData.name || !microcycleData.startDate || !microcycleData.endDate) {
        return NextResponse.json(
          { error: 'Missing required fields. Name, start date, and end date are required.' },
          { status: 400 }
        );
      }
      
      // Add sessions to the microcycle data
      const formattedMicrocycleData = {
        ...microcycleData,
        sessions
      };
      
      console.log(`[DEBUG] Formatted microcycle data:`, JSON.stringify(formattedMicrocycleData));
      
      const result = await edgeFunctions.planner.createMicrocycle(formattedMicrocycleData);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: `Invalid plan type: ${type}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error(`Error in POST /api/planner/${type}:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: error.status || 500 }
    );
  }
} 