# Layout System Documentation (Task 003)

## Overview
This document describes the standardized layout system implemented to fix header duplication and provide consistent page structure across the application.

## Components

### 1. ProtectedLayout
**Location:** `components/layout/protected-layout.tsx`

Enhanced with error boundary for robust error handling:
```typescript
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "./error-fallback"

// Wraps the entire layout in an error boundary
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <ProtectedHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {children}
      </div>
    </SidebarInset>
  </SidebarProvider>
</ErrorBoundary>
```

### 2. ErrorFallback Component
**Location:** `components/layout/error-fallback.tsx`

Reusable error UI component that provides:
- User-friendly error message
- Error details in development mode
- "Try Again" button to reset error boundary
- Consistent styling with design system

## CSS Layout Classes

### Available Classes
Added to `app/globals.css`:

```css
.layout-container {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.content-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Alternative sizes */
.content-container-sm { max-width: 800px; }
.content-container-lg { max-width: 1400px; }
```

### Responsive Design
- Mobile breakpoint: `max-width: 768px` → `padding: 1rem`
- Small screens: `max-width: 640px` → `padding: 1rem`

## Page Structure Pattern

All protected pages now follow this consistent structure:

```typescript
export default function SomePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Page Title</h1>
        <p className="text-muted-foreground mt-2">
          Page description
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<PageSkeleton />}>
        <PageComponent />
      </Suspense>
    </div>
  )
}
```

## Benefits

1. **No Header Duplication** - ProtectedLayout provides the main header, pages only add page-specific titles
2. **Consistent Spacing** - All pages use `space-y-6` for consistent vertical rhythm
3. **Error Resilience** - Error boundaries catch and display errors gracefully
4. **Responsive Design** - Built-in mobile optimizations
5. **Accessibility** - Proper heading hierarchy and semantic structure

## Usage Guidelines

### For New Pages
1. Follow the page structure pattern above
2. Use `space-y-6` for main container spacing
3. Include page header with title and description
4. Wrap async content in Suspense with skeleton

### For Components
1. Remove any duplicate headers that conflict with page headers
2. Use content container classes when needed:
   - `.content-container` for standard width
   - `.content-container-sm` for narrower content
   - `.content-container-lg` for wider content

### Error Handling
Error boundaries are automatically applied at the layout level. For component-specific error handling, you can add additional ErrorBoundary components:

```typescript
import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "@/components/layout/error-fallback"

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <SomeComponent />
</ErrorBoundary>
```

## Implemented Pages
All protected pages have been standardized:
- ✅ Dashboard
- ✅ Sessions  
- ✅ Plans
- ✅ Athletes
- ✅ Performance
- ✅ Workout
- ✅ Settings
- ✅ Copilot
- ✅ Templates

## Dependencies
- `react-error-boundary` v6.0.0
- Tailwind CSS for styling
- Existing UI components (Card, Button, etc.) 