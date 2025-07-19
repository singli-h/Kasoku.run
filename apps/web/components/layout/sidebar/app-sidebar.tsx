/*
<ai_context>
This client component provides the sidebar for the Kasoku running/fitness app.
</ai_context>
*/

"use client"

import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Target,
  BookOpen,
  Trophy,
  PlayCircle
} from "lucide-react"
import * as React from "react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { TeamSwitcher } from "./team-switcher"

// Kasoku running/fitness navigation data
const navItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Workout",
    url: "/workout",
    icon: Dumbbell
  },
  {
    title: "Exercise Library",
    url: "/library",
    icon: BookOpen
  },
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp
  },
  {
    title: "Athletes",
    url: "/athletes",
    icon: Users
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  }
]

// Training-specific navigation items
const trainingItems = [
  {
    name: "Plans",
    url: "/plans",
    icon: Calendar
  },
  {
    name: "Sessions",
    url: "/sessions",
    icon: PlayCircle
  }
]

const teams = [
  {
    name: "Kasoku Training",
    logo: Target,
    plan: "Pro"
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  // Add active state based on current pathname
  const navItemsWithActive = navItems.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItemsWithActive} />
        <NavProjects projects={trainingItems} />
      </SidebarContent>
      <SidebarFooter>
        {/* User controls in header for better UX */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
