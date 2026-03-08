import { ArticleEditorPage } from "@/components/features/knowledge-base/pages/article-editor-page"
import { serverProtectRoute } from "@/components/auth/server-protect-route"

interface ArticleEditorRouteProps {
  params: Promise<{ id?: string }>
}

export default async function ArticleEditorRoute({ params }: ArticleEditorRouteProps) {
  await serverProtectRoute({ allowedRoles: ['coach'] })

  const { id } = await params
  const articleId = id ? parseInt(id) : undefined
  const mode = articleId ? "edit" : "create"

  return <ArticleEditorPage articleId={articleId} mode={mode} />
}
