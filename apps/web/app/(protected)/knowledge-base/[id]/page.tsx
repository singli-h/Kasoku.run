import { ArticleDetailPage } from "@/components/features/knowledge-base/pages/article-detail-page"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPageRoute({ params }: ArticleDetailPageProps) {
  await serverProtectRoute({ allowedRoles: ['coach'] })

  const { id } = await params
  return <ArticleDetailPage articleId={id} />
}
