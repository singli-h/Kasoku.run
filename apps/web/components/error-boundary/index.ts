/*
<ai_context>
Central export point for all error boundary components and utilities.
</ai_context>
*/

export { GlobalErrorBoundary, default as GlobalErrorBoundaryDefault } from './global-error-boundary'
export { FeatureErrorBoundary, default as FeatureErrorBoundaryDefault } from './feature-error-boundary'
export { ErrorFallback } from '@/components/layout/error-fallback'

// Re-export react-error-boundary for advanced use cases
export { ErrorBoundary } from 'react-error-boundary'

