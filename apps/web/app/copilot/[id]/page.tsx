"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ConversationDetailContent } from "@/components/features/chat/components/conversation-detail-content"
import { Card, CardContent } from "@/components/ui/card"

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>
}

async function ConversationDetailFetcher({ 
  conversationId 
}: { 
  conversationId: string 
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/login")
  }

  // TODO: Fetch conversation from database
  // For now, we'll use mock data
  const conversation = {
    id: conversationId,
    user_id: userId,
    title: conversationId === "new" ? "New Conversation" : `Conversation ${conversationId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived: false,
    message_count: 0,
    messages: []
  }

  return (
    <ConversationDetailContent 
      conversation={conversation}
      userId={userId}
    />
  )
}

function ConversationDetailSkeleton() {
  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header skeleton */}
      <div className="border-b p-4">
        <div className="h-6 bg-muted rounded animate-pulse w-48" />
      </div>
      
      {/* Chat messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-start">
          <Card className="max-w-[80%]">
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded animate-pulse w-64" />
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end">
          <Card className="max-w-[80%]">
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded animate-pulse w-48" />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Input skeleton */}
      <div className="border-t p-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  )
}

export default async function ConversationDetailPage({ 
  params 
}: ConversationDetailPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<ConversationDetailSkeleton />}>
      <ConversationDetailFetcher conversationId={id} />
    </Suspense>
  )
} 