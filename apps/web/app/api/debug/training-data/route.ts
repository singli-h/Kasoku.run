/*
<ai_context>
Debug API endpoint to check training plan data and connections.
Access at: /api/debug/training-data

This endpoint helps troubleshoot FE/BE connection issues by:
1. Checking Clerk authentication
2. Verifying user ID mapping
3. Testing backend actions
4. Reporting data availability

SECURITY: Remove this endpoint in production or add authentication!
</ai_context>
*/

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import { getMacrocyclesAction } from '@/actions/plans/plan-actions'
import { getRacesAction } from '@/actions/plans/race-actions'
import supabase from '@/lib/supabase-server'

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    // =========================================================================
    // CHECK 1: Clerk Authentication
    // =========================================================================
    debugInfo.checks.clerkAuth = { status: 'checking' }

    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      debugInfo.checks.clerkAuth = {
        status: 'FAILED',
        error: 'Not authenticated - no Clerk user ID',
        message: 'You need to be logged in to access training plans'
      }
      return NextResponse.json(debugInfo, { status: 401 })
    }

    debugInfo.checks.clerkAuth = {
      status: 'PASSED',
      clerkUserId,
      message: 'Clerk authentication successful'
    }

    // =========================================================================
    // CHECK 2: Database User ID Mapping
    // =========================================================================
    debugInfo.checks.userMapping = { status: 'checking' }

    try {
      const dbUserId = await getDbUserId(clerkUserId)

      debugInfo.checks.userMapping = {
        status: 'PASSED',
        clerkUserId,
        dbUserId,
        message: 'User ID mapping successful'
      }

      // Store for later checks
      debugInfo.dbUserId = dbUserId

    } catch (error) {
      debugInfo.checks.userMapping = {
        status: 'FAILED',
        clerkUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to map Clerk user ID to database user ID. User may not exist in database.',
        fix: 'Ensure user is created in users table with clerk_id matching Clerk user ID'
      }
      return NextResponse.json(debugInfo, { status: 500 })
    }

    // =========================================================================
    // CHECK 3: Direct Database Query (Bypass Actions)
    // =========================================================================
    debugInfo.checks.directQuery = { status: 'checking' }

    try {
      const { data: macrocycles, error } = await supabase
        .from('macrocycles')
        .select('id, name, user_id, created_at')
        .eq('user_id', debugInfo.dbUserId)

      if (error) {
        debugInfo.checks.directQuery = {
          status: 'FAILED',
          error: error.message,
          message: 'Database query failed',
          details: error
        }
      } else {
        debugInfo.checks.directQuery = {
          status: 'PASSED',
          rowCount: macrocycles?.length || 0,
          message: `Found ${macrocycles?.length || 0} macrocycles for user_id ${debugInfo.dbUserId}`,
          data: macrocycles
        }
      }
    } catch (error) {
      debugInfo.checks.directQuery = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // =========================================================================
    // CHECK 4: Backend Actions
    // =========================================================================
    debugInfo.checks.backendActions = { status: 'checking' }

    try {
      const macrocyclesResult = await getMacrocyclesAction()
      const racesResult = await getRacesAction()

      debugInfo.checks.backendActions = {
        status: macrocyclesResult.isSuccess ? 'PASSED' : 'FAILED',
        macrocycles: {
          success: macrocyclesResult.isSuccess,
          count: macrocyclesResult.data?.length || 0,
          message: macrocyclesResult.message,
          data: macrocyclesResult.data
        },
        races: {
          success: racesResult.isSuccess,
          count: racesResult.data?.length || 0,
          message: racesResult.message,
          data: racesResult.data
        }
      }
    } catch (error) {
      debugInfo.checks.backendActions = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }

    // =========================================================================
    // CHECK 5: RLS Policies
    // =========================================================================
    debugInfo.checks.rlsPolicies = { status: 'checking' }

    try {
      // Try to query with different user_id to test RLS
      const { data: otherUserData, error } = await supabase
        .from('macrocycles')
        .select('id')
        .eq('user_id', 999999) // Non-existent user

      debugInfo.checks.rlsPolicies = {
        status: 'INFO',
        message: 'RLS is enforced by Supabase based on JWT token',
        note: 'If you can see other users\' data, RLS may not be properly configured',
        otherUserDataCount: otherUserData?.length || 0,
        warning: (otherUserData?.length || 0) > 0 ? 'WARNING: Can see other users\' data!' : undefined
      }
    } catch (error) {
      debugInfo.checks.rlsPolicies = {
        status: 'INFO',
        message: 'Could not test RLS (expected behavior with proper RLS setup)'
      }
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    const allPassed = Object.values(debugInfo.checks).every(
      (check: any) => check.status === 'PASSED' || check.status === 'INFO'
    )

    debugInfo.summary = {
      overallStatus: allPassed ? 'HEALTHY' : 'ISSUES_DETECTED',
      recommendations: []
    }

    // Add recommendations based on results
    if (debugInfo.checks.directQuery?.rowCount === 0) {
      debugInfo.summary.recommendations.push({
        issue: 'No training plans found in database',
        fix: 'Run the seed script: apps/web/scripts/seed-training-plans.sql',
        script: 'See SETUP_TRAINING_PLANS.md for instructions'
      })
    }

    if (debugInfo.checks.backendActions?.macrocycles?.count === 0) {
      debugInfo.summary.recommendations.push({
        issue: 'Backend actions returning no data',
        possibleCauses: [
          'RLS policies blocking access',
          'User ID mismatch',
          'No data in database'
        ],
        fix: 'Check RLS policies and verify user_id matches between Clerk and database'
      })
    }

    return NextResponse.json(debugInfo, {
      status: allPassed ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
