/*
<ai_context>
This layout provides the sidebar navigation and header for all AI Copilot pages.
It follows the same structure as the dashboard and tasks layouts to ensure consistency.
</ai_context>
*/

"use server"

import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header/protected-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface CopilotLayoutProps {
  children: React.ReactNode
}

export default async function CopilotLayout({ children }: CopilotLayoutProps) {
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