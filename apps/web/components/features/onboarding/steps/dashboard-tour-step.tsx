"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, BarChart3, Calendar, Users, Trophy, Target, BookOpen } from "lucide-react"

interface DashboardTourStepProps {
  onNext: () => void
  onPrev: () => void
}

export function DashboardTourStep({ onNext, onPrev }: DashboardTourStepProps) {
  const features = [
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track your progress with detailed charts and metrics",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Calendar,
      title: "Training Calendar",
      description: "Plan and schedule your workouts and sessions",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Manage athletes and coaching relationships",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Trophy,
      title: "Competition Tracking",
      description: "Log meets, races, and competitive performances",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Target,
      title: "Goal Setting",
      description: "Set and track personal and seasonal goals",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: BookOpen,
      title: "Training Library",
      description: "Access workout templates and training resources",
      color: "bg-indigo-100 text-indigo-600"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Explore your dashboard
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Here's a quick overview of the key features you'll have access to once you complete setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${(index + 1) * 16.67}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-6 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Ready to get started?
          </h3>
          <p className="text-muted-foreground">
            Your personalized dashboard will be set up based on your role and preferences. 
            You can customize everything later in your settings.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Easy to use
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              Mobile friendly
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
              Always improving
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={onNext}
          className="min-w-[120px]"
        >
          Almost Done
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 