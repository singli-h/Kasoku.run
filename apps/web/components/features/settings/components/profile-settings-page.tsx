/**
 * Profile Settings Page
 * Comprehensive profile management for users with personal information,
 * fitness goals, preferences, and role-specific data
 */

"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, 
  Calendar, 
  MapPin, 
  Camera, 
  Save, 
  Loader2,
  AlertCircle,  
  CheckCircle,
  Settings,
  Target,
  Trophy,
  Clock,
  Heart,
  UserCircle2
} from "lucide-react"
import { format } from "date-fns"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Actions
import { 
  getCurrentUserAction, 
  updateSupabaseUserAction,
  createCurrentUserAction 
} from "@/actions/auth/user-actions"

// Types
import type { 
  User as UserType, 
  UserUpdate,
  Athlete,
  Coach,
  UserWithProfile,
  AthleteUpdate,
  CoachUpdate,
  UserRole,
  Gender,
  ExperienceLevel
} from "@/types/database"

interface ProfileFormData {
  // Basic Information
  first_name: string
  last_name: string
  username: string
  email: string
  
  // Personal Information
  birthdate: string | null
  sex: Gender | null
  timezone: string
  avatar_url: string | null
  
  // Role-specific data
  role: UserRole
  
  // Metadata for custom fields
  metadata: Record<string, any>
}

interface AthleteFormData {
  height: number | null
  weight: number | null
  training_goals: string | null
  experience: ExperienceLevel | null
  events: any[] | null
}

interface CoachFormData {
  experience: string | null
  philosophy: string | null
  speciality: string | null
  sport_focus: string | null
}

const timezones: Array<{ value: string; label: string }> = [
  { value: "UTC", label: "UTC - Coordinated Universal Time" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "GMT - Greenwich Mean Time" },
  { value: "Europe/Paris", label: "CET - Central European Time" },
  { value: "Asia/Tokyo", label: "JST - Japan Standard Time" },
  { value: "Australia/Sydney", label: "AEST - Australian Eastern Time" }
]

const experienceLevels: Array<{ value: ExperienceLevel; label: string; description: string }> = [
  { value: "beginner", label: "Beginner", description: "New to structured training" },
  { value: "intermediate", label: "Intermediate", description: "1-3 years of training experience" },
  { value: "advanced", label: "Advanced", description: "3+ years, competitive experience" },
  { value: "elite", label: "Elite", description: "Professional or high-level competitive athlete" }
]

export function ProfileSettingsPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { toast } = useToast()
  
  // State
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState(false)
  
  // Form data
  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    birthdate: null,
    sex: null,
    timezone: "UTC",
    avatar_url: null,
    role: "athlete",
    metadata: {}
  })
  
  const [athleteData, setAthleteData] = useState<AthleteFormData>({
    height: null,
    weight: null,
    training_goals: null,
    experience: null,
    events: null
  })
  
  const [coachData, setCoachData] = useState<CoachFormData>({
    experience: null,
    philosophy: null,
    speciality: null,
    sport_focus: null
  })

  // Load user data
  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      const result = await getCurrentUserAction()
      
      if (!result.isSuccess) {
        // If user doesn't exist in database, try to create them
        if (result.message.includes("not found in database")) {
          const createResult = await createCurrentUserAction()
          if (createResult.isSuccess) {
            setUser(createResult.data)
            populateFormData(createResult.data)
          } else {
            toast({
              title: "Error",
              description: "Failed to create user profile",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Error", 
            description: result.message,
            variant: "destructive"
          })
        }
        return
      }
      
      setUser(result.data)
      populateFormData(result.data)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Populate form data from user object
  const populateFormData = (userData: UserWithProfile) => {
    setProfileData({
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      username: userData.username || "",
      email: userData.email || "",
      birthdate: userData.birthdate || null,
      sex: userData.sex as Gender || null,
      timezone: userData.timezone || "UTC",
      avatar_url: userData.avatar_url || null,
      role: userData.role as UserRole || "athlete",
      metadata: userData.metadata || {}
    })
    
    if (userData.athlete) {
      setAthleteData({
        height: userData.athlete.height,
        weight: userData.athlete.weight,
        training_goals: userData.athlete.training_goals,
        experience: userData.athlete.experience as ExperienceLevel || null,
        events: userData.athlete.events as any[] || null
      })
    }
    
    if (userData.coach) {
      setCoachData({
        experience: userData.coach.experience,
        philosophy: userData.coach.philosophy,
        speciality: userData.coach.speciality,
        sport_focus: userData.coach.sport_focus
      })
    }
    
    // Set date picker date
    if (userData.birthdate) {
      setSelectedDate(new Date(userData.birthdate))
    }
  }

  // Handle form field changes
  const handleProfileChange = (field: keyof ProfileFormData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleAthleteChange = (field: keyof AthleteFormData, value: any) => {
    setAthleteData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleCoachChange = (field: keyof CoachFormData, value: any) => {
    setCoachData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      handleProfileChange('birthdate', format(date, 'yyyy-MM-dd'))
    } else {
      handleProfileChange('birthdate', null)
    }
    setShowCalendar(false)
  }

  // Save profile changes
  const handleSave = async () => {
    if (!user || !clerkUser) return
    
    try {
      setIsSaving(true)
      
      // Prepare update data
      const updateData: UserUpdate = {
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        username: profileData.username,
        birthdate: profileData.birthdate,
        sex: profileData.sex,
        timezone: profileData.timezone,
        role: profileData.role,
        metadata: profileData.metadata
      }
      
      // Update user in Supabase
      const result = await updateSupabaseUserAction(clerkUser.id, updateData)
      
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      
      // Update local state
      setUser(result.data)
      setHasChanges(false)
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully"
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      loadUserData()
    }
  }, [clerkLoaded, clerkUser])

  // Loading state - handled by PageLayout
  if (!clerkLoaded || isLoading) {
    return <div>Loading...</div>
  }

  // Error state - no user
  if (!clerkUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view profile settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          {profileData.role === "athlete" && (
            <TabsTrigger value="athlete" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Training
            </TabsTrigger>
          )}
          {profileData.role === "coach" && (
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Coaching
            </TabsTrigger>
          )}
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your basic profile information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.first_name}
                    onChange={(e) => handleProfileChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.last_name}
                    onChange={(e) => handleProfileChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    placeholder="Choose a username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed through your account provider
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={profileData.role === 'athlete' ? 'default' : 'secondary'}>
                  {profileData.role === 'athlete' ? 'Athlete' : 'Coach'}
                </Badge>
                <Badge variant="outline">
                  {user?.subscription_status || 'Trial'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Personal details and demographic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Birth Date</Label>
                  <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select birth date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sex">Gender</Label>
                  <Select 
                    value={profileData.sex || ""} 
                    onValueChange={(value) => handleProfileChange('sex', value as Gender)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={profileData.timezone} 
                    onValueChange={(value) => handleProfileChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Athlete Tab */}
        {profileData.role === "athlete" && (
          <TabsContent value="athlete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Training Profile
                </CardTitle>
                <CardDescription>
                  Your training goals, experience, and physical metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={athleteData.height || ""}
                      onChange={(e) => handleAthleteChange('height', parseInt(e.target.value) || null)}
                      placeholder="Enter height in cm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={athleteData.weight || ""}
                      onChange={(e) => handleAthleteChange('weight', parseInt(e.target.value) || null)}
                      placeholder="Enter weight in kg"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select 
                      value={athleteData.experience || ""} 
                      onValueChange={(value) => handleAthleteChange('experience', value as ExperienceLevel)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex flex-col">
                              <span>{level.label}</span>
                              <span className="text-xs text-muted-foreground">{level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="trainingGoals">Training Goals</Label>
                    <Textarea
                      id="trainingGoals"
                      value={athleteData.training_goals || ""}
                      onChange={(e) => handleAthleteChange('training_goals', e.target.value)}
                      placeholder="Describe your training goals and objectives..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Coach Tab */}
        {profileData.role === "coach" && (
          <TabsContent value="coach" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Coaching Profile
                </CardTitle>
                <CardDescription>
                  Your coaching experience, philosophy, and specializations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coachExperience">Coaching Experience</Label>
                    <Textarea
                      id="coachExperience"
                      value={coachData.experience || ""}
                      onChange={(e) => handleCoachChange('experience', e.target.value)}
                      placeholder="Describe your coaching background and experience..."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="philosophy">Coaching Philosophy</Label>
                    <Textarea
                      id="philosophy"
                      value={coachData.philosophy || ""}
                      onChange={(e) => handleCoachChange('philosophy', e.target.value)}
                      placeholder="Share your coaching philosophy and approach..."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speciality">Specialization</Label>
                      <Input
                        id="speciality"
                        value={coachData.speciality || ""}
                        onChange={(e) => handleCoachChange('speciality', e.target.value)}
                        placeholder="e.g., Endurance, Strength, Sprint"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sportFocus">Sport Focus</Label>
                      <Input
                        id="sportFocus"
                        value={coachData.sport_focus || ""}
                        onChange={(e) => handleCoachChange('sport_focus', e.target.value)}
                        placeholder="e.g., Track & Field, Marathon, CrossFit"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Preferences
              </CardTitle>
              <CardDescription>
                Configure your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Onboarding Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Whether you've completed the initial setup
                    </p>
                  </div>
                  <Badge variant={user?.onboarding_completed ? "default" : "secondary"}>
                    {user?.onboarding_completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Account Type</h4>
                    <p className="text-sm text-muted-foreground">
                      Your current subscription status
                    </p>
                  </div>
                  <Badge variant="outline">
                    {user?.subscription_status || "Trial"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Account Created</h4>
                    <p className="text-sm text-muted-foreground">
                      When you joined the platform
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user?.created_at ? format(new Date(user.created_at), "PPP") : "Unknown"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Button Footer */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex justify-center"
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  You have unsaved changes
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
