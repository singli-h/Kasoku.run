/*
<ai_context>
This client component provides navigation sections for the sidebar.
Next.js Link handles prefetching automatically when links enter viewport.
Supports role-based navigation with customizable section labels.
Auto-closes mobile sidebar on navigation for smooth UX.
</ai_context>
*/

"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
}

export interface NavSectionProps {
  label: string
  items: NavItem[]
}

/**
 * NavSection - A flexible navigation section with a label
 * Used to group navigation items by context (Training, Resources, Coaching, etc.)
 * Automatically closes sidebar on mobile when a link is clicked for smooth UX.
 */
export function NavSection({ label, items }: NavSectionProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  if (items.length === 0) return null

  const handleNavClick = () => {
    // Auto-close sidebar on mobile for smooth UX
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              isActive={item.isActive}
            >
              <Link href={item.url} onClick={handleNavClick}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * NavMain - Legacy wrapper for backwards compatibility
 * @deprecated Use NavSection with explicit label instead
 */
export function NavMain({
  items
}: {
  items: NavItem[]
}) {
  return <NavSection label="Platform" items={items} />
}
