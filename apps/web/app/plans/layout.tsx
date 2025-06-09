/*
<ai_context>
Plans layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all training plans pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface PlansLayoutProps {
  children: React.ReactNode
}

export default async function PlansLayout({ children }: PlansLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 