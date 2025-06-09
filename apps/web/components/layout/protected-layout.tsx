/*
<ai_context>
Reusable protected layout component for all authenticated pages.
Includes sidebar navigation and protected header with search and user controls.
</ai_context>
*/

"use server"

import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ProtectedHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 