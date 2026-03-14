/**
 * Athlete Profile Page
 *
 * Displays a detailed view of an athlete's profile using the HolographicProfileCard
 * Includes permission checking to ensure only authorized users can view
 */

"use server"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, ClipboardList } from "lucide-react"

import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAthleteProfileAction, type ProfileViewData } from "@/actions/profile/profile-actions"
import { HolographicProfileCard, type ProfileCardData } from "@/components/features/profile"
import supabase from "@/lib/supabase-server"

interface AthleteProfilePageProps {
  params: Promise<{ id: string }>
}

/**
 * Transform ProfileViewData to ProfileCardData for the HolographicProfileCard
 */
function transformToCardData(profile: ProfileViewData): ProfileCardData {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username || undefined,
    avatarUrl: profile.avatarUrl,
    role: profile.role as 'athlete' | 'coach' | 'individual',
    birthdate: profile.birthdate,
    sex: profile.sex,
    timezone: profile.timezone,
    joinDate: profile.joinDate,
    height: profile.height,
    weight: profile.weight,
    experience: profile.experience as 'beginner' | 'intermediate' | 'advanced' | 'elite' | null,
    events: profile.events || undefined,
    trainingGoals: profile.trainingGoals,
    groupName: profile.groupName || undefined,
    // Athletes and individuals both have athlete stats (individuals have silent athlete records)
    athleteStats: (profile.role === 'athlete' || profile.role === 'individual') ? {
      totalWorkouts: profile.stats.totalWorkouts,
      weeklyStreak: profile.stats.weeklyStreak,
      personalRecords: profile.stats.personalRecords,
      completionRate: profile.stats.completionRate
    } : undefined,
    speciality: profile.speciality,
    sportFocus: profile.sportFocus,
    philosophy: profile.philosophy,
    coachExperience: profile.coachExperience,
    coachStats: profile.role === 'coach' ? {
      athletesCoached: profile.stats.athletesCoached,
      yearsExperience: profile.stats.yearsExperience,
      programsCreated: profile.stats.programsCreated
    } : undefined
  }
}

async function AthleteProfileContent({ athleteId }: { athleteId: number }) {
  const result = await getAthleteProfileAction(athleteId)

  if (!result.isSuccess || !result.data) {
    if (result.message.includes("permission")) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view this athlete's profile.
                Only coaches and teammates can view profiles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/athletes">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Athletes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    notFound()
  }

  const profile = result.data
  const cardData = transformToCardData(profile)

  // Fetch assigned plan via athlete's group
  let planName: string | null = null
  let currentWeek = 0
  let totalWeeks = 0
  let completionRate = 0

  if (profile.groupId) {
    // Get the most recent macrocycle assigned to this athlete's group
    const { data: macrocycle } = await supabase
      .from('macrocycles')
      .select(`
        id,
        name,
        mesocycles (
          id,
          microcycles (
            id,
            start_date,
            end_date
          )
        )
      `)
      .eq('athlete_group_id', profile.groupId)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (macrocycle) {
      planName = macrocycle.name || 'Training Plan'

      const allMicrocycles = (macrocycle.mesocycles ?? [])
        .flatMap(meso => meso.microcycles ?? [])
        .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))

      totalWeeks = allMicrocycles.length
      const today = new Date().toISOString().split('T')[0]
      let weekIndex = 0
      for (let i = 0; i < allMicrocycles.length; i++) {
        const micro = allMicrocycles[i]
        if (micro.start_date && micro.end_date) {
          if (today >= micro.start_date && today <= micro.end_date) {
            weekIndex = i
            break
          }
          if (today > micro.end_date) {
            weekIndex = i + 1
          }
        }
      }
      currentWeek = Math.min(Math.max(weekIndex + 1, 1), totalWeeks)
    }

    // Compute completion rate from workout_logs for this athlete
    const { data: athleteRecord } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .single()

    if (athleteRecord) {
      const { count: completedCount } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', athleteRecord.id)
        .eq('session_status', 'completed')

      const { count: totalCount } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', athleteRecord.id)
        .in('session_status', ['completed', 'assigned', 'ongoing'])

      if (totalCount && totalCount > 0) {
        completionRate = Math.round(((completedCount ?? 0) / totalCount) * 100)
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/athletes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Athletes
          </Button>
        </Link>
        {profile.groupName && (
          <Badge variant="outline">{profile.groupName}</Badge>
        )}
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 flex justify-center lg:justify-start">
          <HolographicProfileCard
            profile={cardData}
            size="lg"
            interactive={true}
          />
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {profile.firstName} {profile.lastName}
                <Badge className="ml-2">
                  {profile.experience || 'Athlete'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {profile.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.height && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.height}</p>
                    <p className="text-xs text-muted-foreground">Height (cm)</p>
                  </div>
                )}
                {profile.weight && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.weight}</p>
                    <p className="text-xs text-muted-foreground">Weight (kg)</p>
                  </div>
                )}
                {profile.stats.totalWorkouts !== undefined && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.stats.totalWorkouts}</p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </div>
                )}
                {profile.stats.personalRecords !== undefined && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.stats.personalRecords}</p>
                    <p className="text-xs text-muted-foreground">PRs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events Card */}
          {profile.events && profile.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.events.map((event, index) => {
                    const e = event as unknown as { id?: number; name?: string } | string
                    const label = typeof e === 'string' ? e : e.name ?? ''
                    const key = typeof e === 'string' ? index : (e.id ?? index)
                    return (
                      <Badge key={key} variant="secondary" className="text-sm">
                        {label}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Goals Card */}
          {profile.trainingGoals && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{profile.trainingGoals}</p>
              </CardContent>
            </Card>
          )}

          {/* Plan Summary */}
          {planName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Training Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium truncate">{planName}</p>
                    <p className="text-xs text-muted-foreground">Plan</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{currentWeek}/{totalWeeks}</p>
                    <p className="text-xs text-muted-foreground">Current Week</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - hidden for now */}
        </div>
      </div>
    </div>
  )
}

export default async function AthleteProfilePage({ params }: AthleteProfilePageProps) {
  await serverProtectRoute({ allowedRoles: ['coach'] })
  const resolvedParams = await params
  const athleteId = parseInt(resolvedParams.id, 10)

  if (isNaN(athleteId)) {
    notFound()
  }

  return (
    <PageLayout
      title="Athlete Profile"
      description="View athlete details and training information"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Athlete Profile" variant="form" />}>
        <AthleteProfileContent athleteId={athleteId} />
      </Suspense>
    </PageLayout>
  )
}
