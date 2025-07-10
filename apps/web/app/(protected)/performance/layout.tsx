"use server"

import React from "react"

// This layout is now a simple pass-through.
// The authentication and onboarding check is handled by the parent layout
// in app/(protected)/layout.tsx.
export default async function PerformanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 