import { addDays, format } from "date-fns"

const startDate = new Date("2023-06-01")

export const mockMesocycle = {
  weeks: Array.from({ length: 4 }, (_, weekIndex) => ({
    totalVolume: 10000 + weekIndex * 500,
    intensity: `${70 + weekIndex * 2}%`,
    mainObjectives: `Week ${weekIndex + 1} objectives`,
    progression: [
      { name: "Day 1", volume: 3000 + weekIndex * 100, intensity: 65 + weekIndex },
      { name: "Day 2", volume: 3500 + weekIndex * 100, intensity: 70 + weekIndex },
      { name: "Day 3", volume: 3500 + weekIndex * 100, intensity: 75 + weekIndex },
    ],
  })),
  sessions: Array.from({ length: 12 }, (_, sessionIndex) => {
    const sessionDate = addDays(startDate, sessionIndex * 2) // Sessions every other day
    return {
      id: sessionIndex + 1,
      name: `Session ${sessionIndex + 1}`,
      date: format(sessionDate, "yyyy-MM-dd"),
      warmup: [
        { id: `w${sessionIndex}1`, name: "Dynamic Stretching", duration: "5 min" },
        { id: `w${sessionIndex}2`, name: "Light Cardio", duration: "5 min" },
      ],
      exercises: [
        {
          id: `e${sessionIndex}1`,
          name: "Squat",
          sets: [
            { setNumber: 1, reps: 8, weight: 100, power: 500, velocity: 0.5 },
            { setNumber: 2, reps: 8, weight: 105, power: 525, velocity: 0.48 },
            { setNumber: 3, reps: 8, weight: 110, power: 550, velocity: 0.46 },
          ],
          oneRepMax: "80%",
        },
        {
          id: `e${sessionIndex}2`,
          name: "Bench Press",
          sets: [
            { setNumber: 1, reps: 8, weight: 80, power: 400, velocity: 0.6 },
            { setNumber: 2, reps: 8, weight: 85, power: 425, velocity: 0.58 },
            { setNumber: 3, reps: 8, weight: 90, power: 450, velocity: 0.56 },
          ],
          oneRepMax: "75%",
        },
      ],
      circuits: [
        { id: `c${sessionIndex}1`, name: "Burpees", reps: 10, duration: "30 sec" },
        { id: `c${sessionIndex}2`, name: "Mountain Climbers", reps: 20, duration: "30 sec" },
      ],
      notes: `Session ${sessionIndex + 1} notes: Focus on form and controlled movements.`,
    }
  }),
}

export const exerciseLibrary = [
  { id: "squat", name: "Squat", type: "gym" },
  { id: "deadlift", name: "Deadlift", type: "gym" },
  { id: "bench-press", name: "Bench Press", type: "gym" },
  { id: "overhead-press", name: "Overhead Press", type: "gym" },
  { id: "row", name: "Row", type: "gym" },
  { id: "pull-up", name: "Pull-up", type: "gym" },
  { id: "lunge", name: "Lunge", type: "gym" },
  { id: "plank", name: "Plank", type: "gym" },
  { id: "jumping-jacks", name: "Jumping Jacks", type: "warmup" },
  { id: "arm-circles", name: "Arm Circles", type: "warmup" },
  { id: "leg-swings", name: "Leg Swings", type: "warmup" },
  { id: "burpees", name: "Burpees", type: "circuit" },
  { id: "mountain-climbers", name: "Mountain Climbers", type: "circuit" },
  { id: "jump-rope", name: "Jump Rope", type: "circuit" },
]

