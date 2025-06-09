/*
<ai_context>
Performance layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all performance tracking pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface PerformanceLayoutProps {
  children: React.ReactNode
}

export default async function PerformanceLayout({ children }: PerformanceLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 