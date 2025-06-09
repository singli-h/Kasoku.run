"use server"

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to GuideLayer AI</h1>
          <p className="text-muted-foreground mt-2">
            Let's get your organization set up for AI-powered collaboration
          </p>
        </div>
        
        <main className="w-full">
          {children}
        </main>
        
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          Need help? Contact our support team
        </footer>
      </div>
    </div>
  )
} 