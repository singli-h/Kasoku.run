import { useState, useEffect } from 'react'
import { useBrowserSupabaseClient } from '@/lib/supabase'
import { dashboardApi } from '@/lib/supabase-api'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function WeeklyOverview() {
  const [weeklyData, setWeeklyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const supabase = useBrowserSupabaseClient()

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true)
        const { data, error: apiError } = await dashboardApi.getWeeklyOverview(supabase);
        
        if (apiError) throw apiError;
        setWeeklyData(data);
      } catch (err) {
        console.error('Error fetching weekly data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (supabase) {
      fetchWeeklyData();
    }
  }, [supabase])

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