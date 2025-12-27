/*
<ai_context>
Reusable protected layout component for all authenticated pages.
Includes sidebar navigation, protected header, and error boundary for robust error handling.
</ai_context>
*/

"use client"

import { ErrorBoundary } from "react-error-boundary"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ErrorFallback } from "./error-fallback"
import { UserRoleProvider } from "@/contexts/user-role-context"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserRoleProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <ProtectedHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0 overflow-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </UserRoleProvider>
    </ErrorBoundary>
  )
} 