import { useState, useEffect } from 'react'
import { useSession } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function WeeklyOverview() {
  const { session, isLoaded: isSessionLoaded, isSignedIn } = useSession()
  const [weeklyData, setWeeklyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true)
      if (!isSessionLoaded) {
        return
      }
      if (!isSignedIn) {
        setError('Not signed in')
        setLoading(false)
        return
      }
      try {
        const token = await session.getToken()
        const res = await fetch('/api/dashboard/weeklyOverview', { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json()
        if (!res.ok || body.status !== 'success') throw new Error(body.message || 'Failed to fetch weekly overview')
        setWeeklyData(body.data)
      } catch (err) {
        console.error('Error fetching weekly data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWeeklyData()
  }, [session, isSessionLoaded, isSignedIn])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!weeklyData) return <div>No weekly data available</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {weeklyData.map((item) => (
        <Card key={item.title}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{item.stat}</div>
            <p className="text-xs text-muted-foreground">{item.title}</p>
            <div className="mt-4">
              <Progress value={item.progress} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 