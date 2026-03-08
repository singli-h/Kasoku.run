/**
 * Types for performance analytics features
 */

import React from 'react'

export interface PeerComparison {
  metric: string
  userValue: number
  peerAverage: number
  percentile: number
  unit: string
  category: string
  sampleSize: number
  trend: 'above' | 'below' | 'average'
}

export interface BenchmarkData {
  id: string
  name: string
  category: string
  userValue: number
  benchmarks: {
    beginner: number
    intermediate: number
    advanced: number
    elite: number
  }
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  unit: string
  icon: React.ElementType
}

export interface GroupComparison {
  groupId: string
  groupName: string
  memberCount: number
  userRank: number
  metrics: {
    totalVolume: { user: number; groupAvg: number; percentile: number }
    avgIntensity: { user: number; groupAvg: number; percentile: number }
    consistency: { user: number; groupAvg: number; percentile: number }
    improvement: { user: number; groupAvg: number; percentile: number }
  }
  anonymized: boolean
}

export interface PerformancePercentile {
  metric: string
  value: number
  percentile: number
  unit: string
  category: string
  comparison: 'age-group' | 'weight-class' | 'experience-level' | 'overall'
  sampleSize: number
  icon: React.ElementType
  color: string
}

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  icon: React.ElementType
  color: string
}

export interface ExerciseProgress {
  exerciseId: string
  exerciseName: string
  category: string
  personalRecord: {
    weight: number
    reps: number
    date: string
  }
  recentProgress: Array<{
    date: string
    weight: number
    reps: number
    sets: number
    volume: number
    rpe: number
  }>
  trends: {
    volume: 'up' | 'down' | 'stable'
    strength: 'up' | 'down' | 'stable'
    consistency: number
  }
}

export interface GoalProgress {
  id: string
  title: string
  category: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  progress: number
  status: 'on-track' | 'behind' | 'ahead' | 'completed'
}