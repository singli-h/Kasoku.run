"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Header } from "@/components/common/Header"
import { LandingHeader } from "@/components/common/LandingHeader"
import { 
  Home, 
  BarChart2, 
  Settings, 
  LogOut, 
  UserCircle, 
  Users, 
  ClipboardList, 
  CalendarDays, 
  Dumbbell, 
  LineChart,
  Calendar,
  Target,
  Menu,
  ClipboardCheck
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useAuth, useUser, useClerk } from "@clerk/nextjs"
import { useUserRole } from "@/context/UserRoleContext"
import { useRouter } from "next/navigation"

export interface NavigationWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const NavigationWrapper = React.forwardRef<HTMLDivElement, NavigationWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const pathname = usePathname()
    const router = useRouter()
    const { isSignedIn, isLoaded } = useAuth()
    const { user: clerkUser } = useUser()
    const { roleData, loading: roleLoading } = useUserRole()
    const { signOut } = useClerk()
    
    // Define routes where navigation should be hidden
    const hiddenNavRoutes = [
      '/',
      '/sign-in',
      '/sign-up', 
      '/onboarding',
      '/auth/callback',
      '/auth/session',
      '/auth/sso-callback'
    ]
    
    // Check if current route should hide navigation
    const shouldHideNav = hiddenNavRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )
    
    // Landing page gets special header
    const isLandingPage = pathname === '/'
    
    // If navigation should be hidden, render minimal layout
    if (shouldHideNav) {
      return (
        <div ref={ref} className={cn("flex flex-col min-h-screen", className)} {...props}>
          {isLandingPage && <LandingHeader />}
          <main className="flex-grow">{children}</main>
        </div>
      )
    }

    // Use actual auth state and user info
    const user = {
      name: clerkUser?.fullName || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || "User",
      email: clerkUser?.primaryEmailAddress?.emailAddress || ""
    }
    
    // Get user role from context - default to 'athlete' if not loaded yet
    const userRole = roleData?.role || "athlete"

    return (
      <SidebarProvider>
        <div ref={ref} className={cn("flex min-h-screen w-full", className)} {...props}>
          <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border">
              <div className="flex items-center justify-between p-2">
                <Link href="/overview" className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-sidebar-foreground">Kasoku</h2>
                </Link>
                {/* Mobile menu trigger in header */}
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="px-2">
              {/* Main Navigation */}
              <SidebarGroup>
                <SidebarGroupLabel>Main</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Overview">
                        <Link href="/overview">
                          <Home />
                          <span>Overview</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Training Plans">
                        <Link href="/plans">
                          <ClipboardList />
                          <span>Plans</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Workout">
                        <Link href="/workout">
                          <Dumbbell />
                          <span>Workout</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Performance">
                        <Link href="/performance">
                          <LineChart />
                          <span>Performance</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Coach Section - Only visible for coaches */}
              {userRole === "coach" && (
                <>
                  <SidebarSeparator />
                  <SidebarGroup>
                    <SidebarGroupLabel>Coach Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="Athletes">
                            <Link href="/athletes">
                              <Users />
                              <span>Athletes</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="Session Logging">
                            <Link href="/coach/sessions">
                              <ClipboardCheck />
                              <span>Session Logging</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="Training Programs">
                            <Link href="/preset-groups">
                              <Target />
                              <span>Programs</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}

              {/* Admin Section - Only visible for admins */}
              {userRole === "admin" && (
                <>
                  <SidebarSeparator />
                  <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="All Users">
                            <Link href="/admin/users">
                              <Users />
                              <span>Users</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="System Settings">
                            <Link href="/admin/settings">
                              <Settings />
                              <span>System</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}
            </SidebarContent>
            
            <SidebarFooter className="border-t border-sidebar-border">
              {isSignedIn ? (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Profile">
                      <Link href="/profile">
                        <UserCircle />
                        <span>{user.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      tooltip="Sign Out"
                      onClick={async () => {
                        await signOut()
                        router.push('/')
                      }}
                    >
                      <LogOut />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              ) : (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sign In">
                      <Link href="/sign-in">
                        <LogOut className="rotate-180"/>
                        <span>Sign In</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sign Up">
                      <Link href="/sign-up">
                        <UserCircle />
                        <span>Sign Up</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}
               <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                        <Link href="/settings">
                            <Settings />
                            <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
               </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          
          <SidebarInset className="flex-1">
            {/* Mobile header with menu trigger */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2 flex-1">
                <h1 className="text-lg font-semibold">Kasoku</h1>
              </div>
            </header>
            
            {/* Main content area */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }
)
NavigationWrapper.displayName = "NavigationWrapper"

export { NavigationWrapper }
export default NavigationWrapper 