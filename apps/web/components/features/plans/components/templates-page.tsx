"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Search, 
  Filter, 
  Trophy, 
  Plus, 
  Calendar, 
  Users, 
  User,
  Clock,
  Target,
  Star,
  TrendingUp,
  Dumbbell,
  Heart,
  Zap,
  Copy,
  Edit,
  Trash2,
  Play,
  MoreHorizontal
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Actions
import { getTemplatesAction, createPlanFromTemplateAction, deleteTemplateAction } from "@/actions/plans/session-plan-actions"

// Types
import { SessionPlan } from "@/types/training"

interface TemplateWithStats extends SessionPlan {
  usage_count: number
  avg_rating: number
  creator_name: string
  exercise_count: number
  estimated_duration: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

export function TemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<TemplateWithStats[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [selectedTab, setSelectedTab] = useState("popular")

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true)
      const result = await getTemplatesAction()
      
      if (result.isSuccess) {
        setTemplates(result.data as unknown as TemplateWithStats[])
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
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  // Filter templates
  useEffect(() => {
    const filtered = templates.filter(template => {
      const matchesSearch = (template as any).description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === "all" || template.difficulty_level === selectedDifficulty
      
      return matchesSearch && matchesCategory && matchesDifficulty
    })

    // Sort based on active tab
    switch (selectedTab) {
      case 'popular':
        filtered.sort((a, b) => b.usage_count - a.usage_count)
        break
      case 'rating':
        filtered.sort((a, b) => b.avg_rating - a.avg_rating)
        break
      case 'recent':
        filtered.sort((a, b) => new Date((b as any).created_at || '').getTime() - new Date((a as any).created_at || '').getTime())
        break
      case 'duration':
        filtered.sort((a, b) => a.estimated_duration - b.estimated_duration)
        break
    }

    setFilteredTemplates(filtered)
  }, [templates, searchTerm, selectedCategory, selectedDifficulty, selectedTab])

  // Handle template actions
  const handleUseTemplate = async (templateId: string) => {
    try {
      const result = await createPlanFromTemplateAction(templateId, {
        name: `New Plan from Template ${templateId}`,
        description: "Created from template"
      })
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Template plan created successfully",
        })
        // Redirect to plans page or open MesoWizard with template data
        window.location.href = `/plans?template=${templateId}`
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
        description: "Failed to use template",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const result = await deleteTemplateAction(templateId)
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        })
        await loadTemplates()
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
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <Dumbbell className="h-4 w-4" />
      case 'cardio': return <Heart className="h-4 w-4" />
      case 'hiit': return <Zap className="h-4 w-4" />
      case 'endurance': return <Target className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div>Loading templates...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Templates</h1>
          <p className="text-muted-foreground">
            Discover and use proven training templates created by the community
          </p>
        </div>
        
        <Button onClick={() => window.location.href = "/plans"}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="hiit">HIIT</SelectItem>
            <SelectItem value="endurance">Endurance</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="rating" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Top Rated
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="duration" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Quick
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== "all" || selectedDifficulty !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Be the first to create a template for the community"
                  }
                </p>
                <Button onClick={() => window.location.href = "/plans"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={(template as any).id}
                  template={template}
                  onUse={() => handleUseTemplate((template as any).id)}
                  onDelete={() => handleDeleteTemplate((template as any).id)}
                  getCategoryIcon={getCategoryIcon}
                  getDifficultyColor={getDifficultyColor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TemplateCardProps {
  template: TemplateWithStats
  onUse: () => void
  onDelete: () => void
  getCategoryIcon: (category: string) => React.ReactNode
  getDifficultyColor: (difficulty: string) => string
}

function TemplateCard({ template, onUse, onDelete, getCategoryIcon, getDifficultyColor }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getCategoryIcon(template.category)}
              <div>
                <CardTitle className="text-lg">{(template as any).name || (template as any).description}</CardTitle>
                <CardDescription className="text-sm">
                  {(template as any).description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("capitalize", getDifficultyColor(template.difficulty_level))}>
                {template.difficulty_level}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onUse}>
                    <Play className="h-4 w-4 mr-2" />
                    Use Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = `/templates/${(template as any).id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{template.usage_count} uses</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{template.avg_rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{template.estimated_duration}min</span>
              </div>
            </div>

            {/* Creator info */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">by {template.creator_name}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button onClick={onUse} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button variant="outline" onClick={() => window.location.href = `/templates/${(template as any).id || 1}`}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
