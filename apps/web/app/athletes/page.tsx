"use server"

export default async function AthletesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Athletes</h2>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Athlete Management</h3>
          <p className="text-muted-foreground">
            Manage your athletes and track their progress across training programs.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Athlete Groups</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Organize athletes into training groups
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Progress Tracking</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor individual athlete progress
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Group Sessions</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Assign training sessions to groups
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 