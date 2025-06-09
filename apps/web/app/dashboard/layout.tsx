/*
<ai_context>
Dashboard layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all dashboard pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 