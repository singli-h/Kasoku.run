import { LeanAthleteManagementPage } from "@/components/features/athletes"
import { PageLayout } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function AthletesPage() {
  // Protect this page - only coaches can access (individuals don't manage other athletes)
  await serverProtectRoute({ allowedRoles: ['coach'] })

  return (
    <PageLayout
      title="Athletes"
      description="Manage your athletes and organize them into training groups"
    >
      <LeanAthleteManagementPage />
    </PageLayout>
  )
} 