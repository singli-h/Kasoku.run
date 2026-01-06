"use server"

import { Suspense } from "react"
import { PlansHome, IndividualPlansHome } from "@/components/features/plans"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { getUserRoleAction } from "@/actions/auth/auth-helpers"
import type { UserRole } from "@/contexts/user-role-context"

export default async function PlansPage() {
  // Protect this page - only coaches and individuals can access
  await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })

  // Get user role to determine which view to show
  const roleResult = await getUserRoleAction()
  const roleString = roleResult.isSuccess ? roleResult.data : null
  const role = roleString as UserRole | null
  const isIndividual = role === 'individual'

  // Role-based terminology is handled inline
  const pageTitle = isIndividual ? "My Training" : "Training Plans"
  const pageDescription = isIndividual
    ? "Manage your training blocks and workouts"
    : "View and manage your macrocycles with race-anchored timelines"

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
    >
      <Suspense fallback={<UnifiedPageSkeleton title={pageTitle} variant="plans" />}>
        {isIndividual ? <IndividualPlansHome /> : <PlansHome />}
      </Suspense>
    </PageLayout>
  )
} 