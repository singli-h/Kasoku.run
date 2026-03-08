/*
<ai_context>
Marketing layout for landing pages.
Uses LandingHeader and Footer components for the marketing site shell.
Applies Outfit body font for marketing pages via font-body utility.
</ai_context>
*/

import { LandingHeader } from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { ReactLenis } from 'lenis/react'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReactLenis root>
      <div className="min-h-screen bg-background font-body">
        <LandingHeader />
        <main>
          {children}
        </main>
        <Footer />
      </div>
    </ReactLenis>
  )
}
