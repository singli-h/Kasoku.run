"use server"

export default async function WorkoutPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Workout</h2>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Active Session</h3>
          <p className="text-muted-foreground">
            Start a workout session or continue your current training.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Recent Workouts</h4>
            <p className="text-sm text-muted-foreground mt-1">
              View your recent training sessions
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Exercise Library</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Browse available exercises
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Quick Start</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Start a new workout session
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 