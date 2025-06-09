/*
<ai_context>
This layout provides the sidebar navigation and Asana-style header for all protected dashboard pages.
</ai_context>
*/

"use server"

import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header/protected-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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