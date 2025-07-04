/*
<ai_context>
Plans layout using the shared ProtectedLayout component.
Provides consistent navigation and header for all training plans pages.
</ai_context>
*/

"use server"

import { redirect } from "next/navigation"
import { getUserProfileAction } from "@/actions/users/user-actions"
import ProtectedLayout from "@/components/layout/protected-layout"

interface ProtectedRouteLayoutProps {
  children: React.ReactNode
}

export default async function PlansLayout({
  children,
}: ProtectedRouteLayoutProps) {
  const userAction = await getUserProfileAction()

  if (!userAction.isSuccess || !userAction.data) {
    return redirect("/")
  }

  if (!userAction.data.onboarding_completed) {
    redirect("/onboarding")
  }

  return <ProtectedLayout>{children}</ProtectedLayout>
} 