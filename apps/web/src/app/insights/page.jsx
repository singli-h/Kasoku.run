"use client"

import { useSession } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { WeeklyOverview } from "@/components/overview/WeeklyOverview"
import MesocycleOverview from "@/components/overview/MesocycleOverview"
import { useEffect, useState } from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { getUserRoleData } from "@/lib/roles"

export default function InsightsPage() {
  const { session, isLoaded, isSignedIn } = useSession()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in')
      return
    }
    // client-side check: assume auth token present
    session.getToken().then(async (token) => {
      // skip proper check here; rely on API
      setAllowed(true)
    })
  }, [isLoaded, isSignedIn])

  if (!allowed) return <div>Loading insights...</div>

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Insights</h1>
      <section className="mb-8">
        <Card>
          <CardTitle className="px-6 pt-4 text-xl">Weekly Overview</CardTitle>
          <div className="p-6">
            <WeeklyOverview />
          </div>
        </Card>
      </section>
      <section>
        <Card>
          <CardTitle className="px-6 pt-4 text-xl">Mesocycle Overview</CardTitle>
          <div className="p-6">
            {/* Replace with filtered mesocycle for coach */}
            <MesocycleOverview mesocycle={{ /* placeholder */ }} />
          </div>
        </Card>
      </section>
    </main>
  )
} 