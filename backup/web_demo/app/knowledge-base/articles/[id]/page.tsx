"use server"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArticleDetailContent } from "@/components/features/knowledge-base/components/article-detail-content"
import { ArticleDetailSkeleton } from "@/components/features/knowledge-base/components/article-detail-skeleton"

async function ArticleDetailFetcher({ id }: { id: string }) {
  // Validate article ID
  if (!id || id.trim() === '') {
    notFound()
  }

  return <ArticleDetailContent articleId={id} />
}

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<ArticleDetailSkeleton />}>
      <ArticleDetailFetcher id={id} />
    </Suspense>
  )
} 