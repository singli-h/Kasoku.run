import { ArticleEditorPage } from "@/components/features/knowledge-base/pages/article-editor-page"

interface ArticleEditorRouteProps {
  params: Promise<{ id?: string }>
}

export default async function ArticleEditorRoute({ params }: ArticleEditorRouteProps) {
  const { id } = await params
  const articleId = id ? parseInt(id) : undefined
  const mode = articleId ? "edit" : "create"
  
  return <ArticleEditorPage articleId={articleId} mode={mode} />
}
