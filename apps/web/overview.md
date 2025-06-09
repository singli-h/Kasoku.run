Kasoku Running Website - Complete Documentation
Overview
Kasoku is a comprehensive AI-powered fitness and running training platform built with Next.js 14, featuring a sophisticated training periodization system, real-time performance tracking, and personalized coaching capabilities. The application serves both athletes and coaches with role-based access control and comprehensive workout management.
Technology Stack
Frontend
Framework: Next.js 15.1+ with App Router
UI Library: React 19+
Styling: Tailwind CSS 3.3.2 with custom animations
Component Library: Radix UI primitives with shadcn/ui components
Animation: Framer Motion 12.6+ for smooth transitions
Icons: Lucide React for consistent iconography
State Management: React Context API with custom hooks
Backend & Database
Database: Supabase (PostgreSQL) with Row Level Security (RLS)
Authentication: Clerk 6.16+ with Supabase integration
API: Next.js API routes with server actions
Real-time: Supabase real-time subscriptions
File Storage: Supabase Storage for media assets
Development Tools
Language: TypeScript 5.8+
Linting: ESLint with TypeScript support
Formatting: Prettier
Package Manager: npm
Build Tool: Next.js built-in bundler
Project Architecture
Directory Structure
Apply to index.ts
middleware
Authentication & Authorization
Authentication System
Primary Provider: Clerk for user authentication
Integration: Native Clerk + Supabase integration (2025 pattern)
Session Management: Clerk handles sessions, tokens passed to Supabase
Social Auth: Google, GitHub (Facebook disabled)
Authorization & Roles
Role-Based Access Control: Athletes vs Coaches
Middleware Protection: Route-level protection via middleware.ts
Role Injection: User role data injected via headers for server components
Protected Routes
Apply to index.ts
)
Role-Specific Redirects
Coach-only pages: /sessions, /athletes, /insights
Non-coach users: Redirected to / (home) when accessing coach-only pages
Core Features & Components
1. Landing Page System
Hero Section (components/landing/Hero.jsx)
Animated Background: Gradient blobs with blur effects
Dynamic CTAs: Different buttons for authenticated vs unauthenticated users
Responsive Design: Mobile-first approach with Framer Motion animations
Features Section (components/landing/Features.jsx)
AI-Powered Insights: Highlighting AI capabilities
Performance Tracking: Real-time metrics display
Personalized Coaching: Adaptive training plans
Pricing Section (components/landing/Pricing.jsx)
Tiered Plans: Free trial, Pro, Enterprise
Feature Comparison: Clear value proposition
Stripe Integration: Ready for payment processing
2. Training Plan Management
MesoWizard (components/mesoWizard/)
The core training plan creation system with a multi-step wizard:
Step 1: Plan Selection
Choose between Mesocycle, Microcycle, or Macrocycle
Different planning approaches for different time horizons
Step 2: Plan Overview
Basic parameters configuration
Duration, intensity, goals setting
Athlete/group assignment
Step 3: Session & Exercise Planning
Detailed session configuration
Exercise selection and ordering
Superset creation and management
Progression model assignment
Step 4: Confirmation & AI Review
Final review of training plan
AI-powered optimization suggestions
Plan finalization and assignment
Key Features:
AI Integration: Intelligent exercise suggestions and plan optimization
Drag & Drop: Intuitive exercise reordering
Superset Management: Complex exercise grouping
Progression Models: Automated progression tracking
Real-time Validation: Form validation with error handling
3. Workout Execution System
Exercise Dashboard (components/workout/components/ExerciseDashboard.jsx)
The main workout interface for athletes:
Session Management:
Session status tracking (assigned → ongoing → completed)
Real-time progress updates
Auto-save functionality
Exercise Organization:
Grouped by exercise type (warm-up, gym, circuit, etc.)
Superset visualization and execution
Order preservation and smart grouping
Performance Tracking:
Set-by-set data entry
Multiple metrics (reps, weight, RPE, velocity, power)
Rest timer integration
Video guidance integration
Exercise Types Support:
Apply to index.ts
}
4. User Onboarding Flow
Multi-Step Onboarding (components/onboarding/)
Comprehensive user setup process:
Welcome Step: Introduction and overview
Role Selection: Athlete vs Coach selection
Profile Details: Role-specific information collection
Subscription Setup: Plan selection and payment
Dashboard Tour: Feature introduction
Workout Tour: Exercise system walkthrough
Completion: Final setup and redirection
Role-Specific Flows:
Athletes: Personal details, fitness goals, experience level
Coaches: Certification, specialization, athlete group setup
5. API Architecture
Dynamic Table API (api/[table]/route.ts)
Generic CRUD operations for any database table:
Apply to index.ts
record
Specialized APIs:
AI Exercise Details: /api/ai/exercise-details/
User Management: /api/users/
Training Sessions: /api/workout/
Plan Management: /api/plans/
Athlete Management: /api/athletes/
6. Database Schema & Types
Core Entities:
Users Table:
Clerk integration with clerk_id
Role-based access (athlete/coach)
Onboarding status tracking
Profile information
Exercise System:
exercises: Exercise definitions
exercise_preset_groups: Planned training sessions
exercise_presets: Individual exercises within sessions
exercise_training_sessions: Actual performed sessions
exercise_training_details: Set-by-set performance data
Training Periodization:
macrocycles: Long-term training periods (months/year)
mesocycles: Medium-term training blocks (weeks)
microcycles: Short-term training weeks
Hierarchical relationship with proper foreign keys
Athlete-Coach Relationship:
athletes: Athlete profiles
coaches: Coach profiles
athlete_groups: Group management
Many-to-many relationships supported
State Management
Context Providers
UserRoleContext (context/UserRoleContext.tsx)
Manages user role and permissions:
Apply to index.ts
}
ExerciseContext (components/workout/ExerciseContext.jsx)
Manages workout session state:
Exercise data and updates
Video player state
Session progress tracking
Custom Hooks
useMesoWizardState
Complex state management for training plan creation:
Form data management
Step navigation
Validation handling
API integration
useExerciseData
Workout session data management:
Session loading and status
Exercise CRUD operations
Real-time updates
Security & Performance
Security Measures
Row Level Security (RLS): Database-level access control
Clerk Authentication: Industry-standard auth provider
API Route Protection: Middleware-based route protection
Environment Variables: Secure configuration management
Service Role Isolation: Server-only admin operations
Performance Optimizations
Server Components: Reduced client-side JavaScript
Suspense Boundaries: Proper loading states
Image Optimization: Next.js Image component
Code Splitting: Automatic route-based splitting
Caching: Supabase query caching
Development Patterns
Component Architecture
Server Components: Data fetching and static content
Client Components: Interactive UI and state management
Compound Components: Complex UI patterns (wizards, dashboards)
Custom Hooks: Reusable stateful logic
Error Handling
Error Boundaries: React error boundary implementation
API Error Responses: Standardized error format
Form Validation: Real-time validation with error display
Loading States: Comprehensive loading UI
Type Safety
Generated Types: Supabase type generation
Strict TypeScript: Full type coverage
Interface Definitions: Clear data contracts
Type Guards: Runtime type checking
Deployment & Configuration
Environment Variables
Apply to index.ts
Run
only
Build Configuration
Next.js Config: Custom webpack and build settings
Tailwind Config: Extended theme and animations
TypeScript Config: Strict mode with path mapping
ESLint Config: Code quality enforcement
Key Workflows
1. New User Registration
User signs up via Clerk
Redirected to onboarding flow
Role selection (athlete/coach)
Profile completion
Subscription setup (if applicable)
Dashboard tour
Redirect to appropriate dashboard
2. Training Plan Creation (Coach)
Access Plans page
Launch MesoWizard
Select plan type (meso/micro/macrocycle)
Configure basic parameters
Design sessions and exercises
Review and finalize
Assign to athletes/groups
3. Workout Execution (Athlete)
Access Workout page
View assigned session
Start session
Execute exercises with data entry
Complete session
Review performance data
4. Performance Tracking
Real-time data collection during workouts
Automatic progression calculations
Performance analytics and insights
Coach review and feedback
