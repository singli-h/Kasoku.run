/*
<ai_context>
Settings layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all settings pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 