/**
 * Workout Error and Loading Components Tests
 * Comprehensive tests for error boundary and loading state components
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { FeatureErrorBoundary } from '@/components/error-boundary'
import { 
  LoadingSpinner, 
  WorkoutLoadingCard, 
  SessionLoadingSkeleton, 
  WorkoutActionLoading, 
  WorkoutPageLoading 
} from '@/components/features/workout/components/error-loading/workout-loading-states'

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('Feature Error Boundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error')
    }
    return <div>No error</div>
  }

  it('should render children when there is no error', () => {
    render(
      <FeatureErrorBoundary featureName="Workout">
        <ThrowError shouldThrow={false} />
      </FeatureErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should render error UI when there is an error', () => {
    render(
      <FeatureErrorBoundary featureName="Workout" customMessage="Something went wrong while loading your workout.">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )

    expect(screen.getByText('Workout Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong while loading your workout.')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should retry when Try Again is clicked', () => {
    const { rerender } = render(
      <FeatureErrorBoundary featureName="Workout">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )

    expect(screen.getByText('Workout Error')).toBeInTheDocument()

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'))

    // Rerender with no error
    rerender(
      <FeatureErrorBoundary featureName="Workout">
        <ThrowError shouldThrow={false} />
      </FeatureErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <FeatureErrorBoundary featureName="Workout">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )

    expect(screen.getByText('Error Details')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('should render with default size', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('should render with different sizes', () => {
      render(<LoadingSpinner size="sm" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('custom-class')
    })
  })

  describe('WorkoutLoadingCard', () => {
    it('should render with title and description', () => {
      render(
        <WorkoutLoadingCard 
          title="Loading Workout"
          description="Please wait while we load your workout data"
        />
      )

      expect(screen.getByText('Loading Workout')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we load your workout data')).toBeInTheDocument()
    })

    it('should render with progress bar when showProgress is true', () => {
      render(
        <WorkoutLoadingCard 
          title="Loading Workout"
          description="Loading..."
          showProgress={true}
          progress={50}
        />
      )

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should render with custom icon', () => {
      const customIcon = <span>🏋️</span>
      render(
        <WorkoutLoadingCard 
          title="Loading Workout"
          description="Loading..."
          icon={customIcon}
        />
      )

      expect(screen.getByText('🏋️')).toBeInTheDocument()
    })
  })

  describe('SessionLoadingSkeleton', () => {
    it('should render default number of skeletons', () => {
      render(<SessionLoadingSkeleton />)
      
      // Should render 3 skeleton cards by default
      const skeletons = screen.getAllByRole('status', { hidden: true })
      expect(skeletons).toHaveLength(3)
    })

    it('should render custom number of skeletons', () => {
      render(<SessionLoadingSkeleton count={5} />)
      
      const skeletons = screen.getAllByRole('status', { hidden: true })
      expect(skeletons).toHaveLength(5)
    })

    it('should apply custom className', () => {
      render(<SessionLoadingSkeleton className="custom-skeleton" />)
      
      const container = screen.getByRole('status', { hidden: true }).parentElement
      expect(container).toHaveClass('custom-skeleton')
    })
  })

  describe('WorkoutActionLoading', () => {
    it('should render starting action', () => {
      render(<WorkoutActionLoading action="starting" />)
      
      expect(screen.getByText('Starting Workout')).toBeInTheDocument()
      expect(screen.getByText('Preparing your session...')).toBeInTheDocument()
    })

    it('should render saving action', () => {
      render(<WorkoutActionLoading action="saving" />)
      
      expect(screen.getByText('Saving Progress')).toBeInTheDocument()
      expect(screen.getByText('Saving your workout data...')).toBeInTheDocument()
    })

    it('should render completing action', () => {
      render(<WorkoutActionLoading action="completing" />)
      
      expect(screen.getByText('Completing Workout')).toBeInTheDocument()
      expect(screen.getByText('Finalizing your session...')).toBeInTheDocument()
    })

    it('should render pausing action', () => {
      render(<WorkoutActionLoading action="pausing" />)
      
      expect(screen.getByText('Pausing Workout')).toBeInTheDocument()
      expect(screen.getByText('Pausing your session...')).toBeInTheDocument()
    })

    it('should render resuming action', () => {
      render(<WorkoutActionLoading action="resuming" />)
      
      expect(screen.getByText('Resuming Workout')).toBeInTheDocument()
      expect(screen.getByText('Resuming your session...')).toBeInTheDocument()
    })
  })

  describe('WorkoutPageLoading', () => {
    it('should render page loading skeleton', () => {
      render(<WorkoutPageLoading />)
      
      // Should render various skeleton elements
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<WorkoutPageLoading className="custom-loading" />)
      
      const container = screen.getByRole('status', { hidden: true }).parentElement
      expect(container).toHaveClass('custom-loading')
    })
  })
})
