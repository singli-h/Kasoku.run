/**
 * Athlete Profile Page
 *
 * Displays a detailed view of an athlete's profile using the HolographicProfileCard
 * Includes permission checking to ensure only authorized users can view
 */

"use server"

import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, MessageSquare, Calendar } from "lucide-react"

import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAthleteProfileAction, type ProfileViewData } from "@/actions/profile/profile-actions"
import { HolographicProfileCard, type ProfileCardData } from "@/components/features/profile"

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
                  {profile.events.map((event, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {event}
                    </Badge>
                  ))}
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" disabled>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  View Group
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These features are coming soon
              </p>
            </CardContent>
          </Card>
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
