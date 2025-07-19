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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Copilot</h1>
          <p className="text-muted-foreground mt-2">
            Get personalized training advice and workout recommendations
          </p>
        </div>
        <Link href="/copilot/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversation List */}
        <div className="lg:col-span-2">
          <ConversationList userId={userId} />
        </div>
        
        {/* Training Prompt Examples Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Start</h2>
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
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      
      {/* Content skeleton */}
      <ListSkeleton 
        count={6}
        showFilters={true}
      />
    </div>
  )
}

export default async function CopilotPage() {
  return (
    <Suspense fallback={<CopilotSkeleton />}>
      <CopilotContentFetcher />
    </Suspense>
  )
} 