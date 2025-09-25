/**
 * Workout Components Tests
 * Comprehensive tests for workout reusable components
 */

import { render, screen } from '@testing-library/react'
import { 
  WorkoutSessionStatusBadge as SessionStatusBadge,
  WorkoutSessionDateDisplay as SessionDateDisplay,
  WorkoutSessionDurationDisplay as SessionDurationDisplay,
  WorkoutSessionExerciseCount as SessionExerciseCount,
  WorkoutSessionCard as SessionCard
} from '@/components/composed'
import type { ExerciseTrainingSessionWithDetails } from '@/types/training'

// Mock data
const mockSession: ExerciseTrainingSessionWithDetails = {
  id: 1,
  session_status: 'ongoing',
  date_time: '2024-01-15T10:00:00Z',
  week: 1,
  day: 1,
  notes: 'Great workout!',
  exercise_preset_group: {
    id: 1,
    name: 'Morning Workout',
    description: 'A great morning routine',
    exercise_presets: [
      {
        id: 1,
        duration_minutes: 30,
        exercise: {
          id: 1,
          name: 'Push-ups',
          exercise_type: {
            id: 1,
            name: 'Strength'
          }
        }
      },
      {
        id: 2,
        duration_minutes: 20,
        exercise: {
          id: 2,
          name: 'Squats',
          exercise_type: {
            id: 2,
            name: 'Strength'
          }
        }
      }
    ]
  }
}

describe('Workout Components', () => {
  describe('SessionStatusBadge', () => {
    it('should render assigned status correctly', () => {
      render(<SessionStatusBadge status="assigned" />)
      
      expect(screen.getByText('Assigned')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('bg-yellow-100')
    })

    it('should render ongoing status correctly', () => {
      render(<SessionStatusBadge status="ongoing" />)
      
      expect(screen.getByText('Ongoing')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('bg-blue-100')
    })

    it('should render completed status correctly', () => {
      render(<SessionStatusBadge status="completed" />)
      
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('bg-green-100')
    })

    it('should render cancelled status correctly', () => {
      render(<SessionStatusBadge status="cancelled" />)
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('bg-red-100')
    })

    it('should render with different sizes', () => {
      render(<SessionStatusBadge status="assigned" size="lg" />)
      
      expect(screen.getByRole('status')).toHaveClass('text-base')
    })

    it('should hide icon when showIcon is false', () => {
      render(<SessionStatusBadge status="assigned" showIcon={false} />)
      
      // Icon should not be visible
      const icon = screen.queryByRole('img')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('SessionDateDisplay', () => {
    it('should render date correctly', () => {
      render(<SessionDateDisplay session={mockSession} />)
      
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    })

    it('should render with different formats', () => {
      render(<SessionDateDisplay session={mockSession} format="medium" />)
      
      // Should include time in medium format
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('should handle missing date', () => {
      const sessionWithoutDate = { ...mockSession, date_time: null }
      render(<SessionDateDisplay session={sessionWithoutDate} />)
      
      expect(screen.getByText('No date')).toBeInTheDocument()
    })

    it('should render with different sizes', () => {
      render(<SessionDateDisplay session={mockSession} size="lg" />)
      
      expect(screen.getByText('Jan 15, 2024')).toHaveClass('text-base')
    })
  })

  describe('SessionDurationDisplay', () => {
    it('should calculate duration from exercise presets', () => {
      render(<SessionDurationDisplay session={mockSession} />)
      
      // Total duration should be 50 minutes (30 + 20)
      expect(screen.getByText('50 min')).toBeInTheDocument()
    })

    it('should estimate duration when no preset duration', () => {
      const sessionWithoutDuration = {
        ...mockSession,
        exercise_preset_group: {
          ...mockSession.exercise_preset_group!,
          exercise_presets: [
            {
              ...mockSession.exercise_preset_group!.exercise_presets![0],
              duration_minutes: 0
            }
          ]
        }
      }
      
      render(<SessionDurationDisplay session={sessionWithoutDuration} />)
      
      // Should estimate 3 minutes per exercise
      expect(screen.getByText('3 min')).toBeInTheDocument()
    })

    it('should handle missing exercise presets', () => {
      const sessionWithoutPresets = {
        ...mockSession,
        exercise_preset_group: {
          ...mockSession.exercise_preset_group!,
          exercise_presets: []
        }
      }
      
      render(<SessionDurationDisplay session={sessionWithoutPresets} />)
      
      expect(screen.getByText('0 min')).toBeInTheDocument()
    })

    it('should format hours and minutes correctly', () => {
      const longSession = {
        ...mockSession,
        exercise_preset_group: {
          ...mockSession.exercise_preset_group!,
          exercise_presets: [
            {
              ...mockSession.exercise_preset_group!.exercise_presets![0],
              duration_minutes: 90
            }
          ]
        }
      }
      
      render(<SessionDurationDisplay session={longSession} />)
      
      expect(screen.getByText('1h 30m')).toBeInTheDocument()
    })
  })

  describe('SessionExerciseCount', () => {
    it('should count exercises correctly', () => {
      render(<SessionExerciseCount session={mockSession} />)
      
      expect(screen.getByText('2 exercises')).toBeInTheDocument()
    })

    it('should handle singular form', () => {
      const singleExerciseSession = {
        ...mockSession,
        exercise_preset_group: {
          ...mockSession.exercise_preset_group!,
          exercise_presets: [mockSession.exercise_preset_group!.exercise_presets![0]]
        }
      }
      
      render(<SessionExerciseCount session={singleExerciseSession} />)
      
      expect(screen.getByText('1 exercise')).toBeInTheDocument()
    })

    it('should handle missing exercise presets', () => {
      const sessionWithoutPresets = {
        ...mockSession,
        exercise_preset_group: {
          ...mockSession.exercise_preset_group!,
          exercise_presets: []
        }
      }
      
      render(<SessionExerciseCount session={sessionWithoutPresets} />)
      
      expect(screen.getByText('0 exercises')).toBeInTheDocument()
    })

    it('should render with different icon types', () => {
      render(<SessionExerciseCount session={mockSession} iconType="dumbbell" />)
      
      // Should render with dumbbell icon
      expect(screen.getByText('2 exercises')).toBeInTheDocument()
    })
  })

  describe('SessionCard', () => {
    it('should render session card correctly', () => {
      render(<SessionCard session={mockSession} />)
      
      expect(screen.getByText('Morning Workout')).toBeInTheDocument()
      expect(screen.getByText('Ongoing')).toBeInTheDocument()
      expect(screen.getByText('A great morning routine')).toBeInTheDocument()
      expect(screen.getByText('Great workout!')).toBeInTheDocument()
      expect(screen.getByText('Week 1, Day 1')).toBeInTheDocument()
    })

    it('should render with action button', () => {
      const mockOnAction = jest.fn()
      render(
        <SessionCard 
          session={mockSession} 
          onAction={mockOnAction}
          actionLabel="Continue"
        />
      )
      
      expect(screen.getByText('Continue')).toBeInTheDocument()
      
      // Click the button
      screen.getByText('Continue').click()
      expect(mockOnAction).toHaveBeenCalledWith(mockSession)
    })

    it('should render without details when showDetails is false', () => {
      render(<SessionCard session={mockSession} showDetails={false} />)
      
      expect(screen.getByText('Morning Workout')).toBeInTheDocument()
      expect(screen.queryByText('A great morning routine')).not.toBeInTheDocument()
    })

    it('should handle missing preset group', () => {
      const sessionWithoutPresetGroup = { ...mockSession, exercise_preset_group: null }
      const { container } = render(<SessionCard session={sessionWithoutPresetGroup} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should render with different action icons', () => {
      render(
        <SessionCard 
          session={mockSession} 
          actionLabel="View Details"
          actionIcon={<span>👁️</span>}
        />
      )
      
      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('👁️')).toBeInTheDocument()
    })
  })
})
