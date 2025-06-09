# Dashboard Feature Documentation

## Overview

The Dashboard feature serves as the primary landing page for authenticated users in GuideLayer AI. It provides a modern, efficient interface that combines quick access to key features with an overview of recent activity through a clean 3-section layout.

## Architecture

### Component Structure

The dashboard follows the established feature folder pattern with clear separation of concerns:

```
apps/web/components/features/dashboard/
├── components/          # React components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Configuration constants
├── dashboard-prd.md    # Product Requirements Document
└── dashboard-documentation.md  # Technical documentation
```

### Core Components

#### DashboardContainer
- **Purpose**: Main container component that orchestrates the dashboard layout
- **Responsibilities**: Layout management, data fetching coordination, loading states
- **Location**: `components/dashboard-container.tsx`

#### ActionCardsSection
- **Purpose**: Displays the three primary action cards at the top of the dashboard
- **Features**: Modern card design, hover effects, responsive grid layout
- **Cards**: Create New Task, Ask AI Copilot, Browser Extension
- **Location**: `components/action-cards-section.tsx`

#### RecentTasksSection
- **Purpose**: Shows user's recent tasks with status indicators and metadata
- **Features**: Status badges, assignee avatars, due dates, "View All" navigation
- **Data Source**: Recent tasks from task management system
- **Location**: `components/recent-tasks-section.tsx`

#### AICopilotActivitySection
- **Purpose**: Displays recent AI interactions and conversation history
- **Features**: Conversation previews, timestamps, activity indicators
- **Data Source**: AI conversation history API
- **Location**: `components/ai-activity-section.tsx`

## Design System

### Color Palette

```typescript
// Action Cards
const actionCardColors = {
  createTask: {
    background: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-white'
  },
  aiCopilot: {
    background: 'bg-gray-100',
    hover: 'hover:bg-gray-200',
    text: 'text-gray-900'
  },
  browserExtension: {
    background: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    text: 'text-white'
  }
}

// Status Colors
const statusColors = {
  completed: 'bg-green-100 text-green-800',
  inProgress: 'bg-blue-100 text-blue-800',
  toDo: 'bg-gray-100 text-gray-800'
}
```

### Typography Scale

```typescript
const typography = {
  sectionHeading: 'text-xl font-semibold',
  cardTitle: 'text-lg font-medium',
  cardSubtitle: 'text-sm text-muted-foreground',
  taskName: 'text-base font-medium',
  timestamp: 'text-xs text-muted-foreground'
}
```

### Spacing

```typescript
const spacing = {
  sectionGap: 'space-y-8',
  cardGrid: 'grid-cols-1 md:grid-cols-3 gap-6',
  cardPadding: 'p-6',
  listSpacing: 'space-y-4'
}
```

## Data Flow

### Server Actions

#### getRecentTasksAction()
- **Purpose**: Fetches user's recent tasks for dashboard display
- **Returns**: Array of task objects with status, due dates, and assignment info
- **Pagination**: Limited to 10 most recent tasks
- **Error Handling**: Returns empty array on failure with error logging

#### getAICopilotActivityAction()
- **Purpose**: Retrieves recent AI conversation history
- **Returns**: Array of conversation summaries with timestamps
- **Features**: Includes unread indicators and conversation metadata
- **Privacy**: Only returns user's own conversation history

#### getDashboardStatsAction()
- **Purpose**: Fetches summary statistics for dashboard display
- **Returns**: Object with counts and metrics
- **Usage**: Currently used for task counts and activity metrics

### Data Types

```typescript
// Core dashboard types
export interface DashboardData {
  recentTasks: Task[]
  aiActivity: AIConversation[]
  stats: DashboardStats
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'completed'
  dueDate?: Date
  assignee?: User
  createdAt: Date
}

export interface AIConversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  isUnread: boolean
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  activeConversations: number
}
```

## State Management

### Server Components
- Dashboard uses React Server Components for initial data fetching
- Reduces client-side JavaScript bundle size
- Provides better SEO and faster initial renders

### Client-Side Enhancements
- Minimal client-side JavaScript for interactive elements
- Hover effects and click handlers
- Progressive enhancement approach

### Custom Hooks

#### useDashboardData()
- **Purpose**: Manages dashboard data fetching and caching
- **Features**: Loading states, error handling, data validation
- **Usage**: Used by dashboard container component

#### useRecentTasks()
- **Purpose**: Specifically handles recent tasks data
- **Features**: Real-time updates, optimistic updates for status changes
- **Usage**: Used by recent tasks section component

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  mobile: 'default (single column)',
  tablet: 'md: (2+1 layout)',
  desktop: 'lg: (full 3-section layout)'
}
```

### Layout Behavior

- **Mobile (< 768px)**: Single column stack, action cards in vertical layout
- **Tablet (768px - 1024px)**: 2-column action cards with sections below
- **Desktop (> 1024px)**: Full horizontal layout with all sections visible

### Touch Optimization

- Minimum 44px tap targets for mobile devices
- Proper spacing between interactive elements
- Optimized scroll behavior for mobile

## Performance Considerations

### Loading Optimization

1. **Server-Side Rendering**: Initial content rendered on server
2. **Skeleton Loaders**: Smooth loading transitions for async content
3. **Image Optimization**: Properly sized avatars and icons
4. **Bundle Splitting**: Feature-based code splitting

### Caching Strategy

1. **Server Action Caching**: Recent tasks cached for 5 minutes
2. **Component Memoization**: Expensive render operations memoized
3. **Static Assets**: Icons and images properly cached

### Monitoring

1. **Core Web Vitals**: LCP, FID, CLS tracking
2. **Load Time Metrics**: Time to interactive measurement
3. **Error Tracking**: Component error boundaries and logging

## Accessibility

### WCAG Compliance

- **Color Contrast**: All text meets AA standards (4.5:1 ratio minimum)
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Readers**: Proper ARIA labels and semantic HTML structure
- **Focus Management**: Visible focus indicators and logical tab order

### Implementation Details

```typescript
// Accessibility features
const accessibilityFeatures = {
  semanticHTML: 'Using proper heading hierarchy (h1, h2, h3)',
  ariaLabels: 'Descriptive labels for all interactive elements',
  keyboardSupport: 'Tab navigation and Enter/Space activation',
  colorIndependence: 'Information conveyed through multiple channels'
}
```

## Testing Strategy

### Component Testing

```typescript
// Example test structure
describe('ActionCardsSection', () => {
  it('renders all three action cards', () => {
    // Test implementation
  })
  
  it('handles click events correctly', () => {
    // Test implementation
  })
  
  it('displays proper icons and colors', () => {
    // Test implementation
  })
})
```

### Integration Testing

- End-to-end user flows from dashboard to feature pages
- Data fetching and error state handling
- Responsive behavior across device sizes

### Visual Regression Testing

- Screenshot comparison across browsers
- Mobile layout validation
- Dark mode compatibility (future consideration)

## Error Handling

### Error Boundaries

```typescript
// Error boundary implementation
export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<DashboardErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Dashboard error:', error, errorInfo)
        // Log to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Graceful Degradation

1. **Data Loading Failures**: Show empty states with retry options
2. **Network Issues**: Cache previous data when possible
3. **Component Errors**: Isolate failures to prevent full page crashes

## Security Considerations

### Data Access

- All data access through authenticated server actions
- User-specific data filtering at API level
- No sensitive data exposed to client-side

### XSS Prevention

- All user content properly sanitized
- HTML content escaped by default
- Safe handling of user-generated content

## Future Enhancements

### Phase 2 Features

1. **Customizable Layout**: Drag-and-drop dashboard sections
2. **Real-time Updates**: WebSocket integration for live data
3. **Advanced Filtering**: Smart filters for tasks and activities
4. **Dashboard Widgets**: Modular widget system

### Analytics Integration

1. **User Behavior Tracking**: Click patterns and engagement metrics
2. **Feature Usage**: Track which dashboard elements are most used
3. **Performance Monitoring**: Real-time performance metrics

## Maintenance Guidelines

### Code Standards

- Follow established TypeScript patterns
- Maintain consistent component structure
- Use proper error handling and loading states
- Write comprehensive tests for new features

### Performance Monitoring

- Regular performance audits
- Bundle size monitoring
- Core Web Vitals tracking
- User experience metrics

### Documentation Updates

- Keep this documentation current with implementation changes
- Update PRD when requirements evolve
- Maintain component API documentation

## Troubleshooting

### Common Issues

1. **Slow Loading**: Check server action performance and caching
2. **Layout Issues**: Verify responsive breakpoints and CSS grid behavior
3. **Data Not Updating**: Confirm server action cache invalidation
4. **Accessibility Problems**: Run axe-core audits and keyboard testing

### Debug Tools

- React Developer Tools for component inspection
- Network tab for API performance monitoring
- Lighthouse for performance and accessibility audits
- Browser console for error tracking 