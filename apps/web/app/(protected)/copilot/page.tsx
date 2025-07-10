"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/features/chat/components/conversation-list"
import { TrainingPromptExamplesWrapper } from "@/components/features/chat/components/training-prompt-examples-wrapper"
import { ListSkeleton } from "@/components/composed"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function CopilotContentFetcher() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversation List */}
        <div className="lg:col-span-2">
          <ConversationList userId={userId} />
        </div>
        
        {/* Training Prompt Examples Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Start</h2>
            <Link href="/copilot/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </Link>
          </div>
          
          <TrainingPromptExamplesWrapper 
            className="max-h-[calc(100vh-12rem)] overflow-y-auto"
          />
        </div>
      </div>
    </div>
  )
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