"use server"

import { redirect } from "next/navigation"
import { getUserProfileAction } from "@/actions/users/user-actions"
import ProtectedLayout from "@/components/layout/protected-layout"

interface ProtectedRoutesLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedRoutesLayout({
  children,
}: ProtectedRoutesLayoutProps) {
  const userAction = await getUserProfileAction()

  if (!userAction.isSuccess || !userAction.data) {
    // This case should ideally be handled by middleware,
    // but as a fallback, we can redirect.
    // Assuming if there's no user record, they need to sign in or something is wrong.
    return redirect("/") // Or a dedicated error page
  }

  if (!userAction.data.onboarding_completed) {
    redirect("/onboarding")
  }

  return <ProtectedLayout>{children}</ProtectedLayout>
} 