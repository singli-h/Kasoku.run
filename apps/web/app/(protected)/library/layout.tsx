"use server"

import React from "react"

// Authentication and onboarding enforcement handled by parent layout at app/(protected)/layout.tsx
export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}