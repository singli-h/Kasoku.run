/*
<ai_context>
This server layout provides a shared header and footer for GuideLayer AI marketing routes.
</ai_context>
*/

"use server"

import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header/header"

export default async function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex-1">{children}</div>

      <Footer />
    </div>
  )
} 