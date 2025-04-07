export const exerciseLibrary = [
  {
    id: 1,
    name: "Back Squat",
    type: "gym",
    video_url: "https://www.youtube.com/watch?v=SW_C1A-reqs",
    category: "Lower Body"
  },
  {
    id: 2,
    name: "Bench Press",
    type: "gym",
    video_url: "https://www.youtube.com/watch?v=gRVjAtPip0Y",
    category: "Upper Body"
  },
  {
    id: 3,
    name: "Deadlift",
    type: "gym",
    video_url: "https://www.youtube.com/watch?v=op9kVnSso6Q",
    category: "Full Body"
  },
  {
    id: 4,
    name: "Jump Rope",
    type: "warmup",
    video_url: "https://www.youtube.com/watch?v=1BZM2Vre5oc",
    category: "Cardio"
  }
];

export const mockMesocycle = {
  weeks: [
    {
      name: "Foundation Week",
      totalVolume: 12500,
      intensity: "65",
      mainObjectives: "Technique refinement, Base conditioning",
      notes: "Focus on perfecting movement patterns and building work capacity",
      progression: [
        { name: "Day 1", volume: 4000, intensity: 60 },
        { name: "Day 2", volume: 3000, intensity: 65 },
        { name: "Day 3", volume: 3500, intensity: 70 },
        { name: "Day 4", volume: 2000, intensity: 60 }
      ]
    },
    {
      name: "Intensity Week",
      totalVolume: 11000,
      intensity: "75",
      mainObjectives: "Strength peaks, Heavy singles",
      notes: "Push for new 1RMs in main lifts with proper warmup protocols",
      progression: [
        { name: "Day 1", volume: 3500, intensity: 75 },
        { name: "Day 2", volume: 2500, intensity: 80 },
        { name: "Day 3", volume: 3000, intensity: 77 },
        { name: "Day 4", volume: 2000, intensity: 70 }
      ]
    },
    {
      name: "Deload Week",
      totalVolume: 8000,
      intensity: "50",
      mainObjectives: "Recovery, Mobility work",
      notes: "Active recovery and tissue quality maintenance",
      progression: [
        { name: "Day 1", volume: 2000, intensity: 50 },
        { name: "Day 2", volume: 1500, intensity: 45 },
        { name: "Day 3", volume: 2500, intensity: 55 },
        { name: "Day 4", volume: 2000, intensity: 50 }
      ]
    }
  ],
  sessions: [
    {
      id: 1,
      date: "2023-11-01",
      exercises: [
        {
          id: 101,
          name: "Back Squat",
          sets: [
            { setNumber: 1, reps: 5, weight: 100, power: 85, velocity: 0.45 }
          ]
        }
      ]
    }
  ]
}; 