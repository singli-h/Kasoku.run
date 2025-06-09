/*
<ai_context>
Marketing layout for landing pages.
Uses LandingHeader component specifically designed for marketing pages.
</ai_context>
*/

"use server"

import { LandingHeader } from "@/components/layout/header"

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        {children}
      </main>
    </div>
  )
} 