"use server"

import { HolographicProfileCard, type ProfileCardData } from "@/components/features/profile"

// Demo data for showcasing the profile cards
const athleteDemo: ProfileCardData = {
  id: 1,
  firstName: "Alex",
  lastName: "Chen",
  avatarUrl: null,
  role: "athlete",
  birthdate: "1998-03-15",
  sex: "M",
  experience: "advanced",
  height: 178,
  weight: 72,
  events: ["100m", "200m", "Long Jump"],
  trainingGoals: "Qualify for national championships in 100m with a sub-10.5 time. Focus on explosive starts and maintaining form through the finish.",
  groupName: "Sprint Squad",
  athleteStats: {
    totalWorkouts: 156,
    weeklyStreak: 8,
    personalRecords: 12,
    completionRate: 94
  }
}

const coachDemo: ProfileCardData = {
  id: 2,
  firstName: "Sarah",
  lastName: "Williams",
  avatarUrl: null,
  role: "coach",
  birthdate: "1985-07-22",
  sex: "F",
  speciality: "Sprint & Power",
  sportFocus: "Track & Field",
  philosophy: "Every athlete has untapped potential. My job is to help them discover it through smart training, consistent effort, and believing in themselves.",
  coachStats: {
    athletesCoached: 45,
    yearsExperience: 12,
    programsCreated: 89,
    successRate: 87
  }
}

const beginnerAthleteDemo: ProfileCardData = {
  id: 3,
  firstName: "Jordan",
  lastName: "Park",
  avatarUrl: null,
  role: "athlete",
  birthdate: "2002-11-08",
  sex: "F",
  experience: "beginner",
  height: 165,
  weight: 58,
  events: ["5K", "10K"],
  trainingGoals: "Complete my first half marathon and build a consistent running habit.",
  groupName: "Distance Runners",
  athleteStats: {
    totalWorkouts: 23,
    weeklyStreak: 3,
    personalRecords: 2,
    completionRate: 78
  }
}

const eliteAthleteDemo: ProfileCardData = {
  id: 4,
  firstName: "Marcus",
  lastName: "Thompson",
  avatarUrl: null,
  role: "athlete",
  birthdate: "1995-01-30",
  sex: "M",
  experience: "elite",
  height: 185,
  weight: 78,
  events: ["400m", "800m", "4x400m Relay"],
  trainingGoals: "Olympic trials qualification. Working on maintaining speed through the final 100m of the 400m.",
  groupName: "Elite Squad",
  athleteStats: {
    totalWorkouts: 412,
    weeklyStreak: 24,
    personalRecords: 47,
    completionRate: 98
  }
}

export default async function ProfileDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Holographic Profile Cards
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Interactive 3D trading-card style profiles with holographic effects.
            Hover to see the tilt effect, click to flip and reveal stats.
          </p>
        </div>

        {/* Athletes Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-amber-500 rounded-full" />
            Athletes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            <HolographicProfileCard profile={athleteDemo} size="md" />
            <HolographicProfileCard profile={beginnerAthleteDemo} size="md" />
            <HolographicProfileCard profile={eliteAthleteDemo} size="md" />
          </div>
        </section>

        {/* Coaches Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-cyan-500 rounded-full" />
            Coaches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            <HolographicProfileCard profile={coachDemo} size="md" />
          </div>
        </section>

        {/* Size Variants */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full" />
            Size Variants
          </h2>
          <div className="flex flex-wrap gap-8 items-end justify-center">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">Small</p>
              <HolographicProfileCard profile={athleteDemo} size="sm" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">Medium (Default)</p>
              <HolographicProfileCard profile={athleteDemo} size="md" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">Large</p>
              <HolographicProfileCard profile={athleteDemo} size="lg" />
            </div>
          </div>
        </section>

        {/* Instructions */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-md">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Press <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Enter</kbd> or <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Space</kbd> when focused to flip
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
