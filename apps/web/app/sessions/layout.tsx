"use server"

import ProtectedLayout from "@/components/layout/protected-layout"

export default function SessionsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>
} 