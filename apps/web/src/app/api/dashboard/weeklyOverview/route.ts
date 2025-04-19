import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/dashboard/weeklyOverview
 * Returns mock weekly stats for the dashboard.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const mockWeeklyData = [
    { title: 'Training Volume', stat: '12,500 kg', progress: 75 },
    { title: 'Training Sessions', stat: '4/5', progress: 80 },
    { title: 'Calories Burned', stat: '3,621', progress: 65 },
    { title: 'Completed Exercises', stat: '24/28', progress: 85 }
  ];

  return NextResponse.json({ status: 'success', data: mockWeeklyData });
} 