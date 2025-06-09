"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/features/chat/components/conversation-list"
import { ListSkeleton } from "@/components/composed"

async function CopilotContentFetcher() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/login")
  }

  return <ConversationList userId={userId} />
}

function CopilotSkeleton() {
  return (
    <ListSkeleton 
      count={6}
      showFilters={true}
    />
  )
}

export default async function CopilotPage() {
  return (
    <Suspense fallback={<CopilotSkeleton />}>
      <CopilotContentFetcher />
    </Suspense>
  )
} 