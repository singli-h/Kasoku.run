import { ArticleDetailPage } from "@/components/features/knowledge-base/pages/article-detail-page"

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPageRoute({ params }: ArticleDetailPageProps) {
  const { id } = await params
  return <ArticleDetailPage articleId={id} />
}
