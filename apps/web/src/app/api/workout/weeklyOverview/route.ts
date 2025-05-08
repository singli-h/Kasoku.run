import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/workout/weeklyOverview
 * Returns mock weekly stats for the dashboard.
 * Only accessible to coaches.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const clerkId = authResult;

  try {
    // Verify the user is a coach
    let roleData = getRoleDataFromHeader(req)
  if (!roleData) roleData = await getUserRoleData(clerkId)
  const { role } = roleData;
    
    if (role !== 'coach') {
      return NextResponse.json(
        { status: 'error', message: 'Access forbidden: Coach role required' },
        { status: 403 }
      );
    }

    const mockWeeklyData = [
      { title: 'Training Volume', stat: '12,500 kg', progress: 75 },
      { title: 'Training Sessions', stat: '4/5', progress: 80 },
      { title: 'Calories Burned', stat: '3,621', progress: 65 },
      { title: 'Completed Exercises', stat: '24/28', progress: 85 }
    ];

    return NextResponse.json({ status: 'success', data: mockWeeklyData });
  } catch (error: any) {
    console.error('[API] Weekly overview error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
} 