"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar, Users, User, Clock, MapPin, Plus } from "lucide-react"
import { getTrainingPlansAction } from "@/actions/training"
import { ExercisePresetGroup } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export function ExistingPlansTab() {
  const [plans, setPlans] = useState<ExercisePresetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchPlans = async () => {
    try {
      setRefreshing(true)
      const result = await getTrainingPlansAction()
      
      if (result.isSuccess) {
        setPlans(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch training plans",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleRefresh = () => {
    fetchPlans()
  }

  if (loading) {
    return <ExistingPlansTabSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Training Plans</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Plans Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any training plans yet. Use the MesoWizard to create your first plan.
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan }: { plan: ExercisePresetGroup & { athlete_groups?: any; microcycles?: any } }) {
  const isGroupPlan = plan.session_mode === 'group'
  const planDate = plan.date ? format(new Date(plan.date), 'MMM d, yyyy') : 'No date'
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{plan.name}</CardTitle>
          <Badge variant={isGroupPlan ? "default" : "secondary"}>
            {isGroupPlan ? (
              <>
                <Users className="w-3 h-3 mr-1" />
                Group
              </>
            ) : (
              <>
                <User className="w-3 h-3 mr-1" />
                Individual
              </>
            )}
          </Badge>
        </div>
        {plan.description && (
          <CardDescription className="line-clamp-2">
            {plan.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {planDate}
        </div>
        
        {plan.week && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Week {plan.week}{plan.day && `, Day ${plan.day}`}
          </div>
        )}

        {plan.athlete_groups && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {plan.athlete_groups.group_name}
          </div>
        )}

        {plan.microcycles && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {plan.microcycles.name}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            View Details
          </Button>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ExistingPlansTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
} 