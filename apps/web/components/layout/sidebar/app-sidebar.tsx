/*
<ai_context>
This client component provides the sidebar for the Kasoku running/fitness app.
Navigation is organized by user role with session-focused grouping:
- Individual: Training (Workout, Plans, Performance) + Resources
- Athlete: Training (Workout, Performance) + Resources
- Coach: Overview + Coaching + Plans + Resources
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
  ClipboardList,
  Copy,
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
import { NavSection } from "./nav-main"
import { useUserRole, type UserRole } from "@/contexts/user-role-context"
import { useWorkoutPrefetch } from "@/components/features/workout/hooks/use-workout-queries"

// Base navigation item definition with role visibility
interface NavItemDef {
  title: string
  url: string
  icon: LucideIcon
  visibleTo?: UserRole[] // undefined = visible to all
}

// All available navigation items
const allNavItems: Record<string, NavItemDef> = {
  overview: {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  workout: {
    title: "Workout",
    url: "/workout",
    icon: Dumbbell,
  },
  myTraining: {
    title: "Plans",
    url: "/plans",
    icon: Calendar,
    visibleTo: ['individual'],
  },
  plans: {
    title: "Plans",
    url: "/plans",
    icon: Calendar,
    visibleTo: ['coach'],
  },
  performance: {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp,
  },
  athletes: {
    title: "Athletes",
    url: "/athletes",
    icon: Users,
    visibleTo: ['coach'],
  },
  sessions: {
    title: "Sessions",
    url: "/sessions",
    icon: PlayCircle,
    visibleTo: ['coach'],
  },
  program: {
    title: "My Program",
    url: "/program",
    icon: ClipboardList,
    visibleTo: ['athlete'],
  },
  templates: {
    title: "Templates",
    url: "/templates",
    icon: Copy,
    visibleTo: ['coach'],
  },
  exerciseLibrary: {
    title: "Exercise Library",
    url: "/library",
    icon: BookOpen,
  },
  knowledgeBase: {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: FileText,
    visibleTo: ['coach'],
  },
  settings: {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
}

// Section configuration per role
interface SectionConfig {
  label: string
  items: string[] // keys from allNavItems
}

// Role-based sidebar configurations
const sidebarConfigs: Record<UserRole, SectionConfig[]> = {
  // Individual: Session-focused with Training priority
  individual: [
    {
      label: "Overview",
      items: ["overview"],
    },
    {
      label: "Training",
      items: ["workout", "myTraining", "performance"],
    },
    {
      label: "Resources",
      items: ["exerciseLibrary", /* "knowledgeBase", */ "settings"],
    },
  ],

  // Athlete: Training focus with program view (assigned by coach)
  athlete: [
    {
      label: "Training",
      items: ["workout", "program", "performance"],
    },
    {
      label: "Resources",
      items: [/* "knowledgeBase", */ "settings"],
    },
  ],

  // Coach: Full access with coaching section
  coach: [
    {
      label: "Overview",
      items: ["overview"],
    },
    {
      label: "Coaching",
      items: ["athletes", "plans", "sessions", "templates"],
    },
    {
      label: "My Training",
      items: ["workout", "performance"],
    },
    {
      label: "Resources",
      items: ["exerciseLibrary", "knowledgeBase", "settings"],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { role, isLoading } = useUserRole()
  const { prefetchSessionsToday } = useWorkoutPrefetch()

  // Prefetch today's workout sessions on mount so the workout page loads instantly
  React.useEffect(() => {
    prefetchSessionsToday()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build navigation sections based on user role
  const sections = React.useMemo(() => {
    if (isLoading || !role) return []

    const config = sidebarConfigs[role]
    if (!config) return []

    return config.map(section => ({
      label: section.label,
      items: section.items
        .map(key => allNavItems[key])
        .filter(item => {
          // Check visibility permissions
          if (!item) return false
          if (!item.visibleTo) return true
          return item.visibleTo.includes(role)
        })
        .map(item => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
          isActive: pathname === item.url || pathname.startsWith(item.url + '/'),
        }))
    })).filter(section => section.items.length > 0)
  }, [role, isLoading, pathname])

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
        {sections.map(section => (
          <NavSection
            key={section.label}
            label={section.label}
            items={section.items}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* User controls in header for better UX */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
