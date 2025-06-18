/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

// import {
//   createProfileAction,
//   getProfileByUserIdAction
// } from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kasoku - AI-Powered Training Plans",
  description: "Transform your fitness journey with AI-powered insights, smart training plans, and real-time performance tracking."
}

// Force dynamic rendering for all pages - fitness app needs real-time data
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Removed auth() call from root layout to fix Clerk middleware error
  // Authentication checks are handled by middleware and individual pages that need them
  
  // TODO: Implement user profile creation with Supabase
  // This should be handled in protected routes or middleware instead
  // if (userId) {
  //   const profileRes = await getProfileByUserIdAction(userId)
  //   if (!profileRes.isSuccess) {
  //     await createProfileAction({ userId })
  //   }
  // }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
            inter.className
          )}
          suppressHydrationWarning
        >
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            <PostHogUserIdentify />
            <PostHogPageview />

            {children}

            <TailwindIndicator />

            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
