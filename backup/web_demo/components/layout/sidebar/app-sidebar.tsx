/*
<ai_context>
This client component provides the sidebar for the app.
</ai_context>
*/

"use client"

import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Bot,
  Building2
} from "lucide-react"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { TeamSwitcher } from "./team-switcher"

// GuideLayer AI navigation data
const data = {
  teams: [
    {
      name: "Personal Workspace",
      logo: Building2,
      plan: "Free"
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: CheckSquare
    },
    {
      title: "Knowledge Base",
      url: "/knowledge-base",
      icon: BookOpen
    },
    {
      title: "AI Copilot",
      url: "/copilot",
      icon: Bot
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* UserButton moved to header in Task #21 */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
