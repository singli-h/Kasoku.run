import { LeanAthleteManagementPage } from "@/components/features/athletes"
import { PageLayout } from "@/components/layout"

export default async function AthletesPage() {
  return (
    <PageLayout
      title="Athletes"
      description="Manage your athletes and organize them into training groups"
    >
      <LeanAthleteManagementPage />
    </PageLayout>
  )
} 