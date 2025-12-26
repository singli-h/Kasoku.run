# Layout System Architecture

> **Last Updated**: 2025-12-24  
> **Status**: Current Implementation

## Overview

This document provides a comprehensive technical guide to the Kasoku layout system. The application uses a unified layout architecture that eliminates redundancy, provides consistent loading states, and implements robust error handling across all protected pages.

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
  - Error boundary for robust error handling

## Core Components

### ProtectedLayout Component
**Location**: `components/layout/protected-layout.tsx`

The main layout wrapper for all protected pages. Includes error boundary for robust error handling:

```tsx
"use client"

import { ErrorBoundary } from "react-error-boundary"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import { ProtectedHeader } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ErrorFallback } from "./error-fallback"

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-x-hidden">
          <ProtectedHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
```

**Key Features**:
- Error boundary wraps entire layout
- Sidebar navigation with TeamSwitcher
- Protected header with search, notifications, user menu
- Main content area with consistent spacing

### PageLayout Component
**Location**: `components/layout/page-layout.tsx`

The unified page layout component that handles all page states consistently:

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

**Usage**:
```tsx
export default async function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      description="Your training overview and quick actions"
    >
      <Suspense fallback={<PageSkeleton title="Dashboard" variant="dashboard" />}>
        <PageContent />
      </Suspense>
    </PageLayout>
  )
}
```

**Benefits**:
- Eliminates header redundancy
- Provides consistent loading states
- Standardizes error handling
- Ensures responsive design
- Apple-inspired clean styling

### ErrorFallback Component
**Location**: `components/layout/error-fallback.tsx`

Reusable error UI component that provides:
- User-friendly error message
- Error details in development mode
- "Try Again" button to reset error boundary
- Consistent styling with design system

```tsx
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-muted p-3 text-sm">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {error.message}
              </pre>
            </details>
          )}
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### PageSkeleton Component
**Location**: `components/layout/page-skeleton.tsx`

Standardized loading states with multiple variants:

```tsx
interface PageSkeletonProps {
  title: string
  showActions?: boolean
  variant?: 'default' | 'dashboard' | 'list' | 'grid' | 'form'
  className?: string
}
```

**Variants**:
- **Dashboard**: Cards and metrics layout
- **List**: Table/list view with filters
- **Grid**: Card grid with search
- **Form**: Settings and form layouts
- **Default**: General content layout

## Page Structure Pattern

All protected pages follow this consistent structure:

```tsx
export default async function SomePage() {
  return (
    <PageLayout
      title="Page Title"
      description="Page description"
      headerActions={<Button>Action</Button>}
    >
      <Suspense fallback={<PageSkeleton title="Page Title" variant="default" />}>
        <PageContent />
      </Suspense>
    </PageLayout>
  )
}
```

### Before (Redundant Pattern)
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

### After (Unified Pattern)
```tsx
export default async function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      description="Your training overview and quick actions"
    >
      <Suspense fallback={<PageSkeleton title="Dashboard" variant="dashboard" />}>
        <PageContent />
      </Suspense>
    </PageLayout>
  )
}
```

## Error Handling

Error boundaries are automatically applied at the layout level via `ProtectedLayout`. For component-specific error handling, you can add additional ErrorBoundary components:

```tsx
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "@/components/layout/error-fallback"

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <SomeComponent />
</ErrorBoundary>
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
  - Global search
  - Notifications
  - User profile menu
  - Theme switcher
  - Mobile responsive

## Implementation Guidelines

### For New Pages
1. Use `PageLayout` component for all protected pages
2. Choose appropriate skeleton variant for loading states
3. Provide meaningful error messages via `error` prop
4. Include retry functionality via `onRetry` prop
5. Use consistent spacing and typography

### For Components
1. Remove any duplicate headers that conflict with page headers
2. Use content container classes when needed
3. Follow responsive design patterns
4. Implement proper error handling

## Dependencies

- `react-error-boundary` v6.0.0 - Error boundary implementation
- `@/components/ui/sidebar` - Sidebar components from shadcn/ui
- Tailwind CSS - Styling and responsive design
- Existing UI components (Card, Button, etc.)

## Related Documentation

- [Layout Design System](../design/layout-design-system.md) - Design patterns and visual guidelines
- [Component Architecture](./component-architecture.md) - Component organization patterns
- [Design System Overview](../design/design-system-overview.md) - Complete design system

