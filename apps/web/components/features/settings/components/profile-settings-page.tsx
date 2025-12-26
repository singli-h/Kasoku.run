/**
 * Profile Settings Page - 2025/2026 Design
 *
 * Modern vertical scroll layout with bento grid sections,
 * scroll-triggered animations, and micro-interactions.
 * Designed following editorial utility aesthetic.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  User,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Target,
  Trophy,
  Clock,
  Ruler,
  Weight,
  Sparkles,
  Globe,
  Mail,
  AtSign,
  ChevronDown,
  Shield,
  Zap
} from "lucide-react"
import { format } from "date-fns"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Actions
import {
  getCurrentUserWithProfileAction,
  updateSupabaseUserAction,
  createCurrentUserAction,
  type UserWithProfile
} from "@/actions/auth/user-actions"
import { createOrUpdateAthleteProfileAction } from "@/actions/athletes/athlete-actions"
import { createOrUpdateCoachProfileAction } from "@/actions/athletes/coach-management-actions"

// Import proper types from database
import type { Database, Json } from "@/types/database"

// Define types from database schema
type UserInsert = Database['public']['Tables']['users']['Insert']

type UserRole = 'athlete' | 'coach' | 'admin'
type Gender = 'male' | 'female' | 'other'
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

interface ProfileFormData {
  first_name: string
  last_name: string
  username: string
  email: string
  birthdate: string | null
  sex: Gender | null
  timezone: string
  avatar_url: string | null
  role: UserRole
  metadata: Record<string, unknown>
}

interface AthleteFormData {
  height: number | null
  weight: number | null
  training_goals: string | null
  experience: ExperienceLevel | null
  events: unknown[] | null
}

interface CoachFormData {
  experience: string | null
  philosophy: string | null
  speciality: string | null
  sport_focus: string | null
}

const timezones: Array<{ value: string; label: string }> = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" }
]

const experienceLevels: Array<{ value: ExperienceLevel; label: string; description: string }> = [
  { value: "beginner", label: "Beginner", description: "New to structured training" },
  { value: "intermediate", label: "Intermediate", description: "1-3 years experience" },
  { value: "advanced", label: "Advanced", description: "3+ years, competitive" },
  { value: "elite", label: "Elite", description: "Professional level" }
]

// ============================================================================
// Animated Section Component
// ============================================================================

interface SectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

function AnimatedSection({ children, className, delay = 0 }: SectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ============================================================================
// Bento Card Component
// ============================================================================

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'highlight' | 'subtle'
}

function BentoCard({ children, className, variant = 'default' }: BentoCardProps) {
  const variants = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
    highlight: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900',
    subtle: 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50'
  }

  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all duration-300',
      'hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50',
      'hover:-translate-y-0.5',
      variants[variant],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// Form Field with Micro-interactions
// ============================================================================

interface FormFieldProps {
  label: string
  icon?: React.ReactNode
  description?: string
  children: React.ReactNode
  className?: string
}

function FormField({ label, icon, description, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2 group", className)}>
      <Label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400">
        {icon && <span className="text-zinc-400 group-focus-within:text-amber-500 transition-colors">{icon}</span>}
        {label}
      </Label>
      <div className="relative">
        {children}
      </div>
      {description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
      )}
    </div>
  )
}

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  badge?: string
}

function SectionHeader({ title, subtitle, icon, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 text-zinc-600 dark:text-zinc-400">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
      {badge && (
        <Badge variant="outline" className="text-xs font-medium">
          {badge}
        </Badge>
      )}
    </div>
  )
}

// ============================================================================
// Stats Card for Account Info
// ============================================================================

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
      <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

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
      const result = await getCurrentUserWithProfileAction()

      if (!result.isSuccess) {
        if (result.message.includes("not found in database")) {
          const createResult = await createCurrentUserAction()
          if (createResult.isSuccess && createResult.data) {
            const profileResult = await getCurrentUserWithProfileAction()
            if (profileResult.isSuccess && profileResult.data) {
              setUser(profileResult.data)
              populateFormData(profileResult.data)
            } else {
              setUser(createResult.data as UserWithProfile)
              populateFormData(createResult.data as UserWithProfile)
            }
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
      metadata: (userData.metadata && typeof userData.metadata === 'object' && !Array.isArray(userData.metadata))
        ? userData.metadata as Record<string, unknown>
        : {}
    })

    if (userData.athlete) {
      setAthleteData({
        height: userData.athlete.height,
        weight: userData.athlete.weight,
        training_goals: userData.athlete.training_goals,
        experience: userData.athlete.experience as ExperienceLevel || null,
        events: userData.athlete.events as unknown[] || null
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

    if (userData.birthdate) {
      setSelectedDate(new Date(userData.birthdate))
    }
  }

  const handleProfileChange = (field: keyof ProfileFormData, value: unknown) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleAthleteChange = (field: keyof AthleteFormData, value: unknown) => {
    setAthleteData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleCoachChange = (field: keyof CoachFormData, value: unknown) => {
    setCoachData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      handleProfileChange('birthdate', format(date, 'yyyy-MM-dd'))
    } else {
      handleProfileChange('birthdate', null)
    }
    setShowCalendar(false)
  }

  const handleSave = async () => {
    if (!user || !clerkUser) return

    try {
      setIsSaving(true)

      const updateData: Partial<UserInsert> = {
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        username: profileData.username,
        birthdate: profileData.birthdate,
        sex: profileData.sex,
        timezone: profileData.timezone,
        role: profileData.role,
        metadata: profileData.metadata as { [key: string]: Json | undefined }
      }

      const userResult = await updateSupabaseUserAction(clerkUser.id, updateData)

      if (!userResult.isSuccess) {
        throw new Error(userResult.message)
      }

      if (profileData.role === 'athlete' && athleteData) {
        const athleteResult = await createOrUpdateAthleteProfileAction({
          height: athleteData.height,
          weight: athleteData.weight,
          training_goals: athleteData.training_goals,
          experience: athleteData.experience,
          events: athleteData.events
        })

        if (!athleteResult.isSuccess) {
          console.warn('Failed to update athlete profile:', athleteResult.message)
        }
      } else if (profileData.role === 'coach' && coachData) {
        const coachResult = await createOrUpdateCoachProfileAction({
          experience: coachData.experience,
          philosophy: coachData.philosophy,
          speciality: coachData.speciality,
          sport_focus: coachData.sport_focus
        })

        if (!coachResult.isSuccess) {
          console.warn('Failed to update coach profile:', coachResult.message)
        }
      }

      setUser(userResult.data)
      setHasChanges(false)

      toast({
        title: "Changes saved",
        description: "Your profile has been updated successfully"
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

  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      loadUserData()
    }
  }, [clerkLoaded, clerkUser])

  // Loading state
  if (!clerkLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-zinc-200 dark:border-zinc-700" />
            <motion.div
              className="absolute inset-0 w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-zinc-500">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

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
    <div className="relative max-w-5xl mx-auto pb-32">

        {/* ================================================================ */}
        {/* SECTION 1: Identity */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.1} className="mb-12">
          <SectionHeader
            title="Identity"
            subtitle="Your name and account details"
            icon={<User className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BentoCard className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="First Name" icon={<User className="w-4 h-4" />}>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => handleProfileChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </FormField>

                <FormField label="Last Name" icon={<User className="w-4 h-4" />}>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) => handleProfileChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </FormField>
              </div>
            </BentoCard>

            <BentoCard>
              <FormField
                label="Username"
                icon={<AtSign className="w-4 h-4" />}
                description="Your unique identifier on the platform"
              >
                <Input
                  value={profileData.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                  placeholder="Choose a username"
                  className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </FormField>
            </BentoCard>

            <BentoCard variant="subtle">
              <FormField
                label="Email"
                icon={<Mail className="w-4 h-4" />}
                description="Managed by your auth provider"
              >
                <Input
                  value={profileData.email}
                  disabled
                  className="h-12 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed"
                />
              </FormField>
            </BentoCard>
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 2: Personal Details */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.2} className="mb-12">
          <SectionHeader
            title="Personal Details"
            subtitle="Demographics and regional settings"
            icon={<Calendar className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BentoCard>
              <FormField label="Birth Date" icon={<Calendar className="w-4 h-4" />}>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700",
                        !selectedDate && "text-zinc-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-zinc-400" />
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
                      <ChevronDown className="ml-auto h-4 w-4 text-zinc-400" />
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
              </FormField>
            </BentoCard>

            <BentoCard>
              <FormField label="Gender" icon={<User className="w-4 h-4" />}>
                <Select
                  value={profileData.sex || ""}
                  onValueChange={(value) => handleProfileChange('sex', value as Gender)}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </BentoCard>

            <BentoCard>
              <FormField label="Timezone" icon={<Globe className="w-4 h-4" />}>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) => handleProfileChange('timezone', value)}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
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
              </FormField>
            </BentoCard>
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 3: Training Profile (Athletes) */}
        {/* ================================================================ */}
        {profileData.role === "athlete" && (
          <AnimatedSection delay={0.3} className="mb-12">
            <SectionHeader
              title="Training Profile"
              subtitle="Physical metrics and training objectives"
              icon={<Target className="w-5 h-5" />}
              badge="Athlete"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <BentoCard>
                <FormField label="Height" icon={<Ruler className="w-4 h-4" />}>
                  <div className="relative">
                    <Input
                      type="number"
                      value={athleteData.height || ""}
                      onChange={(e) => handleAthleteChange('height', parseInt(e.target.value) || null)}
                      placeholder="180"
                      className="h-12 pr-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">cm</span>
                  </div>
                </FormField>
              </BentoCard>

              <BentoCard>
                <FormField label="Weight" icon={<Weight className="w-4 h-4" />}>
                  <div className="relative">
                    <Input
                      type="number"
                      value={athleteData.weight || ""}
                      onChange={(e) => handleAthleteChange('weight', parseInt(e.target.value) || null)}
                      placeholder="75"
                      className="h-12 pr-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">kg</span>
                  </div>
                </FormField>
              </BentoCard>

              <BentoCard className="md:col-span-2">
                <FormField label="Experience Level" icon={<Sparkles className="w-4 h-4" />}>
                  <Select
                    value={athleteData.experience || ""}
                    onValueChange={(value) => handleAthleteChange('experience', value as ExperienceLevel)}
                  >
                    <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{level.label}</span>
                            <span className="text-xs text-zinc-400">— {level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </BentoCard>

              <BentoCard variant="highlight" className="md:col-span-2 lg:col-span-4">
                <FormField
                  label="Training Goals"
                  icon={<Target className="w-4 h-4" />}
                  description="What are you working towards? Be specific about times, distances, or achievements."
                >
                  <Textarea
                    value={athleteData.training_goals || ""}
                    onChange={(e) => handleAthleteChange('training_goals', e.target.value)}
                    placeholder="E.g., Break 11 seconds in the 100m by end of season, improve my 5K time to under 20 minutes..."
                    className="min-h-[120px] bg-white/50 dark:bg-zinc-900/50 border-amber-200 dark:border-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  />
                </FormField>
              </BentoCard>
            </div>
          </AnimatedSection>
        )}

        {/* ================================================================ */}
        {/* SECTION 3: Coaching Profile (Coaches) */}
        {/* ================================================================ */}
        {profileData.role === "coach" && (
          <AnimatedSection delay={0.3} className="mb-12">
            <SectionHeader
              title="Coaching Profile"
              subtitle="Your expertise and approach"
              icon={<Trophy className="w-5 h-5" />}
              badge="Coach"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BentoCard>
                <FormField label="Specialization" icon={<Zap className="w-4 h-4" />}>
                  <Input
                    value={coachData.speciality || ""}
                    onChange={(e) => handleCoachChange('speciality', e.target.value)}
                    placeholder="e.g., Sprints, Endurance, Strength"
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </FormField>
              </BentoCard>

              <BentoCard>
                <FormField label="Sport Focus" icon={<Target className="w-4 h-4" />}>
                  <Input
                    value={coachData.sport_focus || ""}
                    onChange={(e) => handleCoachChange('sport_focus', e.target.value)}
                    placeholder="e.g., Track & Field, CrossFit, Marathon"
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </FormField>
              </BentoCard>

              <BentoCard className="md:col-span-2">
                <FormField
                  label="Coaching Experience"
                  icon={<Clock className="w-4 h-4" />}
                  description="Your background, certifications, and notable achievements"
                >
                  <Textarea
                    value={coachData.experience || ""}
                    onChange={(e) => handleCoachChange('experience', e.target.value)}
                    placeholder="Describe your coaching journey..."
                    className="min-h-[100px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                  />
                </FormField>
              </BentoCard>

              <BentoCard variant="highlight" className="md:col-span-2">
                <FormField
                  label="Coaching Philosophy"
                  icon={<Sparkles className="w-4 h-4" />}
                  description="What drives your approach to developing athletes?"
                >
                  <Textarea
                    value={coachData.philosophy || ""}
                    onChange={(e) => handleCoachChange('philosophy', e.target.value)}
                    placeholder="Share your coaching philosophy and values..."
                    className="min-h-[120px] bg-white/50 dark:bg-zinc-900/50 border-cyan-200 dark:border-cyan-900 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                  />
                </FormField>
              </BentoCard>
            </div>
          </AnimatedSection>
        )}

        {/* ================================================================ */}
        {/* SECTION 4: Account Status */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.4} className="mb-12">
          <SectionHeader
            title="Account"
            subtitle="Subscription and membership details"
            icon={<Shield className="w-5 h-5" />}
          />

          <BentoCard variant="subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Status"
                value={user?.onboarding_completed ? "Active" : "Setup Required"}
                icon={user?.onboarding_completed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              />
              <StatCard
                label="Plan"
                value={(user?.subscription_status || "Free").charAt(0).toUpperCase() + (user?.subscription_status || "free").slice(1)}
                icon={<Zap className="w-4 h-4 text-amber-500" />}
              />
              <StatCard
                label="Member Since"
                value={user?.created_at ? format(new Date(user.created_at), "MMM yyyy") : "Unknown"}
                icon={<Calendar className="w-4 h-4 text-zinc-400" />}
              />
            </div>
          </BentoCard>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* Floating Save Bar */}
        {/* ================================================================ */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800">
                <div className="max-w-5xl mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Unsaved changes
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (user) {
                            populateFormData(user)
                            setHasChanges(false)
                          }
                        }}
                        className="text-zinc-500 hover:text-zinc-700"
                      >
                        Discard
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 px-6"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
