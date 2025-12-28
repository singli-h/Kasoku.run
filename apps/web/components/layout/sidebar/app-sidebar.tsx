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
  FileText
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
import { useUserRole } from "@/contexts/user-role-context"

// Navigation item type with optional role restriction
interface NavItem {
  title: string
  url: string
  icon: any
  coachOnly?: boolean
}

// Kasoku running/fitness navigation data
const navItems: NavItem[] = [
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
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: FileText,
    coachOnly: true
  },
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp
  },
  {
    title: "Athletes",
    url: "/athletes",
    icon: Users,
    coachOnly: true
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  }
]

// Training-specific navigation items
interface TrainingItem {
  name: string
  url: string
  icon: any
  coachOnly?: boolean
}

const trainingItems: TrainingItem[] = [
  {
    name: "Plans",
    url: "/plans",
    icon: Calendar,
    coachOnly: true
  },
  {
    name: "Sessions",
    url: "/sessions",
    icon: PlayCircle,
    coachOnly: true
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isCoach, isAdmin, isLoading } = useUserRole()

  // Filter navigation items based on user role
  const filteredNavItems = React.useMemo(() => {
    if (isLoading) return []

    return navItems.filter(item => {
      // If item is coach-only, only show to coaches and admins
      if (item.coachOnly) {
        return isCoach || isAdmin
      }
      return true
    })
  }, [isCoach, isAdmin, isLoading])

  // Filter training items based on user role
  const filteredTrainingItems = React.useMemo(() => {
    if (isLoading) return []

    return trainingItems.filter(item => {
      // If item is coach-only, only show to coaches and admins
      if (item.coachOnly) {
        return isCoach || isAdmin
      }
      return true
    })
  }, [isCoach, isAdmin, isLoading])

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
