/*
<ai_context>
Layout components barrel export for clean imports across the application.
Provides access to all layout-related components including the new unified page layout system.
</ai_context>
*/

// Core layout components
export { default as ProtectedLayout } from "./protected-layout"
export { ErrorFallback } from "./error-fallback"

// Header components
export { default as LandingHeader } from "./header/header"
export { ProtectedHeader } from "./header/protected-header"
export { EnhancedUserButton } from "./header/enhanced-user-button"

// Sidebar components
export { AppSidebar } from "./sidebar/app-sidebar"
export { NavMain, NavSection, type NavItem } from "./sidebar/nav-main"
export { NavProjects } from "./sidebar/nav-projects" // Legacy, consider removing
export { TeamSwitcher } from "./sidebar/team-switcher"

// New unified page layout system
export { 
  PageLayout, 
  PageHeader, 
  PageContent, 
  PageSkeleton, 
  PageError 
} from "./page-layout"

export { ComponentSkeleton, PageSkeleton as UnifiedPageSkeleton } from "./page-skeleton"
