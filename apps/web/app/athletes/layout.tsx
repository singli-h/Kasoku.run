/*
<ai_context>
Athletes layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all athletes pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface AthletesLayoutProps {
  children: React.ReactNode
}

export default async function AthletesLayout({ children }: AthletesLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 