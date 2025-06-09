# Organization Feature Documentation

## Overview

The Organization feature provides a comprehensive onboarding wizard for creating organizations, inviting team members, and setting up the initial team structure in GuideLayer AI. This is a critical first-step feature for new users.

## Architecture

### Feature Structure
```
components/features/organization/
├── components/           # React components
│   ├── organization-wizard.tsx    # Main wizard orchestrator
│   ├── business-details-step.tsx  # Step 1: Company information
│   ├── team-planning-step.tsx     # Step 2: Team member invitations
│   ├── review-step.tsx            # Step 3: Review and confirmation
│   ├── wizard-progress.tsx        # Progress indicator
│   └── index.ts                   # Component exports
├── hooks/                # Custom React hooks
│   └── use-organization-wizard.ts # Wizard state management
├── types/                # TypeScript type definitions
│   └── index.ts         # Feature-specific types
├── constants/            # Constants and configuration
│   └── index.ts         # Industry options, validation rules
└── utils/               # Utility functions (if needed)
```

### Server Actions
```
actions/auth/
└── organization-wizard-actions.ts  # Server-side wizard operations
```

### Route
```
app/onboarding/organization/
└── page.tsx             # Organization wizard page
```

## Components

### OrganizationWizard
**File**: `components/organization-wizard.tsx`  
**Type**: Client Component  
**Purpose**: Main orchestrator component that manages the 3-step wizard flow

**Key Features**:
- Wizard step navigation
- Form state management via `useOrganizationWizard` hook
- Server action integration for organization creation
- Error handling and user feedback (toasts)
- Automatic redirection to dashboard on success

### BusinessDetailsStep
**File**: `components/business-details-step.tsx`  
**Type**: Client Component  
**Purpose**: First step collecting basic company information

**Features**:
- Company name validation (real-time availability checking)
- Industry selection dropdown
- Team size selection
- Form validation and error display

### TeamPlanningStep
**File**: `components/team-planning-step.tsx`  
**Type**: Client Component  
**Purpose**: Second step for team member invitations

**Features**:
- Add/remove team members
- Email validation
- Role assignment (client_admin/client_team)
- Maximum team member limits
- Optional step (can be skipped)

### ReviewStep
**File**: `components/review-step.tsx`  
**Type**: Client Component  
**Purpose**: Final step for review and organization creation

**Features**:
- Summary of all collected information
- What happens next explanation
- Final submission handling
- Loading states during creation

### WizardProgress
**File**: `components/wizard-progress.tsx`  
**Type**: Client Component  
**Purpose**: Visual progress indicator for the wizard

**Features**:
- Step status visualization (active/completed/pending)
- Click-to-navigate functionality for completed steps
- Responsive design

## Hooks

### useOrganizationWizard
**File**: `hooks/use-organization-wizard.ts`  
**Purpose**: Centralized state management for the wizard flow

**State Management**:
- Current step tracking
- Form data storage
- Step validation
- Navigation controls
- Team member management

**Key Functions**:
- `goToStep(stepId)` - Navigate to specific step
- `nextStep()` / `previousStep()` - Sequential navigation
- `updateData(updates)` - Update wizard data
- `addTeamMember()` / `removeTeamMember()` - Team management
- `canGoNext()` / `canGoPrevious()` - Navigation validation

## Server Actions

### createOrganizationFromWizardAction
**Purpose**: Create organization and set up initial team structure

**Flow**:
1. Authenticate user
2. Get user's internal ID from Supabase
3. Create organization record
4. Create membership for creator
5. Assign client_admin role
6. Return organization data

### sendTeamInvitationsAction
**Purpose**: Send invitations to team members (MVP placeholder)

**Current Implementation**: Email validation only  
**Future Enhancement**: Clerk organization invitation integration

### validateCompanyNameAction
**Purpose**: Check organization name availability

**Features**:
- Real-time validation
- Database uniqueness check
- Error handling for invalid inputs

## Types

### Core Types
```typescript
interface OrganizationWizardData {
  companyName: string
  industry: string
  teamSize: string
  teamMembers: TeamMemberInvite[]
}

interface TeamMemberInvite {
  email: string
  role: 'client_admin' | 'client_team'
  name?: string
}

interface WizardStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
}
```

## Database Integration

### Tables Used
- `organizations` - Organization creation
- `users` - User lookup by Clerk ID
- `memberships` - User-organization relationships
- `roles` - Role definitions
- `user_roles` - Role assignments

### RLS Policies
Utilizes existing RLS policies for:
- Organization access control
- User data protection
- Membership management

## Authentication & Authorization

### Authentication
- Clerk integration via `auth()` helper
- Automatic redirect for unauthenticated users
- Session token integration with Supabase

### Authorization
- Only authenticated users can create organizations
- Automatic client_admin role assignment for creators
- Protection against duplicate organization creation

## Validation & Error Handling

### Client-Side Validation
- Company name length (2-100 characters)
- Email format validation
- Required field validation
- Real-time availability checking

### Server-Side Validation
- User authentication verification
- Database constraint validation
- Unique company name enforcement
- Role existence verification

### Error Handling
- Toast notifications for user feedback
- Graceful failure recovery
- Detailed error logging
- Fallback UI states

## MVP Limitations & Future Enhancements

### Current MVP Limitations
1. **Team Invitations**: Only email validation, no actual invitations sent
2. **Company Metadata**: Only name stored (industry/team size not persisted)
3. **Single Organization**: Users can only create one organization
4. **No Organization Management**: No post-creation editing

### Planned Enhancements
1. **Clerk Integration**: Full organization invitation system
2. **Metadata Storage**: Extended organization profile fields
3. **Multi-Organization Support**: Multiple organization membership
4. **Organization Settings**: Post-creation management interface
5. **Invitation Templates**: Customizable invitation emails
6. **Analytics**: Onboarding completion tracking

## Testing Strategy

### Unit Tests
- Hook state management (`useOrganizationWizard`)
- Form validation logic
- Server action success/failure cases

### Integration Tests
- Complete wizard flow
- Database operations
- Authentication integration
- Navigation between steps

### E2E Tests
- Full onboarding journey
- Error scenarios
- Responsive design validation
- Accessibility compliance

## Performance Considerations

### Optimization Strategies
- Form state managed locally (no unnecessary re-renders)
- Real-time validation with debouncing (500ms)
- Lazy loading of non-critical components
- Optimistic UI updates where appropriate

### Loading States
- Company name validation indicator
- Form submission loading
- Step transition animations
- Error recovery mechanisms

## Accessibility

### WCAG Compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management
- Error announcements

### Implementation Details
- Semantic HTML structure
- ARIA labels and descriptions
- Form field associations
- Progressive enhancement

## Security Considerations

### Data Protection
- Client-side input sanitization
- Server-side validation
- SQL injection prevention (via Supabase)
- XSS protection (React built-in)

### Authentication Security
- Clerk session management
- Token-based Supabase access
- RLS policy enforcement
- Automatic session expiry handling

## Monitoring & Analytics

### Success Metrics
- Onboarding completion rate
- Step abandonment analysis
- Time-to-completion tracking
- Error frequency monitoring

### Implementation
- PostHog event tracking (when integrated)
- Server action success/failure logging
- User interaction analytics
- Performance monitoring

## Deployment & Configuration

### Environment Variables
- Supabase credentials (existing)
- Clerk configuration (existing)
- No additional environment setup required

### Database Requirements
- Existing schema tables
- RLS policies in place
- Role seed data required

### Dependencies
- All UI components from shadcn/ui
- Clerk authentication system
- Supabase client integration
- React Hook Form patterns (future enhancement)

## Related Features

### Dependencies
- Authentication system (Clerk + Supabase)
- Database schema and RLS policies
- UI component library (shadcn/ui)

### Related Components
- Dashboard (redirect target)
- User settings (future organization management)
- Team management (future team administration)

### Integration Points
- Onboarding flow entry point
- Dashboard welcome experience
- Role-based feature access 