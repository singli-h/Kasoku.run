# Layout Architecture (ARCHIVED)

> **Status**: ⚠️ **DEPRECATED** - This document has been consolidated  
> **Date Archived**: 2025-12-24  
> **Replaced By**: [Layout System Architecture](../architecture/layout-system.md)

This document has been consolidated into the new unified layout documentation. Please refer to:

- **[Layout System Architecture](../architecture/layout-system.md)** - Complete technical guide
- **[Layout Design System](../design/layout-design-system.md)** - Design patterns and visual guidelines

## Migration Notes

All technical content from this document has been merged into `architecture/layout-system.md`.  
All design content has been merged into `design/layout-design-system.md`.

---

**Original content preserved below for reference:**

# Layout Architecture

## Overview

This document outlines the clean and effective layout management system for the Kasoku application, featuring a unified design system that eliminates redundancy and provides consistent user experience.

## Layout Hierarchy

### Root Layout Structure
```
app/layout.tsx (Root)
├── (marketing)/layout.tsx → LandingHeader
├── (auth)/layout.tsx → No header (centered)
├── onboarding/layout.tsx → No header (centered)
└── (protected)/layout.tsx → ProtectedLayout
    └── ProtectedLayout Component
        ├── AppSidebar (with TeamSwitcher)
        └── SidebarInset
            ├── ProtectedHeader (search, notifications, user)
            └── PageLayout (unified page structure)
                ├── PageHeader (title, description, actions)
                └── PageContent (main content area)
```

## Layout Types

### 1. Marketing Layout (`(marketing)/layout.tsx`)
- **Purpose**: Landing and marketing pages
- **Header**: `LandingHeader` with navigation and auth buttons
- **Features**: 
  - Navigation menu with features dropdown
  - Authentication buttons (Login/Sign Up)
  - Theme switcher
  - Mobile responsive menu
  - Scroll-based styling

### 2. Auth Layout (`(auth)/layout.tsx`)
- **Purpose**: Authentication pages (sign-in, sign-up)
- **Header**: None (clean, centered layout)
- **Features**:
  - Centered container for forms
  - Distraction-free experience
  - Focus on conversion

### 3. Onboarding Layout (`onboarding/layout.tsx`)
- **Purpose**: User onboarding flow
- **Header**: None (focused experience)
- **Features**:
  - Custom gradient background
  - Centered content
  - Step-by-step guidance

### 4. Protected Layout (`(protected)/layout.tsx`)
- **Purpose**: All authenticated pages
- **Header**: `ProtectedHeader` with app navigation
- **Features**:
  - Sidebar navigation
  - Global search
  - Notifications
  - User profile management
  - Unified page structure via `PageLayout`

## Unified Page Layout System

### PageLayout Component
**Location**: `components/layout/page-layout.tsx`

The main component that provides consistent page structure:

```tsx
interface PageLayoutProps {
  title: string
  description?: string
  children: ReactNode
  headerActions?: ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
}
```

**Benefits**:
- Eliminates header redundancy
- Provides consistent loading states
- Standardizes error handling
- Ensures responsive design
- Apple-inspired clean styling

### Page Structure (Before vs After)

#### Before (Redundant Pattern)
```tsx
export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* REDUNDANT: Manual page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Description</p>
      </div>
      
      <Suspense fallback={<CustomSkeleton />}>
        <PageContent />
      </Suspense>
    </div>
  )
}
```

#### After (Unified Pattern)
```tsx
export default async function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      description="Your training overview and quick actions"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Dashboard" variant="dashboard" />}>
        <PageContent />
      </Suspense>
    </PageLayout>
  )
}
```

## Header Management

### Header Types

#### 1. Landing Header (`LandingHeader`)
- **Location**: `components/layout/header/header.tsx`
- **Purpose**: Marketing and landing pages only
- **Features**:
  - Navigation menu with features dropdown
  - Authentication buttons (Login/Sign Up)
  - Theme switcher
  - Mobile responsive menu
  - Scroll-based styling

#### 2. Protected Header (`ProtectedHeader`)
- **Location**: `components/layout/header/protected-header.tsx`
- **Purpose**: All authenticated pages
- **Features**:
  - Sidebar trigger
  - Global search bar
  - Notifications bell
  - Enhanced user profile button
  - Mobile-optimized touch targets

#### 3. No Header
- **Purpose**: Authentication and onboarding flows
- **Pages**: Login, signup, onboarding
- **Rationale**: Clean, distraction-free experience

## Sidebar Navigation

### AppSidebar Component
**Location**: `components/layout/sidebar/app-sidebar.tsx`

Features:
- Collapsible sidebar with icon mode
- Main navigation items
- Training-specific navigation
- Team switcher
- Active state management

### Navigation Structure
```tsx
const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Workout", url: "/workout", icon: Dumbbell },
  { title: "Exercise Library", url: "/library", icon: BookOpen },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Athletes", url: "/athletes", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings }
]

const trainingItems = [
  { name: "Plans", url: "/plans", icon: Calendar },
  { name: "Sessions", url: "/sessions", icon: PlayCircle }
]
```

## Loading States

### Unified Skeleton System
**Location**: `components/layout/page-skeleton.tsx`

Standardized loading states with multiple variants:

- **Dashboard**: Cards and metrics layout
- **List**: Table/list view with filters
- **Grid**: Card grid with search
- **Form**: Settings and form layouts
- **Default**: General content layout

### Benefits
- Consistent loading experience
- Matches actual page structure
- Reduces perceived loading time
- Eliminates layout shifts

## Error Handling

### Unified Error States
The `PageLayout` component provides consistent error handling:

```tsx
<PageLayout
  title="Page Title"
  description="Page description"
  error={errorMessage}
  onRetry={() => window.location.reload()}
/>
```

**Features**:
- Consistent error UI
- Retry functionality
- Fallback navigation
- Development error details

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- **Touch Targets**: Minimum 44px for all interactive elements
- **Typography**: Responsive font sizes
- **Layout**: Stacked layouts on mobile
- **Navigation**: Collapsible sidebar with mobile menu

### CSS Classes
```css
/* Page container with consistent spacing */
.page-container {
  @apply space-y-6;
}

/* Page header with consistent styling */
.page-header {
  @apply border-b border-border/50 pb-4;
}

.page-title {
  @apply text-3xl font-bold text-foreground tracking-tight;
}

.page-description {
  @apply text-muted-foreground mt-2 text-sm leading-relaxed;
}
```

## Benefits of This Architecture

### 1. **Clear Separation of Concerns**
- Landing pages get marketing-focused header
- Protected pages get app-focused header
- Auth/onboarding pages get no header distraction

### 2. **DRY Principle**
- Single `PageLayout` component eliminates code duplication
- Consistent header behavior across all protected routes
- Unified loading and error states

### 3. **Maintainability**
- Changes to protected header affect all protected routes automatically
- Easy to add new protected routes
- Clear component boundaries

### 4. **Performance**
- No unnecessary header rendering on auth pages
- Proper component tree structure
- Optimized re-renders

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
import { PageLayout } from "@/components/layout"

export default function NewPage() {
  return (
    <PageLayout
      title="New Page"
      description="Page description"
    >
      <PageContent />
    </PageLayout>
  )
}
```

2. The route will automatically get:
   - `ProtectedHeader` with search and navigation
   - `AppSidebar` with navigation
   - Consistent page structure
   - Responsive design

### For Auth Pages
Add to `(auth)` route group - will get centered layout without header

## Migration from Old System

### Steps to Update Existing Pages

1. **Remove Manual Headers**
   ```tsx
   // Remove this pattern
   <div className="space-y-6">
     <div>
       <h1 className="text-3xl font-bold text-foreground">Title</h1>
       <p className="text-muted-foreground mt-2">Description</p>
     </div>
     {children}
   </div>
   ```

2. **Use PageLayout**
   ```tsx
   <PageLayout title="Title" description="Description">
     {children}
   </PageLayout>
   ```

3. **Update Skeleton Components**
   ```tsx
   // Replace custom skeletons
   <CustomPageSkeleton />
   
   // With unified variants
   <UnifiedPageSkeleton title="Page Title" variant="dashboard" />
   ```

4. **Standardize Error Handling**
   ```tsx
   <PageLayout
     title="Page Title"
     error={errorMessage}
     onRetry={retryFunction}
   />
   ```

## Best Practices

### Do's
- ✅ Use `PageLayout` for all protected pages
- ✅ Choose appropriate skeleton variants
- ✅ Provide meaningful error messages
- ✅ Include retry functionality for errors
- ✅ Use consistent spacing and typography

### Don'ts
- ❌ Create manual page headers
- ❌ Use custom skeleton implementations
- ❌ Ignore responsive design
- ❌ Skip error handling
- ❌ Use inconsistent spacing

## Future Enhancements

1. **Animation System**
   - Page transition animations
   - Loading state animations
   - Micro-interaction enhancements

2. **Accessibility Improvements**
   - Screen reader optimizations
   - Keyboard navigation
   - High contrast mode support

3. **Theme System**
   - Dark mode refinements
   - Custom color schemes
   - Brand customization options

This architecture provides a solid foundation for consistent, maintainable, and user-friendly layouts across the entire Kasoku application.

