"use server"

export default async function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
          <p className="text-muted-foreground">
            Manage your account preferences, notifications, and privacy settings.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Profile</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Update your personal information
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Notifications</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Configure notification preferences
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Privacy</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Manage data and privacy settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 