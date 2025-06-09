"use server"

export default async function PerformancePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Performance</h2>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
          <p className="text-muted-foreground">
            Track your training progress with detailed analytics and insights.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Trend Analysis</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize performance trends over time
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">PR Tracking</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor personal records and achievements
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Training Load</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze training volume and intensity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 