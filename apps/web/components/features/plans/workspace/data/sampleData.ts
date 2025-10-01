// Comprehensive sample data with realistic training metrics and session details
export const DEMO_PLANS: Record<number, {
  macrocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    user_id: number | null
    athlete_group_id: number | null
    created_at: string | null
  }
  mesocycles: Array<{
    id: number
    macrocycle_id: number | null
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    metadata: Record<string, unknown> | null
    created_at: string | null
    user_id: number | null
    microcycles: Array<{
      id: number
      mesocycle_id: number | null
      name: string | null
      description: string | null
      start_date: string | null
      end_date: string | null
      created_at: string | null
      user_id: number | null
      sessions: Array<{
        id: number
        day: number
        name: string
        type: 'speed' | 'strength' | 'recovery' | 'endurance'
        duration: number
        volume: number
        intensity: number
        exercises: Array<{
          name: string
          sets: number
          reps: string
          weight?: number
          notes?: string
        }>
      }>
    }>
  }>
  events: Array<{
    id: number
    name: string | null
    category: string | null
    type: string | null
    created_at: string | null
    updated_at: string | null
  }>
}> = {
  1: {
    macrocycle: {
      id: 1,
      name: "Elite Sprinters – Fall Championship Season",
      description: "14-week macrocycle targeting the Oct 12 finals",
      start_date: "2025-08-04",
      end_date: "2025-11-02",
      user_id: 1,
      athlete_group_id: 10,
      created_at: "2025-07-15T09:00:00Z"
    },
    mesocycles: [
      {
        id: 11,
        macrocycle_id: 1,
        name: "GPP",
        description: "General Preparation Phase",
        start_date: "2025-08-04",
        end_date: "2025-08-24",
        metadata: { phase: "GPP", deload: false, color: "#10B981" },
        created_at: "2025-07-15T09:00:00Z",
        user_id: 1,
        microcycles: [
          {
            id: 111,
            mesocycle_id: 11,
            name: "Week 1",
            description: "Base building",
            start_date: "2025-08-04",
            end_date: "2025-08-10",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 1, day: 1, name: "Speed Endurance", type: 'speed', duration: 90, volume: 75, intensity: 6.5, exercises: [{ name: "4x100m", sets: 4, reps: "100m", notes: "95% effort" }, { name: "3x200m", sets: 3, reps: "200m", notes: "90% effort" }] },
              { id: 2, day: 3, name: "Strength Training", type: 'strength', duration: 75, volume: 80, intensity: 7.0, exercises: [{ name: "Squats", sets: 4, reps: "8-10", weight: 135 }, { name: "Deadlifts", sets: 3, reps: "5", weight: 185 }] },
              { id: 3, day: 5, name: "Recovery Run", type: 'recovery', duration: 45, volume: 60, intensity: 5.0, exercises: [{ name: "Easy Run", sets: 1, reps: "30min", notes: "Conversational pace" }] }
            ]
          },
          {
            id: 112,
            mesocycle_id: 11,
            name: "Week 2",
            description: "Progressive overload",
            start_date: "2025-08-11",
            end_date: "2025-08-17",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 4, day: 1, name: "Speed Endurance", type: 'speed', duration: 90, volume: 80, intensity: 6.8, exercises: [{ name: "5x100m", sets: 5, reps: "100m", notes: "95% effort" }, { name: "3x200m", sets: 3, reps: "200m", notes: "90% effort" }] },
              { id: 5, day: 3, name: "Strength Training", type: 'strength', duration: 75, volume: 85, intensity: 7.2, exercises: [{ name: "Squats", sets: 4, reps: "8-10", weight: 145 }, { name: "Deadlifts", sets: 3, reps: "5", weight: 195 }] },
              { id: 6, day: 5, name: "Recovery Run", type: 'recovery', duration: 45, volume: 60, intensity: 5.0, exercises: [{ name: "Easy Run", sets: 1, reps: "30min", notes: "Conversational pace" }] }
            ]
          },
          {
            id: 113,
            mesocycle_id: 11,
            name: "Week 3",
            description: "Peak load",
            start_date: "2025-08-18",
            end_date: "2025-08-24",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 7, day: 1, name: "Speed Endurance", type: 'speed', duration: 90, volume: 85, intensity: 7.0, exercises: [{ name: "6x100m", sets: 6, reps: "100m", notes: "95% effort" }, { name: "4x200m", sets: 4, reps: "200m", notes: "90% effort" }] },
              { id: 8, day: 3, name: "Strength Training", type: 'strength', duration: 75, volume: 90, intensity: 7.5, exercises: [{ name: "Squats", sets: 4, reps: "8-10", weight: 155 }, { name: "Deadlifts", sets: 3, reps: "5", weight: 205 }] },
              { id: 9, day: 5, name: "Recovery Run", type: 'recovery', duration: 45, volume: 60, intensity: 5.0, exercises: [{ name: "Easy Run", sets: 1, reps: "30min", notes: "Conversational pace" }] }
            ]
          }
        ]
      },
      {
        id: 12,
        macrocycle_id: 1,
        name: "SPP",
        description: "Specific Preparation Phase",
        start_date: "2025-08-25",
        end_date: "2025-09-28",
        metadata: { phase: "SPP", deload: true, color: "#3B82F6" },
        created_at: "2025-07-15T09:00:00Z",
        user_id: 1,
        microcycles: [
          {
            id: 121,
            mesocycle_id: 12,
            name: "Week 1",
            description: "Speed development",
            start_date: "2025-08-25",
            end_date: "2025-08-31",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 10, day: 1, name: "Speed Work", type: 'speed', duration: 90, volume: 85, intensity: 7.2, exercises: [{ name: "6x60m", sets: 6, reps: "60m", notes: "Max effort" }, { name: "4x100m", sets: 4, reps: "100m", notes: "95% effort" }] },
              { id: 11, day: 3, name: "Power Training", type: 'strength', duration: 75, volume: 80, intensity: 7.8, exercises: [{ name: "Power Cleans", sets: 5, reps: "3", weight: 95 }, { name: "Jump Squats", sets: 4, reps: "8", weight: 45 }] },
              { id: 12, day: 5, name: "Recovery", type: 'recovery', duration: 45, volume: 50, intensity: 4.5, exercises: [{ name: "Easy Run", sets: 1, reps: "25min", notes: "Very easy pace" }] }
            ]
          },
          {
            id: 122,
            mesocycle_id: 12,
            name: "Week 2",
            description: "Intensity focus",
            start_date: "2025-09-01",
            end_date: "2025-09-07",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 13, day: 1, name: "Speed Work", type: 'speed', duration: 90, volume: 90, intensity: 7.5, exercises: [{ name: "8x60m", sets: 8, reps: "60m", notes: "Max effort" }, { name: "4x100m", sets: 4, reps: "100m", notes: "95% effort" }] },
              { id: 14, day: 3, name: "Power Training", type: 'strength', duration: 75, volume: 85, intensity: 8.0, exercises: [{ name: "Power Cleans", sets: 5, reps: "3", weight: 105 }, { name: "Jump Squats", sets: 4, reps: "8", weight: 55 }] },
              { id: 15, day: 5, name: "Recovery", type: 'recovery', duration: 45, volume: 50, intensity: 4.5, exercises: [{ name: "Easy Run", sets: 1, reps: "25min", notes: "Very easy pace" }] }
            ]
          },
          {
            id: 123,
            mesocycle_id: 12,
            name: "Week 3",
            description: "Peak intensity",
            start_date: "2025-09-08",
            end_date: "2025-09-14",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 16, day: 1, name: "Speed Work", type: 'speed', duration: 90, volume: 95, intensity: 8.0, exercises: [{ name: "10x60m", sets: 10, reps: "60m", notes: "Max effort" }, { name: "5x100m", sets: 5, reps: "100m", notes: "95% effort" }] },
              { id: 17, day: 3, name: "Power Training", type: 'strength', duration: 75, volume: 90, intensity: 8.2, exercises: [{ name: "Power Cleans", sets: 5, reps: "3", weight: 115 }, { name: "Jump Squats", sets: 4, reps: "8", weight: 65 }] },
              { id: 18, day: 5, name: "Recovery", type: 'recovery', duration: 45, volume: 50, intensity: 4.5, exercises: [{ name: "Easy Run", sets: 1, reps: "25min", notes: "Very easy pace" }] }
            ]
          },
          {
            id: 124,
            mesocycle_id: 12,
            name: "Week 4 (Deload)",
            description: "Recovery week",
            start_date: "2025-09-15",
            end_date: "2025-09-21",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 19, day: 1, name: "Light Speed", type: 'speed', duration: 60, volume: 60, intensity: 6.0, exercises: [{ name: "4x60m", sets: 4, reps: "60m", notes: "80% effort" }] },
              { id: 20, day: 3, name: "Light Strength", type: 'strength', duration: 45, volume: 60, intensity: 6.5, exercises: [{ name: "Squats", sets: 3, reps: "8", weight: 95 }, { name: "Deadlifts", sets: 2, reps: "5", weight: 135 }] },
              { id: 21, day: 5, name: "Recovery", type: 'recovery', duration: 30, volume: 40, intensity: 4.0, exercises: [{ name: "Easy Run", sets: 1, reps: "20min", notes: "Very easy pace" }] }
            ]
          },
          {
            id: 125,
            mesocycle_id: 12,
            name: "Week 5",
            description: "Final prep",
            start_date: "2025-09-22",
            end_date: "2025-09-28",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 22, day: 1, name: "Speed Work", type: 'speed', duration: 90, volume: 85, intensity: 7.8, exercises: [{ name: "8x60m", sets: 8, reps: "60m", notes: "Max effort" }, { name: "4x100m", sets: 4, reps: "100m", notes: "95% effort" }] },
              { id: 23, day: 3, name: "Power Training", type: 'strength', duration: 75, volume: 80, intensity: 7.5, exercises: [{ name: "Power Cleans", sets: 4, reps: "3", weight: 105 }, { name: "Jump Squats", sets: 3, reps: "8", weight: 55 }] },
              { id: 24, day: 5, name: "Recovery", type: 'recovery', duration: 45, volume: 50, intensity: 4.5, exercises: [{ name: "Easy Run", sets: 1, reps: "25min", notes: "Very easy pace" }] }
            ]
          }
        ]
      },
      {
        id: 13,
        macrocycle_id: 1,
        name: "Taper",
        description: "Taper Phase",
        start_date: "2025-09-29",
        end_date: "2025-10-12",
        metadata: { phase: "Taper", color: "#F59E0B" },
        created_at: "2025-07-15T09:00:00Z",
        user_id: 1,
        microcycles: [
          {
            id: 131,
            mesocycle_id: 13,
            name: "Week 1",
            description: "Taper begins",
            start_date: "2025-09-29",
            end_date: "2025-10-05",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 25, day: 1, name: "Speed Maintenance", type: 'speed', duration: 60, volume: 50, intensity: 7.0, exercises: [{ name: "4x60m", sets: 4, reps: "60m", notes: "90% effort" }, { name: "2x100m", sets: 2, reps: "100m", notes: "95% effort" }] },
              { id: 26, day: 3, name: "Light Power", type: 'strength', duration: 45, volume: 40, intensity: 6.0, exercises: [{ name: "Power Cleans", sets: 3, reps: "3", weight: 85 }, { name: "Jump Squats", sets: 2, reps: "6", weight: 35 }] },
              { id: 27, day: 5, name: "Recovery", type: 'recovery', duration: 30, volume: 30, intensity: 4.0, exercises: [{ name: "Easy Run", sets: 1, reps: "20min", notes: "Very easy pace" }] }
            ]
          },
          {
            id: 132,
            mesocycle_id: 13,
            name: "Race Week",
            description: "Competition week",
            start_date: "2025-10-06",
            end_date: "2025-10-12",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 28, day: 1, name: "Race Prep", type: 'speed', duration: 45, volume: 30, intensity: 6.5, exercises: [{ name: "2x60m", sets: 2, reps: "60m", notes: "90% effort" }, { name: "1x100m", sets: 1, reps: "100m", notes: "95% effort" }] },
              { id: 29, day: 3, name: "Light Activation", type: 'strength', duration: 30, volume: 20, intensity: 5.5, exercises: [{ name: "Bodyweight Squats", sets: 2, reps: "10", notes: "Easy activation" }] },
              { id: 30, day: 5, name: "Race Day", type: 'speed', duration: 120, volume: 100, intensity: 10.0, exercises: [{ name: "100m Final", sets: 1, reps: "100m", notes: "Race day!" }] }
            ]
          }
        ]
      },
      {
        id: 14,
        macrocycle_id: 1,
        name: "Competition",
        description: "Post-race maintenance",
        start_date: "2025-10-13",
        end_date: "2025-10-19",
        metadata: { phase: "Comp", color: "#EF4444" },
        created_at: "2025-07-15T09:00:00Z",
        user_id: 1,
        microcycles: [
          {
            id: 141,
            mesocycle_id: 14,
            name: "Recovery Week",
            description: "Active recovery",
            start_date: "2025-10-13",
            end_date: "2025-10-19",
            created_at: "2025-07-15T09:00:00Z",
            user_id: 1,
            sessions: [
              { id: 31, day: 1, name: "Easy Recovery", type: 'recovery', duration: 30, volume: 20, intensity: 3.5, exercises: [{ name: "Easy Walk", sets: 1, reps: "20min", notes: "Very light" }] },
              { id: 32, day: 3, name: "Light Movement", type: 'recovery', duration: 30, volume: 20, intensity: 3.5, exercises: [{ name: "Easy Jog", sets: 1, reps: "15min", notes: "Very easy pace" }] },
              { id: 33, day: 5, name: "Recovery", type: 'recovery', duration: 30, volume: 20, intensity: 3.5, exercises: [{ name: "Easy Walk", sets: 1, reps: "20min", notes: "Very light" }] }
            ]
          }
        ]
      }
    ],
    events: [
      { id: 201, name: "Fall Championship Finals", category: "competition", type: "race", created_at: "2025-10-12T00:00:00Z", updated_at: "2025-10-12T00:00:00Z" },
      { id: 202, name: "Tune-up Meet", category: "competition", type: "race", created_at: "2025-09-28T00:00:00Z", updated_at: "2025-09-28T00:00:00Z" }
    ]
  }
}
