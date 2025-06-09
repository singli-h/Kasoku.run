# Components Documentation & UI/UX Style Guide

This guide outlines the component architecture, design patterns, and UI/UX guidelines for consistent implementation across the GuideLayer AI application.

## Architecture Overview

The component structure follows a **Hybrid Architecture** approach with clear boundaries:

- **ui/**: Design system primitives (shadcn/ui) - building blocks
- **composed/**: Complex reusable patterns built from ui/ components  
- **features/**: Complete business capabilities with their own components, hooks, types
- **marketing/**: Marketing-focused pages and content
- **layout/**: Structural app layout components
- **utilities/**: Cross-cutting concerns and infrastructure

## Layout Structure

### Dashboard Layout Pattern
All protected pages use the same dashboard layout structure:

```tsx
<div className="flex h-screen">
  <AppSidebar /> {/* Collapsible sidebar */}
  <div className="flex-1 flex flex-col">
    <Header /> {/* Contains UserButton and breadcrumbs */}
    <main className="flex-1 overflow-auto">
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Page content */}
      </div>
    </main>
  </div>
</div>
```

### Navigation Structure
- **Simplified Sidebar**: No expand functionality, direct page navigation only
- **Main navigation items**: Dashboard, Tasks, Knowledge Base, AI Copilot
- **No sub-items**: Each navigation goes directly to main feature pages
- **Routes**: All features use direct routes (`/tasks`, `/kb`, `/copilot`)

## Card Pattern Standards

### Primary Card Structure
```tsx
<Card className="border-border">
  <CardContent className="p-4"> {/* or p-6 for detailed views */}
    {/* Content */}
  </CardContent>
</Card>
```

### Card with Header
```tsx
<Card className="border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Interactive Cards
```tsx
<Card className="border-border hover:border-primary/20 transition-colors">
  <CardContent className="p-4">
    {/* Hoverable content */}
  </CardContent>
</Card>
```

## Status Badge System

### Task Status Configuration
```tsx
const TASK_STATUS_CONFIG = {
  'todo': {
    label: 'To Do',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    variant: 'secondary' as const,
    color: 'bg-gray-400 dark:bg-gray-600'
  },
  'in_progress': {
    label: 'In Progress',  
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    variant: 'default' as const,
    color: 'bg-blue-500'
  },
  'done': {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    variant: 'outline' as const,
    color: 'bg-green-500'
  },
  'blocked': {
    label: 'Blocked',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    variant: 'destructive' as const,
    color: 'bg-red-500'
  }
}
```

### Priority Badge Configuration
```tsx
const PRIORITY_CONFIG = {
  'high': {
    label: 'High',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    variant: 'destructive' as const
  },
  'medium': {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    variant: 'default' as const
  },
  'low': {
    label: 'Low',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    variant: 'outline' as const
  }
}
```

### Clickable Status Badges
For interactive status changes (like in task details):

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Badge 
      variant={statusConfig.variant}
      className={cn("text-xs cursor-pointer hover:opacity-80", statusConfig.className)}
    >
      {statusConfig.label}
    </Badge>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Status options */}
  </DropdownMenuContent>
</DropdownMenu>
```

## List Item Patterns

### Task List Item Structure
```tsx
<Card className="border-border hover:border-primary/20 transition-colors">
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <div className="flex-1 min-w-0">
          {/* Main content */}
          <Link href={`/tasks/${task.id}`}>
            <h3 className="font-medium text-foreground hover:text-primary transition-colors">
              {task.title}
            </h3>
          </Link>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
          
          {/* Metadata row */}
          <div className="flex items-center space-x-2 mt-2">
            <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
            <Badge variant={statusConfig.variant} className={cn("text-xs", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
            <Badge variant={priorityConfig.variant} className={cn("text-xs", priorityConfig.className)}>
              {priorityConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(task.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side actions/avatars */}
      <div className="ml-4">
        {/* Assignee avatar or unassigned icon */}
      </div>
    </div>
  </CardContent>
</Card>
```

## Avatar & Assignee Patterns

### Assigned User Avatar
```tsx
<Avatar className="h-8 w-8 border-2 border-border">
  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
    {assignee.initials}
  </AvatarFallback>
</Avatar>
```

### Unassigned State
```tsx
<div className="h-8 w-8 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
  <Users className="h-4 w-4 text-muted-foreground" />
</div>
```

### Clickable Assignee Selection
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    {assignee ? (
      <Button variant="ghost" size="sm" className="p-0 h-auto">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">{assignee.initials}</AvatarFallback>
        </Avatar>
      </Button>
    ) : (
      <Button variant="ghost" size="sm" className="p-0 h-auto">
        <div className="h-6 w-6 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
          <Users className="h-3 w-3 text-muted-foreground" />
        </div>
      </Button>
    )}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* User selection options */}
  </DropdownMenuContent>
</DropdownMenu>
```

## Empty State Patterns

### Standard Empty State
```tsx
<div className="text-center py-12">
  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
  <p className="text-muted-foreground mb-2">No items found</p>
  <p className="text-sm text-muted-foreground mb-4">
    Description of what to do next
  </p>
  <Button>Primary Action</Button>
</div>
```

### Error State
```tsx
<div className="flex items-center justify-center min-h-[50vh]">
  <Card className="border-border">
    <CardContent className="p-6">
      <p className="text-destructive">Error message</p>
      <p className="text-sm text-muted-foreground mt-2">
        Helpful instructions for resolution
      </p>
    </CardContent>
  </Card>
</div>
```

## Loading State Patterns

### Skeleton Card Loading
```tsx
<Card className="border-border">
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="flex items-center space-x-2">
            <div className="h-6 bg-muted rounded animate-pulse w-20" />
            <div className="h-6 bg-muted rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
      <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
    </div>
  </CardContent>
</Card>
```

## Color System

### Status Colors
- **Todo/Pending**: Gray (`bg-gray-400`, `bg-gray-100 text-gray-800`)
- **In Progress**: Blue (`bg-blue-500`, `bg-blue-100 text-blue-800`)
- **Completed**: Green (`bg-green-500`, `bg-green-100 text-green-800`)
- **Blocked/Error**: Red (`bg-red-500`, `bg-red-100 text-red-800`)

### Priority Colors
- **High**: Red (`bg-red-100 text-red-800`)
- **Medium**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Low**: Green (`bg-green-100 text-green-800`)

### Semantic Colors
- **Primary Text**: `text-foreground`
- **Secondary Text**: `text-muted-foreground`
- **Borders**: `border-border`
- **Interactive Hover**: `hover:border-primary/20`
- **Link Hover**: `hover:text-primary`

## Form Patterns

### Standard Form Field
```tsx
<div className="space-y-2">
  <Label htmlFor="field" className="text-foreground">
    Field Label <span className="text-destructive">*</span>
  </Label>
  <Input
    id="field"
    value={formData.field}
    onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
    placeholder="Placeholder text..."
    required
    disabled={isSubmitting}
  />
</div>
```

### Select Field (No Empty String Values)
```tsx
<Select
  value={formData.status}
  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
  disabled={isSubmitting}
>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Responsive Design

### Grid Patterns
```tsx
{/* Two column layout with sidebar */}
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>

{/* Form fields responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>
```

### Mobile-First Approach
- Use `min-w-64` for minimum widths
- Apply responsive classes: `md:`, `lg:`, `xl:`
- Ensure touch targets are minimum 44px
- Stack elements vertically on mobile

## Animation Guidelines

### Transitions
- Use `transition-colors` for color changes
- Use `transition-transform` for transform animations
- Standard duration: 200ms
- Hover effects: `hover:opacity-80`, `hover:border-primary/20`

### Micro-interactions
```tsx
className="hover:border-primary/20 transition-colors"
className="hover:text-primary transition-colors"
className="transform transition-transform hover:scale-105"
```

## Task-Specific Component Patterns

### Task Brief Section
```tsx
<Card className="border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Task Brief</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <div>
      <h4 className="font-medium text-foreground mb-2">Description</h4>
      <p className="text-foreground">{task.description}</p>
    </div>

    {task.payload?.workflow && (
      <div>
        <h4 className="font-medium text-foreground mb-2">Workflow</h4>
        <p className="text-sm text-muted-foreground">{task.payload.workflow}</p>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {task.payload?.budget && (
        <div>
          <h4 className="font-medium text-foreground mb-1">Budget</h4>
          <p className="text-sm text-muted-foreground">{task.payload.budget}</p>
        </div>
      )}
      {/* Timeline, Resources etc. */}
    </div>
  </CardContent>
</Card>
```

### Task Header with Actions
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center space-x-4 flex-1">
    <Link href="/tasks">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Button>
    </Link>
    
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
      <div className="flex items-center space-x-2 mt-1">
        <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
        {/* Status and priority badges */}
      </div>
    </div>
  </div>
  
  <div className="flex items-center space-x-2">
    {/* Action buttons */}
  </div>
</div>
```

## User Interface Guidelines

### Typography Hierarchy
- **Page Title**: `text-2xl font-bold text-foreground`
- **Section Title**: `text-lg font-semibold text-foreground` 
- **Card Title**: `font-medium text-foreground`
- **Field Labels**: `text-sm font-medium text-foreground`
- **Body Text**: `text-sm text-foreground`
- **Meta Text**: `text-xs text-muted-foreground`

### Spacing Consistency
- **Page padding**: `p-4 pt-0`
- **Card padding**: `p-4` (lists) or `p-6` (detailed views)
- **Section gaps**: `gap-4` or `gap-6`
- **Element spacing**: `space-x-2`, `space-y-2` for tight spacing
- **Component spacing**: `space-x-4`, `space-y-4` for components

This style guide ensures consistent implementation across all task management components and maintains visual harmony throughout the application. 