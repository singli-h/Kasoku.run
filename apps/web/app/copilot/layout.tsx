/*
<ai_context>
Copilot layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all AI Copilot pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface CopilotLayoutProps {
  children: React.ReactNode
}

export default async function CopilotLayout({ children }: CopilotLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 