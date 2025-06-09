/*
<ai_context>
Workout layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all workout pages.
</ai_context>
*/

"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

interface WorkoutLayoutProps {
  children: React.ReactNode
}

export default async function WorkoutLayout({ children }: WorkoutLayoutProps) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 