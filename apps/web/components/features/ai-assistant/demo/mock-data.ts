import { ChatMessage, MockSession, SessionChange, SessionExercise, SetChange } from './types'

export const mockSession: MockSession = {
  id: 'session-1',
  name: 'Monday - Upper Body Strength',
  date: 'Today, Dec 19',
  status: 'upcoming',
  exercises: [
    {
      id: 'ex-1',
      name: 'Back Squat',
      exerciseOrder: 1,
      supersetId: null,
      sets: [
        { setIndex: 1, reps: 5, weight: 140, percentage: 70, power: 1400, velocity: null, duration: null, restTime: 180, rpe: 6, tempo: '2-0-X-0', distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 4, weight: 160, percentage: 80, power: 1500, velocity: null, duration: null, restTime: 180, rpe: 7, tempo: '2-0-X-0', distance: null, heartRate: null, calories: null },
        { setIndex: 3, reps: 3, weight: 180, percentage: 90, power: 1600, velocity: null, duration: null, restTime: 240, rpe: 8, tempo: '2-0-X-0', distance: null, heartRate: null, calories: null },
      ],
    },
    {
      id: 'ex-2',
      name: 'Bench Press',
      exerciseOrder: 2,
      supersetId: null,
      sets: [
        // 12 columns: Reps, kg, %, W, m/s, TUT, Rest, RPE, Tempo, HR, kcal (distance excluded as null)
        { setIndex: 1, reps: 8, weight: 80, percentage: 65, power: 850, velocity: 0.45, duration: 24, restTime: 120, rpe: 7, tempo: '3-0-2-0', distance: null, heartRate: 145, calories: 12 },
        { setIndex: 2, reps: 8, weight: 85, percentage: 70, power: 920, velocity: 0.42, duration: 24, restTime: 120, rpe: 8, tempo: '3-0-2-0', distance: null, heartRate: 152, calories: 14 },
        { setIndex: 3, reps: 6, weight: 90, percentage: 75, power: 980, velocity: 0.38, duration: 18, restTime: 150, rpe: 9, tempo: '3-0-2-0', distance: null, heartRate: 158, calories: 11 },
      ],
    },
    // Superset A - exercises 3a and 3b
    {
      id: 'ex-3a',
      name: 'Lateral Raises',
      exerciseOrder: 3,
      supersetId: 'superset-a',
      supersetLabel: 'A',
      sets: [
        { setIndex: 1, reps: 12, weight: 10, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 12, weight: 10, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 3, reps: 12, weight: 10, percentage: null, power: null, velocity: null, duration: null, restTime: 60, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
      ],
    },
    {
      id: 'ex-3b',
      name: 'Face Pulls',
      exerciseOrder: 4,
      supersetId: 'superset-a',
      supersetLabel: 'B',
      sets: [
        { setIndex: 1, reps: 15, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 15, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 3, reps: 15, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 60, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
      ],
    },
    {
      id: 'ex-4',
      name: 'Barbell Row',
      exerciseOrder: 5,
      supersetId: null,
      sets: [
        { setIndex: 1, reps: 8, weight: 60, percentage: null, power: null, velocity: null, duration: null, restTime: 120, rpe: 7, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 8, weight: 65, percentage: null, power: null, velocity: null, duration: null, restTime: 120, rpe: 8, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 3, reps: 8, weight: 70, percentage: null, power: null, velocity: null, duration: null, restTime: 120, rpe: 8, tempo: null, distance: null, heartRate: null, calories: null },
      ],
    },
    // Exercise with ALL columns - demonstrates horizontal scrolling
    {
      id: 'ex-5',
      name: 'Power Clean',
      exerciseOrder: 6,
      supersetId: null,
      sets: [
        { setIndex: 1, reps: 3, weight: 70, percentage: 65, power: 1200, velocity: null, duration: null, restTime: 180, rpe: 6, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 3, weight: 80, percentage: 75, power: 1400, velocity: null, duration: null, restTime: 180, rpe: 7, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null },
        { setIndex: 3, reps: 2, weight: 90, percentage: 85, power: 1600, velocity: null, duration: null, restTime: 240, rpe: 8, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null },
        { setIndex: 4, reps: 2, weight: 95, percentage: 90, power: 1750, velocity: null, duration: null, restTime: 240, rpe: 9, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null },
      ],
    },
  ],
}

// Comprehensive demo changes covering all scenarios
export const mockPendingChanges: SessionChange[] = [
  // 1. SWAP - Replace exercise (keep sets)
  {
    id: 'change-1',
    type: 'swap',
    targetExerciseId: 'ex-1',
    exerciseName: 'Back Squat',
    newExerciseName: 'Safety Bar Squat',
    preserveSets: true,
    description: 'Swap for Safety Bar Squat',
    aiReasoning: 'Reduces shoulder strain, same muscle activation',
  },

  // 2. UPDATE - Specific set value changes (reduce intensity across ALL metrics) - 11 columns with changes
  {
    id: 'change-2',
    type: 'update',
    targetExerciseId: 'ex-2',
    exerciseName: 'Bench Press',
    description: 'Reduce intensity 10% across all metrics',
    aiReasoning: 'Lighter load to protect shoulder - adjusting weight, power, velocity, tempo, and recovery metrics',
    setChanges: [
      // Set 2 changes - all 11 data columns
      { setIndex: 2, field: 'reps', oldValue: 8, newValue: 10 },
      { setIndex: 2, field: 'weight', oldValue: 85, newValue: 77 },
      { setIndex: 2, field: 'percentage', oldValue: 70, newValue: 63 },
      { setIndex: 2, field: 'power', oldValue: 920, newValue: 830 },
      { setIndex: 2, field: 'velocity', oldValue: 0.42, newValue: 0.48 },
      { setIndex: 2, field: 'duration', oldValue: 24, newValue: 30 },
      { setIndex: 2, field: 'restTime', oldValue: 120, newValue: 150 },
      { setIndex: 2, field: 'rpe', oldValue: 8, newValue: 6 },
      { setIndex: 2, field: 'tempo', oldValue: '3-0-2-0', newValue: '4-0-2-0' },
      { setIndex: 2, field: 'heartRate', oldValue: 152, newValue: 140 },
      { setIndex: 2, field: 'calories', oldValue: 14, newValue: 12 },
      // Set 3 changes - all 11 data columns
      { setIndex: 3, field: 'reps', oldValue: 6, newValue: 8 },
      { setIndex: 3, field: 'weight', oldValue: 90, newValue: 81 },
      { setIndex: 3, field: 'percentage', oldValue: 75, newValue: 68 },
      { setIndex: 3, field: 'power', oldValue: 980, newValue: 880 },
      { setIndex: 3, field: 'velocity', oldValue: 0.38, newValue: 0.45 },
      { setIndex: 3, field: 'duration', oldValue: 18, newValue: 24 },
      { setIndex: 3, field: 'restTime', oldValue: 150, newValue: 180 },
      { setIndex: 3, field: 'rpe', oldValue: 9, newValue: 7 },
      { setIndex: 3, field: 'tempo', oldValue: '3-0-2-0', newValue: '4-0-2-0' },
      { setIndex: 3, field: 'heartRate', oldValue: 158, newValue: 145 },
      { setIndex: 3, field: 'calories', oldValue: 11, newValue: 10 },
    ],
    updatedSets: [
      { setIndex: 1, reps: 8, weight: 80, percentage: 65, power: 850, velocity: 0.45, duration: 24, restTime: 120, rpe: 7, tempo: '3-0-2-0', distance: null, heartRate: 145, calories: 12 },
      { setIndex: 2, reps: 10, weight: 77, percentage: 63, power: 830, velocity: 0.48, duration: 30, restTime: 150, rpe: 6, tempo: '4-0-2-0', distance: null, heartRate: 140, calories: 12, isChanged: true },
      { setIndex: 3, reps: 8, weight: 81, percentage: 68, power: 880, velocity: 0.45, duration: 24, restTime: 180, rpe: 7, tempo: '4-0-2-0', distance: null, heartRate: 145, calories: 10, isChanged: true },
    ],
  },

  // 3. SWAP within SUPERSET - Replace one exercise in superset
  {
    id: 'change-3',
    type: 'swap',
    targetExerciseId: 'ex-3a',
    exerciseName: 'Lateral Raises',
    newExerciseName: 'Cable Y-Raises',
    preserveSets: true,
    description: 'Swap in superset A',
    aiReasoning: 'Y-raises are gentler on shoulder impingement',
  },

  // 4. UPDATE - Reduce reps in superset exercise
  {
    id: 'change-4',
    type: 'update',
    targetExerciseId: 'ex-3b',
    exerciseName: 'Face Pulls',
    description: 'Increase to 20 reps per set',
    aiReasoning: 'Higher reps for better shoulder activation',
    setChanges: [
      { setIndex: 1, field: 'reps', oldValue: 15, newValue: 20 },
      { setIndex: 2, field: 'reps', oldValue: 15, newValue: 20 },
      { setIndex: 3, field: 'reps', oldValue: 15, newValue: 20 },
    ],
    updatedSets: [
      { setIndex: 1, reps: 20, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null, isChanged: true },
      { setIndex: 2, reps: 20, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 0, rpe: null, tempo: null, distance: null, heartRate: null, calories: null, isChanged: true },
      { setIndex: 3, reps: 20, weight: 20, percentage: null, power: null, velocity: null, duration: null, restTime: 60, rpe: null, tempo: null, distance: null, heartRate: null, calories: null, isChanged: true },
    ],
  },

  // 5. ADD - New exercise at end
  {
    id: 'change-5',
    type: 'add',
    targetExerciseId: 'new-ex-1',
    exerciseName: 'Band Pull-Aparts',
    insertAfterExerciseId: 'ex-5',
    description: 'Add for shoulder prehab',
    aiReasoning: 'Light activation for rotator cuff health',
    newExercise: {
      id: 'new-ex-1',
      name: 'Band Pull-Aparts',
      exerciseOrder: 7,
      supersetId: null,
      sets: [
        { setIndex: 1, reps: 20, weight: null, percentage: null, power: null, velocity: null, duration: null, restTime: 30, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 20, weight: null, percentage: null, power: null, velocity: null, duration: null, restTime: 30, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
      ],
    },
  },

  // 6. UPDATE - Power Clean with many column changes (demonstrates horizontal scroll)
  {
    id: 'change-6',
    type: 'update',
    targetExerciseId: 'ex-5',
    exerciseName: 'Power Clean',
    description: 'Reduce intensity, extend rest for recovery',
    aiReasoning: 'Lower power output targets and longer rest periods to reduce overall fatigue',
    setChanges: [
      { setIndex: 2, field: 'weight', oldValue: 80, newValue: 75 },
      { setIndex: 2, field: 'percentage', oldValue: 75, newValue: 70 },
      { setIndex: 2, field: 'power', oldValue: 1400, newValue: 1300 },
      { setIndex: 3, field: 'weight', oldValue: 90, newValue: 82 },
      { setIndex: 3, field: 'percentage', oldValue: 85, newValue: 77 },
      { setIndex: 3, field: 'power', oldValue: 1600, newValue: 1450 },
      { setIndex: 3, field: 'restTime', oldValue: 240, newValue: 300 },
      { setIndex: 4, field: 'weight', oldValue: 95, newValue: 88 },
      { setIndex: 4, field: 'percentage', oldValue: 90, newValue: 83 },
      { setIndex: 4, field: 'power', oldValue: 1750, newValue: 1550 },
      { setIndex: 4, field: 'restTime', oldValue: 240, newValue: 300 },
    ],
    updatedSets: [
      { setIndex: 1, reps: 3, weight: 70, percentage: 65, power: 1200, velocity: null, duration: null, restTime: 180, rpe: 6, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null },
      { setIndex: 2, reps: 3, weight: 75, percentage: 70, power: 1300, velocity: null, duration: null, restTime: 180, rpe: 7, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null, isChanged: true },
      { setIndex: 3, reps: 2, weight: 82, percentage: 77, power: 1450, velocity: null, duration: null, restTime: 300, rpe: 8, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null, isChanged: true },
      { setIndex: 4, reps: 2, weight: 88, percentage: 83, power: 1550, velocity: null, duration: null, restTime: 300, rpe: 9, tempo: '1-0-X-0', distance: null, heartRate: null, calories: null, isChanged: true },
    ],
  },
]

// Alternative: Simple scenario with fewer changes
export const mockPendingChangesSimple: SessionChange[] = [
  {
    id: 'change-1',
    type: 'swap',
    targetExerciseId: 'ex-1',
    exerciseName: 'Back Squat',
    newExerciseName: 'Safety Bar Squat',
    preserveSets: true,
    description: 'Swap for Safety Bar Squat',
    aiReasoning: 'Reduces shoulder strain',
  },
  {
    id: 'change-2',
    type: 'remove',
    targetExerciseId: 'ex-3a',
    exerciseName: 'Lateral Raises',
    description: 'Remove from superset',
    aiReasoning: 'Reduces overhead volume',
  },
  {
    id: 'change-3',
    type: 'add',
    targetExerciseId: 'new-ex',
    exerciseName: 'Band Pull-Aparts',
    insertAfterExerciseId: 'ex-4',
    description: 'Add for prehab',
    aiReasoning: 'Rotator cuff activation',
    newExercise: {
      id: 'new-ex',
      name: 'Band Pull-Aparts',
      exerciseOrder: 6,
      supersetId: null,
      sets: [
        { setIndex: 1, reps: 15, weight: null, percentage: null, power: null, velocity: null, duration: null, restTime: 30, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
        { setIndex: 2, reps: 15, weight: null, percentage: null, power: null, velocity: null, duration: null, restTime: 30, rpe: null, tempo: null, distance: null, heartRate: null, calories: null },
      ],
    },
  },
]

export const mockChatHistory: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hi! I can help modify your session, log performance, or find alternatives. What do you need?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'My shoulder is sore today. Can you adjust the session?',
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: "I've prepared 6 changes to reduce shoulder stress:\n\n1. Swap Back Squat → Safety Bar Squat\n2. Reduce Bench Press intensity across all metrics\n3. Swap Lateral Raises → Cable Y-Raises (in superset)\n4. Increase Face Pulls to 20 reps\n5. Add Band Pull-Aparts for prehab\n6. Reduce Power Clean intensity\n\nReview above and tap Approve All when ready.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
  },
]

export const suggestedPrompts = [
  'Log my workout',
  'Knee hurts, alternatives?',
  'Reduce volume today',
  'Add warmup',
]
