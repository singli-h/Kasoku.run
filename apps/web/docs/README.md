# Kasoku Documentation Hub

Welcome to the comprehensive documentation for Kasoku, an AI-powered fitness and running training platform. This documentation is organized into seven main categories to help developers, designers, and stakeholders understand and contribute to the project effectively.

## 📁 Documentation Structure

### 🏗️ [Architecture](./architecture/)
Core architectural patterns, component architecture, and system design principles.
- **[Architecture Design Cheatsheet](./architecture/architecture-design-cheatsheet.md)** - Complete system overview and design patterns
- **[Component Architecture](./architecture/component-architecture.md)** - Component organization and patterns
- **[Layout System Architecture](./architecture/layout-system-architecture.md)** - Layout patterns and responsive design

### 🎨 [Design](./design/)
UI/UX patterns, design system, styling guidelines, and visual design principles.
- **[Design System Overview](./design/design-system-overview.md)** - Complete design system and technology stack
- **[Web Application Design Details](./design/web-application-design-details.md)** - Detailed design specifications

### ✨ [Features](./features/)
Feature-specific documentation with detailed implementation guides for each major application feature.
- **[Feature Overview](./features/feature-overview.md)** - Complete feature breakdown and implementation status
- **[MVP Next Steps](./features/mvp-next-steps.md)** - Development priorities and roadmap
- **[Product Requirements Document](./features/product-requirements-document.txt)** - Original PRD specifications
- **[Kasoku Rebuild Product Requirements](./features/kasoku-rebuild-product-requirements.md)** - Updated requirements

#### Feature-Specific Documentation:
- **[Onboarding](./features/onboarding/)** - User registration and setup flow
- **[Dashboard](./features/dashboard/)** - Main user dashboard and analytics
- **[Workout](./features/workout/)** - Exercise execution and tracking
- **[Plans](./features/plans/)** - Training plan creation and management
  - **[Mesowizard Session Planning](./features/plans/mesowizard-session-planning-overview.md)** - Advanced planning system
- **[Sessions](./features/sessions/)** - Training session management
- **[Athletes](./features/athletes/)** - Athlete management and profiling
- **[Performance](./features/performance/)** - Analytics and performance tracking
- **[Settings](./features/settings/)** - User preferences and configuration
  - **[Settings Feature Documentation](./features/settings/settings-feature-documentation.md)** - Detailed settings implementation
- **[Library](./features/library/)** - Exercise library and resources

### 🔒 [Security](./security/)
Authentication, authorization, data protection, and security patterns.
- **[Row Level Security Analysis](./security/row-level-security-analysis.md)** - Database security and access control

### 🔗 [Integrations](./integrations/)
External service integrations, APIs, and third-party service documentation.

### 🛠️ [Development](./development/)
Development workflows, API documentation, performance optimization, and coding standards.
- **[API Architecture](./development/api-architecture.md)** - Complete API documentation and patterns
- **[Performance Optimization](./development/performance-optimization.md)** - Performance best practices and optimization
- **[Package Status](./development/package-status.md)** - Current package versions and update policy
- **[Taskmaster Development Workflow](./development/taskmaster-development-workflow.md)** - Development process and tooling

### 🚀 [Deployment](./deployment/)
Build configurations, deployment processes, environment setup, and production considerations.
- **[Next.js 16 Migration Summary](./deployment/nextjs16-migration-summary.md)** - Complete migration documentation and current status

## 📖 How to Use This Documentation

### For New Developers
1. Start with **[Architecture Design Cheatsheet](./architecture/architecture-design-cheatsheet.md)** for system overview
2. Review **[Design System Overview](./design/design-system-overview.md)** for UI/UX patterns
3. Check **[Feature Overview](./features/feature-overview.md)** for functionality understanding
4. Refer to specific feature folders for detailed implementation guides

### For Designers
1. Review **[Design System Overview](./design/design-system-overview.md)** for design principles
2. Check **[Web Application Design Details](./design/web-application-design-details.md)** for implementation details
3. Refer to individual feature documentation for specific UI requirements

### For Contributors
1. Review **[Development Workflow](./development/taskmaster-development-workflow.md)** for contribution guidelines
2. Check **[API Architecture](./development/api-architecture.md)** for backend integration
3. Review **[Security](./security/)** documentation for security requirements

## 🔍 Key Topics

### Technology Stack
- **Frontend**: Next.js 16.0.10, React 19.2.1, TypeScript 5.x
- **UI**: Radix UI, Tailwind CSS 4.1.0, Framer Motion 12.0.0, shadcn/ui
- **Backend**: Supabase (PostgreSQL), Clerk Authentication 6.36.2
- **Development**: Turborepo, ESLint, Prettier
- **Additional**: TanStack Query 5.90.12, React Hook Form 7.68.0, Zod 4.1.13, AI SDK 5.0.112

### Core Concepts
- **Component Architecture**: Hybrid structure with ui/, composed/, features/ layers
- **State Management**: React Context + TanStack Query for server state
- **Authentication**: Clerk with Supabase RLS integration
- **Data Flow**: Server Actions → API Routes → Database
- **Security**: Row-level security, middleware protection, RBAC

### Development Patterns
- **Server Components**: Data fetching and static content
- **Client Components**: Interactive UI and state management
- **Error Boundaries**: Comprehensive error handling
- **Performance**: Suspense boundaries, caching, optimization

## 📋 Documentation Standards

### Naming Conventions
- Use kebab-case for file names: `component-architecture.md`
- Descriptive, specific names that indicate content
- Include relevant keywords for searchability

### Content Organization
- Start with overview/summary
- Include table of contents for longer documents
- Use consistent heading hierarchy (H1 → H2 → H3)
- Include code examples with proper syntax highlighting
- Add cross-references to related documentation

### Maintenance
- Keep documentation current with code changes
- Update references when files are moved or renamed
- Review and update regularly based on development progress

## 🤝 Contributing to Documentation

1. **Follow established patterns** from existing documentation
2. **Use consistent formatting** and naming conventions
3. **Include practical examples** and code snippets
4. **Add cross-references** to related documentation
5. **Keep content focused** and well-organized

For questions about documentation structure or content, refer to the [Architecture Design Cheatsheet](./architecture/architecture-design-cheatsheet.md) for guidance on system organization and patterns.
