import { KnowledgeBasePage } from "@/components/features/knowledge-base/pages/knowledge-base-page"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

export default async function KnowledgeBasePageRoute() {
  // Protect this page - only coaches can access
  await serverProtectRoute({ allowedRoles: ['coach'] })

  return <KnowledgeBasePage />
}
