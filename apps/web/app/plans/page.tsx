"use server"

export default async function PlansPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Training Plans</h2>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">MesoWizard</h3>
          <p className="text-muted-foreground">
            Create comprehensive training plans with our intelligent planning wizard.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Macrocycles</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Long-term training periods
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Mesocycles</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Medium-term training blocks
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Microcycles</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly training plans
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 