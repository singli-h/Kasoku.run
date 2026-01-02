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
  Zap,
  BookOpen,
  PlayCircle,
  FileText,
  type LucideIcon
} from "lucide-react"
import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { useUserRole, type UserRole } from "@/contexts/user-role-context"

// Navigation item type with role-based visibility
// If visibleTo is undefined, the item is visible to all roles
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[]
}

// Kasoku running/fitness navigation data
// Note: Individual = Athlete + self-planning. Knowledge Base is available to all roles.
const navItems: NavItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Workout",
    url: "/workout",
    icon: Dumbbell,
    // visibleTo: undefined → visible to all (coaches also have athlete record)
  },
  {
    title: "Exercise Library",
    url: "/library",
    icon: BookOpen,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: FileText,
    // visibleTo: undefined → visible to all (updated per clarification)
  },
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp,
    // visibleTo: undefined → visible to all
  },
  {
    title: "Athletes",
    url: "/athletes",
    icon: Users,
    visibleTo: ['coach'], // Coach-only - managing athletes
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    // visibleTo: undefined → visible to all
  }
]

// Training-specific navigation items
interface TrainingItem {
  name: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[]
}

const trainingItems: TrainingItem[] = [
  {
    name: "My Training", // Renamed from "Plans" for individuals
    url: "/plans",
    icon: Calendar,
    visibleTo: ['coach', 'individual'], // Coaches + individuals can create plans
  },
  {
    name: "Sessions",
    url: "/sessions",
    icon: PlayCircle,
    visibleTo: ['coach'], // Coach-only session management
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { role, isLoading } = useUserRole()

  // Filter navigation items based on user role
  const filteredNavItems = React.useMemo(() => {
    if (isLoading || !role) return []

    return navItems.filter(item => {
      // If visibleTo is undefined, item is visible to all roles
      if (!item.visibleTo) return true
      // Check if current role is in visibleTo array
      return item.visibleTo.includes(role)
    })
  }, [role, isLoading])

  // Filter training items based on user role
  const filteredTrainingItems = React.useMemo(() => {
    if (isLoading || !role) return []

    return trainingItems.filter(item => {
      // If visibleTo is undefined, item is visible to all roles
      if (!item.visibleTo) return true
      // Check if current role is in visibleTo array
      return item.visibleTo.includes(role)
    })
  }, [role, isLoading])

  // Add active state based on current pathname
  const navItemsWithActive = filteredNavItems.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Kasoku</span>
                  <span className="truncate text-xs text-muted-foreground">Training Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItemsWithActive} />
        {filteredTrainingItems.length > 0 && (
          <NavProjects projects={filteredTrainingItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* User controls in header for better UX */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
