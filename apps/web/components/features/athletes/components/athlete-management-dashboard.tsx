/**
 * Athlete Management Dashboard
 * Comprehensive dashboard for coaches to manage athletes with lists, 
 * performance overview cards, recent activity, and quick actions
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  UserPlus, 
  Settings,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Trash2,
  Mail,
  Download
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/lib/hooks/use-mobile"

// Import group management component
import { AthleteGroupManagement } from "./athlete-group-management"

// Training types and actions
import type { 
  Athlete, 
  AthleteGroup, 
  ExperienceLevel,
  PerformanceMetrics 
} from "@/types/training"
import { 
  getCoachAthleteGroupsAction,
  getAthletesByGroupAction,
  createAthleteGroupAction,
  assignAthleteToGroupAction,
  removeAthleteFromGroupAction
} from "@/actions/training"

interface AthleteManagementDashboardProps {
  className?: string
}

// View modes for athlete display
type ViewMode = 'grid' | 'list'
type SortMode = 'name' | 'group' | 'performance' | 'activity'
type FilterMode = 'all' | 'active' | 'inactive' | 'new'

// Enhanced athlete interface with computed metrics
interface AthleteWithMetrics extends Athlete {
  user?: {
    id: number
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
  athlete_group?: AthleteGroup | null
  performanceMetrics?: PerformanceMetrics
  recentActivity?: {
    lastSession: string | null
    completedSessions: number
    streak: number
  }
}

export function AthleteManagementDashboard({ className }: AthleteManagementDashboardProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  // State management
  const [athletes, setAthletes] = useState<AthleteWithMetrics[]>([])
  const [athleteGroups, setAthleteGroups] = useState<AthleteGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortMode, setSortMode] = useState<SortMode>('name')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [selectedAthletes, setSelectedAthletes] = useState<AthleteWithMetrics[]>([])

  // Load initial data
  useEffect(() => {
    loadAthleteData()
  }, [])

  const loadAthleteData = async () => {
    try {
      setLoading(true)
      
      // Load athlete groups
      const groupsResult = await getCoachAthleteGroupsAction()
      if (groupsResult.isSuccess && groupsResult.data) {
        setAthleteGroups(groupsResult.data)
        
        // Load athletes for each group
        const allAthletes: AthleteWithMetrics[] = []
        for (const group of groupsResult.data) {
          const athletesResult = await getAthletesByGroupAction(group.id)
          if (athletesResult.isSuccess && athletesResult.data) {
            allAthletes.push(...athletesResult.data.map(athlete => ({
              ...athlete,
              // Mock performance metrics (would come from actual data)
              performanceMetrics: {
                total_sets: Math.floor(Math.random() * 500) + 100,
                total_reps: Math.floor(Math.random() * 2000) + 500,
                total_weight: Math.floor(Math.random() * 50000) + 10000,
                average_rpe: Math.random() * 3 + 7,
                completion_rate: Math.random() * 30 + 70,
                streak_days: Math.floor(Math.random() * 30)
              },
              recentActivity: {
                lastSession: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                completedSessions: Math.floor(Math.random() * 50) + 10,
                streak: Math.floor(Math.random() * 15)
              }
            })))
          }
        }
        setAthletes(allAthletes)
      }
    } catch (error) {
      console.error('Error loading athlete data:', error)
      toast({
        title: "Error",
        description: "Failed to load athlete data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort athletes
  const filteredAndSortedAthletes = useMemo(() => {
    let filtered = [...athletes]
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(athlete => {
        const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.toLowerCase()
        const email = athlete.user?.email?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        return fullName.includes(search) || email.includes(search)
      })
    }
    
    // Apply group filter
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(athlete => 
        athlete.athlete_group?.id.toString() === selectedGroup
      )
    }
    
    // Apply status filter
    switch (filterMode) {
      case 'active':
        filtered = filtered.filter(athlete => 
          athlete.recentActivity?.lastSession && 
          new Date(athlete.recentActivity.lastSession) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        break
      case 'inactive':
        filtered = filtered.filter(athlete => 
          !athlete.recentActivity?.lastSession || 
          new Date(athlete.recentActivity.lastSession) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        break
      case 'new':
        // Note: Athletes table doesn't have created_at field, so we'll skip this filter for now
        // In a real implementation, this would be based on when the athlete was added to the system
        break
    }
    
    // Apply sorting
            switch (sortMode) {
      case 'name':
        filtered.sort((a, b) => {
          const nameA = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.toLowerCase()
          const nameB = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })
        break
      case 'group':
        filtered.sort((a, b) => {
          const groupA = a.athlete_group?.group_name || ''
          const groupB = b.athlete_group?.group_name || ''
          return groupA.localeCompare(groupB)
        })
        break
      case 'performance':
        filtered.sort((a, b) => 
          (b.performanceMetrics?.completion_rate || 0) - (a.performanceMetrics?.completion_rate || 0)
        )
        break
      case 'activity':
        filtered.sort((a, b) => {
          const dateA = a.recentActivity?.lastSession ? new Date(a.recentActivity.lastSession) : new Date(0)
          const dateB = b.recentActivity?.lastSession ? new Date(b.recentActivity.lastSession) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
        break
    }
    
    return filtered
  }, [athletes, searchTerm, selectedGroup, filterMode, sortMode])

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const total = athletes.length
    const active = athletes.filter(a => 
      a.recentActivity?.lastSession && 
      new Date(a.recentActivity.lastSession) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    const avgCompletion = athletes.reduce((sum, a) => 
      sum + (a.performanceMetrics?.completion_rate || 0), 0
    ) / (total || 1)
    const totalGroups = athleteGroups.length
    
    return {
      total,
      active,
      inactive: total - active,
      avgCompletion: Math.round(avgCompletion),
      totalGroups
    }
  }, [athletes, athleteGroups])

  // Render dashboard header
  const renderDashboardHeader = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Athlete Management</h1>
          <p className="text-muted-foreground">
            Manage your athletes and track their training progress
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Athlete
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.totalGroups} groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Athletes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Athletes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardStats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.avgCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Training completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              Active training groups
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render search and filter controls
  const renderControls = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search athletes by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          {/* Group Filter */}
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {athleteGroups.map(group => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.group_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Sort */}
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  // Render athlete card (grid view)
  const renderAthleteCard = (athlete: AthleteWithMetrics) => {
    const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
    const isActive = athlete.recentActivity?.lastSession && 
      new Date(athlete.recentActivity.lastSession) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    return (
      <motion.div
        key={athlete.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={athlete.user?.avatar_url || ''} />
                  <AvatarFallback>
                    {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">{fullName}</h3>
                  <p className="text-sm text-muted-foreground">{athlete.user?.email}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status and Group */}
            <div className="flex items-center justify-between">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                {athlete.athlete_group?.group_name || 'No Group'}
              </Badge>
            </div>
            
            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">
                  {Math.round(athlete.performanceMetrics?.completion_rate || 0)}%
                </span>
              </div>
              <Progress value={athlete.performanceMetrics?.completion_rate || 0} className="h-2" />
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sessions</p>
                <p className="font-medium">{athlete.recentActivity?.completedSessions || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Streak</p>
                <p className="font-medium">{athlete.recentActivity?.streak || 0} days</p>
              </div>
            </div>
            
            {/* Last Session */}
            {athlete.recentActivity?.lastSession && (
              <div className="text-sm">
                <p className="text-muted-foreground">Last Session</p>
                <p className="font-medium">
                  {new Date(athlete.recentActivity.lastSession).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Render athlete list item (list view)
  const renderAthleteListItem = (athlete: AthleteWithMetrics) => {
    const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
    const isActive = athlete.recentActivity?.lastSession && 
      new Date(athlete.recentActivity.lastSession) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    return (
      <motion.div
        key={athlete.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={athlete.user?.avatar_url || ''} />
                  <AvatarFallback>
                    {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">{fullName}</h3>
                  <p className="text-sm text-muted-foreground">{athlete.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {Math.round(athlete.performanceMetrics?.completion_rate || 0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Completion</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {athlete.recentActivity?.completedSessions || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <Badge variant="outline">
                    {athlete.athlete_group?.group_name || 'No Group'}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center min-h-96", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading athletes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with mobile-optimized layout */}
      <div className="flex-mobile-center gap-4 mb-6">
        <div>
          <h1 className="text-mobile-xl font-bold tracking-tight">Athletes</h1>
          <p className="text-muted-foreground text-mobile-base">
            Manage your athletes and track their progress
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="touch-target mobile-animate-fast"
          size={isMobile ? "lg" : "default"}
        >
          <Plus className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"} />
          Add Athlete
        </Button>
      </div>

      {/* Search and filters with mobile optimization */}
      <div className="flex-mobile-stack gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
              isMobile ? 'h-5 w-5' : 'h-4 w-4'
            }`} />
            <Input
              placeholder={isMobile ? "Search athletes..." : "Search athletes by name or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isMobile ? 'form-input-mobile' : 'form-input-desktop'}`}
              style={{ fontSize: isMobile ? '16px' : undefined }}
            />
          </div>
        </div>
        
        <div className="flex-mobile-stack gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-full sm:w-[150px] ${isMobile ? 'touch-target' : ''}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className={`w-full sm:w-[150px] ${isMobile ? 'touch-target' : ''}`}>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {athleteGroups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.group_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size={isMobile ? "lg" : "sm"}
              onClick={() => setViewMode("grid")}
              className={isMobile ? "touch-target-sm" : ""}
            >
              <Grid3X3 className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              {isMobile && <span className="ml-2">Grid</span>}
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size={isMobile ? "lg" : "sm"}
              onClick={() => setViewMode("list")}
              className={isMobile ? "touch-target-sm" : ""}
            >
              <List className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              {isMobile && <span className="ml-2">List</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards with mobile-responsive grid */}
      <div className="grid-mobile-cards mb-8">
        <Card className="mobile-card-spacing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-mobile-base font-medium">Total Athletes</CardTitle>
            <Users className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-2xl'}`}>
              {filteredAndSortedAthletes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 10) + 1} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card-spacing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-mobile-base font-medium">Active Athletes</CardTitle>
            <Activity className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-2xl'}`}>
              {filteredAndSortedAthletes.filter(a => a.recentActivity?.lastSession).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((filteredAndSortedAthletes.filter(a => a.recentActivity?.lastSession).length / filteredAndSortedAthletes.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card-spacing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-mobile-base font-medium">Avg Completion</CardTitle>
            <TrendingUp className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-2xl'}`}>
              {Math.round(filteredAndSortedAthletes.reduce((acc, athlete) => acc + (athlete.performanceMetrics?.completion_rate || 0), 0) / filteredAndSortedAthletes.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card-spacing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-mobile-base font-medium">Total Groups</CardTitle>
            <Users className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-2xl'}`}>
              {athleteGroups.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card-spacing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-mobile-base font-medium">This Week</CardTitle>
            <Calendar className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-2xl'}`}>
              {Math.floor(Math.random() * 50) + 20}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Athletes list/grid with mobile optimization */}
      <Card className="mobile-card-spacing">
        <CardHeader>
          <div className="flex-mobile-center">
            <div>
              <CardTitle className="text-mobile-lg">Athletes</CardTitle>
              <CardDescription className="text-mobile-base">
                {filteredAndSortedAthletes.length} athlete{filteredAndSortedAthletes.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            {selectedAthletes.length > 0 && (
              <div className="mobile-button-group">
                <Button 
                  variant="outline" 
                  size={isMobile ? "lg" : "sm"}
                  className="touch-target-sm"
                >
                  <Mail className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"} />
                  Message ({selectedAthletes.length})
                </Button>
                <Button 
                  variant="outline" 
                  size={isMobile ? "lg" : "sm"}
                  className="touch-target-sm"
                >
                  <Download className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"} />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid-mobile-cards">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="mobile-card-spacing border rounded-lg">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid-mobile-cards"
                : "mobile-section-spacing"
            }>
              {filteredAndSortedAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className={`group cursor-pointer transition-all mobile-animate-fast ${
                    viewMode === "grid"
                      ? "border rounded-lg mobile-card-spacing hover:shadow-md"
                      : "border-b pb-4 last:border-b-0"
                  }`}
                  onClick={() => setSelectedAthletes([athlete])}
                >
                  {/* Mobile-optimized athlete card content */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className={isMobile ? "h-12 w-12" : "h-10 w-10"}>
                        <AvatarImage src={athlete.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {athlete.user?.first_name?.[0]}{athlete.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 rounded-full border-2 border-background ${
                        athlete.recentActivity?.lastSession ? "bg-green-500" : "bg-gray-400"
                      } ${isMobile ? "h-4 w-4" : "h-3 w-3"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex-mobile-center gap-2">
                        <h3 className="font-medium text-mobile-base truncate">
                          {athlete.user?.first_name} {athlete.user?.last_name}
                        </h3>
                        <Badge 
                          variant={athlete.recentActivity?.lastSession ? "default" : "secondary"}
                          className={isMobile ? "text-xs px-2 py-1" : "text-xs"}
                        >
                          {athlete.recentActivity?.lastSession ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm truncate">
                        {athlete.user?.email}
                      </p>
                      {athlete.athlete_group?.group_name && (
                        <p className="text-muted-foreground text-xs">
                          Group: {athlete.athlete_group.group_name}
                        </p>
                      )}
                      
                      {viewMode === "grid" && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Completion:</span>
                            <span className="ml-1 font-medium">
                              {athlete.performanceMetrics?.completion_rate || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sessions:</span>
                            <span className="ml-1 font-medium">
                              {athlete.recentActivity?.completedSessions || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size={isMobile ? "lg" : "sm"}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          isMobile ? "touch-target-sm opacity-100" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle edit action
                        }}
                      >
                        <MoreHorizontal className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 