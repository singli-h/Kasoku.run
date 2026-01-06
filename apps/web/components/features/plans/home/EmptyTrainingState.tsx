'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Plus, Sparkles, Target, Zap } from "lucide-react"
import Link from "next/link"

/**
 * Empty state shown when individual user has no training blocks
 * Provides quick-start options with template suggestions
 */
export function EmptyTrainingState() {
  return (
    <div className="space-y-8">
      {/* Hero Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Start Your Training Journey</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first Training Block to organize your workouts and track your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/plans/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Training Block
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/plans/new?templates=true">
                <Sparkles className="h-4 w-4 mr-2" />
                Browse Templates
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Templates */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Popular Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TemplateCard
            icon={<Target className="h-5 w-5" />}
            title="Strength Foundation"
            description="Build strength with compound movements"
            duration="4 weeks"
            frequency="4x per week"
          />
          <TemplateCard
            icon={<Zap className="h-5 w-5" />}
            title="PPL Split"
            description="Push, Pull, Legs for muscle growth"
            duration="6 weeks"
            frequency="6x per week"
          />
          <TemplateCard
            icon={<Dumbbell className="h-5 w-5" />}
            title="Upper/Lower"
            description="Balanced upper and lower body training"
            duration="4 weeks"
            frequency="4x per week"
          />
        </div>
      </section>
    </div>
  )
}

interface TemplateCardProps {
  icon: React.ReactNode
  title: string
  description: string
  duration: string
  frequency: string
}

function TemplateCard({ icon, title, description, duration, frequency }: TemplateCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
      <Link href={`/plans/new?template=${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 group-hover:bg-primary/10 transition-colors">
              {icon}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-3">{description}</CardDescription>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{duration}</span>
            <span>•</span>
            <span>{frequency}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
