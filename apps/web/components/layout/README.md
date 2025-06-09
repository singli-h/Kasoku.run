# Layout Architecture

This document outlines the clean and effective header management system for the Kasoku application.

## Header Types

### 1. Landing Header (`LandingHeader`)
- **Location**: `components/layout/header/header.tsx`
- **Purpose**: Marketing and landing pages only
- **Features**:
  - Navigation menu with features dropdown
  - Authentication buttons (Login/Sign Up)
  - Theme switcher
  - Mobile responsive menu
  - Scroll-based styling
- **Used in**: Marketing pages (`(marketing)` route group)

### 2. Protected Header (`ProtectedHeader`)
- **Location**: `components/layout/header/protected-header.tsx`
- **Purpose**: All authenticated pages
- **Features**:
  - Sidebar trigger
  - Global search bar
  - Notifications bell
  - Enhanced user profile button
  - Asana-style design
- **Used in**: All protected routes via `ProtectedLayout`

### 3. No Header
- **Purpose**: Authentication and onboarding flows
- **Pages**: Login, signup, onboarding
- **Rationale**: Clean, distraction-free experience for critical user flows

## Layout Structure

### Root Layout (`app/layout.tsx`)
- **No header included** - Headers are managed at route group level
- Provides global providers and base styling
- Allows each route group to control its own header

### Route Group Layouts

#### Marketing Layout (`app/(marketing)/layout.tsx`)
```tsx
import { LandingHeader } from "@/components/layout/header"

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>{children}</main>
    </div>
  )
}
```

#### Protected Layout Component (`components/layout/protected-layout.tsx`)
```tsx
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ProtectedLayout({ children }) {
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
```

#### Individual Protected Route Layouts
All protected routes (`dashboard`, `athletes`, `plans`, `workout`, `performance`, `settings`, `copilot`) use the shared `ProtectedLayout`:

```tsx
import ProtectedLayout from "@/components/layout/protected-layout"

export default function RouteLayout({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
```

#### Auth Layout (`app/(auth)/layout.tsx`)
- **No header** - Clean centered layout for authentication
- Provides centered container for login/signup forms

#### Onboarding Layout (`app/onboarding/layout.tsx`)
- **No header** - Focused onboarding experience
- Custom gradient background and centered content

## Benefits of This Architecture

### 1. **Clear Separation of Concerns**
- Landing pages get marketing-focused header
- Protected pages get app-focused header
- Auth/onboarding pages get no header distraction

### 2. **DRY Principle**
- Single `ProtectedLayout` component eliminates code duplication
- Consistent header behavior across all protected routes

### 3. **Maintainability**
- Changes to protected header affect all protected routes automatically
- Easy to add new protected routes
- Clear component boundaries

### 4. **Performance**
- No unnecessary header rendering on auth pages
- Proper component tree structure

### 5. **User Experience**
- Appropriate header for each context
- No navigation distractions during critical flows
- Consistent experience within each app section

## Adding New Routes

### For Marketing Pages
Add to `(marketing)` route group - will automatically get `LandingHeader`

### For Protected Pages
1. Create route with layout:
```tsx
import ProtectedLayout from "@/components/layout/protected-layout"

export default function NewRouteLayout({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
```

### For Auth/Onboarding Pages
Add to `(auth)` route group or create custom layout without header

## Component Exports

Clean exports from `components/layout/header/index.ts`:
```tsx
export { default as LandingHeader } from './header'
export { ProtectedHeader } from './protected-header'
export { EnhancedUserButton } from './enhanced-user-button'
```

This architecture ensures a clean, maintainable, and user-friendly header system that scales with the application. 