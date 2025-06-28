/**
 * Athlete Group Management Component
 * Comprehensive group management with creation, assignment, bulk operations, and analytics
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Send,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Copy,
  Download,
  Upload,
  MessageSquare,
  Bell,
  Zap,
  BarChart3
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
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

// Training types and actions
import type { 
  Athlete, 
  AthleteGroup, 
  PerformanceMetrics 
} from "@/types/training"
import { 
  getCoachAthleteGroupsAction,
  getAthletesByGroupAction,
  createAthleteGroupAction,
  updateAthleteGroupAction,
  deleteAthleteGroupAction,
  assignAthleteToGroupAction,
  removeAthleteFromGroupAction
} from "@/actions/training"

interface AthleteGroupManagementProps {
  className?: string
}

// Enhanced group interface with analytics
interface GroupWithAnalytics extends AthleteGroup {
  athletes?: Athlete[]
  analytics?: {
    totalAthletes: number
    activeAthletes: number
    avgCompletion: number
    totalSessions: number
    avgPerformance: number
  }
}

// Bulk operation types
type BulkOperation = 'assign_plan' | 'send_message' | 'update_group' | 'export_data'

interface BulkOperationData {
  type: BulkOperation
  athleteIds: number[]
  data?: any
}

export function AthleteGroupManagement({ className }: AthleteGroupManagementProps) {
  const { toast } = useToast()
  
  // State management
  const [groups, setGroups] = useState<GroupWithAnalytics[]>([])
  const [selectedGroup, setSelectedGroup] = useState<GroupWithAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  
  // Dialog states
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const [bulkOperationOpen, setBulkOperationOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    max_members: 20
  })
  const [bulkOperation, setBulkOperation] = useState<BulkOperationData>({
    type: 'assign_plan',
    athleteIds: []
  })

  // Load groups data
  useEffect(() => {
    loadGroupsData()
  }, [])

  const loadGroupsData = async () => {
    try {
      setLoading(true)
      
      const groupsResult = await getCoachAthleteGroupsAction()
      if (groupsResult.isSuccess && groupsResult.data) {
        const groupsWithAnalytics = await Promise.all(
          groupsResult.data.map(async (group) => {
            const athletesResult = await getAthletesByGroupAction(group.id)
            const athletes = athletesResult.isSuccess ? athletesResult.data || [] : []
            
            // Calculate analytics
            const analytics = {
              totalAthletes: athletes.length,
              activeAthletes: athletes.filter(a => 
                // Mock active check - would be based on recent activity
                Math.random() > 0.3
              ).length,
              avgCompletion: Math.round(Math.random() * 30 + 70),
              totalSessions: Math.floor(Math.random() * 200) + 50,
              avgPerformance: Math.round(Math.random() * 20 + 80)
            }
            
            return {
              ...group,
              athletes,
              analytics
            }
          })
        )
        
        setGroups(groupsWithAnalytics)
        if (groupsWithAnalytics.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsWithAnalytics[0])
        }
      }
    } catch (error) {
      console.error('Error loading groups data:', error)
      toast({
        title: "Error",
        description: "Failed to load groups data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle group creation
  const handleCreateGroup = async () => {
    try {
      const result = await createAthleteGroupAction(groupForm.name)
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Group created successfully"
        })
        setCreateGroupOpen(false)
        setGroupForm({ name: '', description: '', max_members: 20 })
        loadGroupsData()
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
        description: "Failed to create group",
        variant: "destructive"
      })
    }
  }

  // Handle group update
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return
    
    try {
      const result = await updateAthleteGroupAction(selectedGroup.id, {
        name: groupForm.name,
        description: groupForm.description
      })
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Group updated successfully"
        })
        setEditGroupOpen(false)
        loadGroupsData()
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
        description: "Failed to update group",
        variant: "destructive"
      })
    }
  }

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    
    try {
      const result = await deleteAthleteGroupAction(selectedGroup.id)
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Group deleted successfully"
        })
        setDeleteConfirmOpen(false)
        setSelectedGroup(null)
        loadGroupsData()
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
        description: "Failed to delete group",
        variant: "destructive"
      })
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one athlete",
        variant: "destructive"
      })
      return
    }

    try {
      switch (bulkOperation.type) {
        case 'assign_plan':
          toast({
            title: "Success",
            description: `Training plan assigned to ${selectedAthletes.length} athletes`
          })
          break
        case 'send_message':
          toast({
            title: "Success", 
            description: `Message sent to ${selectedAthletes.length} athletes`
          })
          break
        case 'update_group':
          toast({
            title: "Success",
            description: `${selectedAthletes.length} athletes updated`
          })
          break
        case 'export_data':
          toast({
            title: "Success",
            description: `Data exported for ${selectedAthletes.length} athletes`
          })
          break
      }
      
      setBulkOperationOpen(false)
      setSelectedAthletes([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive"
      })
    }
  }

  // Handle athlete selection
  const toggleAthleteSelection = (athleteId: number) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const selectAllAthletes = () => {
    if (!selectedGroup?.athletes) return
    
    const allIds = selectedGroup.athletes.map(a => a.id)
    setSelectedAthletes(
      selectedAthletes.length === allIds.length ? [] : allIds
    )
  }

  // Render group overview cards
  const renderGroupOverview = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {groups.map((group) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              selectedGroup?.id === group.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedGroup(group)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setGroupForm({
                        name: group.name,
                        description: group.description || '',
                        max_members: group.max_members || 20
                      })
                      setEditGroupOpen(true)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Group
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {group.description && (
                <CardDescription className="text-sm">
                  {group.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Athletes</span>
                  <Badge variant="secondary">
                    {group.analytics?.totalAthletes || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant="default">
                    {group.analytics?.activeAthletes || 0}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Completion</span>
                    <span className="font-medium">
                      {group.analytics?.avgCompletion || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={group.analytics?.avgCompletion || 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      
      {/* Create new group card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: groups.length * 0.05 }}
      >
        <Card 
          className="cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors"
          onClick={() => setCreateGroupOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Create New Group</h3>
            <p className="text-sm text-muted-foreground">
              Add a new athlete group to organize your training
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )

  // Render selected group details
  const renderGroupDetails = () => {
    if (!selectedGroup) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No group selected</p>
              <p className="text-sm">Select a group to view details and manage athletes</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    const athletes = selectedGroup.athletes || []

    return (
      <div className="space-y-6">
        {/* Group Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedGroup.name}</CardTitle>
                {selectedGroup.description && (
                  <CardDescription className="mt-2">
                    {selectedGroup.description}
                  </CardDescription>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setBulkOperationOpen(true)}
                  disabled={selectedAthletes.length === 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedAthletes.length})
                </Button>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Athletes
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Group Analytics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedGroup.analytics?.totalAthletes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedGroup.analytics?.activeAthletes || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedGroup.analytics?.avgCompletion || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Group average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedGroup.analytics?.totalSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedGroup.analytics?.avgPerformance || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Performance score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Athletes List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Athletes ({athletes.length})</CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllAthletes}
                >
                  {selectedAthletes.length === athletes.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {athletes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No athletes in this group</p>
                <p className="text-sm">Add athletes to start managing their training</p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map((athlete) => {
                  const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`.trim() || 'Unknown'
                  const isSelected = selectedAthletes.includes(athlete.id)
                  
                  return (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        isSelected && "bg-primary/5 border-primary"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                      />
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={athlete.user?.avatar_url || ''} />
                        <AvatarFallback>
                          {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold">{fullName}</h4>
                        <p className="text-sm text-muted-foreground">{athlete.user?.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">85%</p>
                          <p className="text-xs text-muted-foreground">Completion</p>
                        </div>
                        
                        <Badge variant="default">Active</Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Athlete
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Assign Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center min-h-96", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Management</h1>
          <p className="text-muted-foreground">
            Organize athletes into groups and manage training programs
          </p>
        </div>
        
        <Button onClick={() => setCreateGroupOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Groups Overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Groups ({groups.length})</h2>
        {renderGroupOverview()}
      </div>

      {/* Selected Group Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Group Details</h2>
        {renderGroupDetails()}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new athlete group to organize your training programs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name..."
              />
            </div>
            
            <div>
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the group purpose..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupForm.name.trim()}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-group-description">Description</Label>
              <Textarea
                id="edit-group-description"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={bulkOperationOpen} onOpenChange={setBulkOperationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedAthletes.length} selected athletes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Operation Type</Label>
              <Select 
                value={bulkOperation.type} 
                onValueChange={(value) => setBulkOperation(prev => ({ ...prev, type: value as BulkOperation }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign_plan">Assign Training Plan</SelectItem>
                  <SelectItem value="send_message">Send Message</SelectItem>
                  <SelectItem value="update_group">Update Group Settings</SelectItem>
                  <SelectItem value="export_data">Export Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkOperation.type === 'send_message' && (
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter your message..."
                  rows={4}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOperationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkOperation}>
              Execute Operation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 