/**
 * Profile Settings Page - 2025/2026 Design
 *
 * Modern vertical scroll layout with bento grid sections,
 * scroll-triggered animations, and micro-interactions.
 * Designed following editorial utility aesthetic.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
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
  ChevronDown,
  Shield,
  Zap,
  Medal,
  X,
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  Smartphone,
  Download,
  Share,
  Plus,
  ExternalLink,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { useTheme } from "next-themes"
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
import { createOrUpdateAthleteProfileAction, getEventsAction, type Event } from "@/actions/athletes/athlete-actions"
import { createOrUpdateCoachProfileAction } from "@/actions/athletes/coach-management-actions"
import {
  getReminderPreferencesAction,
  updateReminderPreferencesAction,
  type ReminderPreferences
} from "@/actions/notifications"

// Hooks
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { usePWAInstall } from "@/hooks/use-pwa-install"

// Import proper types from database
import type { Database, Json } from "@/types/database"

// Define types from database schema
type UserInsert = Database['public']['Tables']['users']['Insert']

import type { UserRole } from "@/contexts/user-role-context"
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
    default: 'bg-card border border-border',
    highlight: 'bg-accent/50 border border-border',
    subtle: 'bg-muted/50 border border-border/50'
  }

  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all duration-300',
      'hover:shadow-lg hover:shadow-foreground/5',
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
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors group-focus-within:text-primary">
        {icon && <span className="text-muted-foreground group-focus-within:text-primary transition-colors">{icon}</span>}
        {label}
      </Label>
      <div className="relative">
        {children}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
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
        <div className="p-3 rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
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
    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
      <div className="p-2 rounded-lg bg-background text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileSettingsPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { openUserProfile } = useClerk()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Theme mounting effect to prevent hydration mismatch
  useEffect(() => {
    setThemeMounted(true)
  }, [])

  // Push notification state
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    permission: pushPermission,
    error: pushError,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush
  } = usePushNotifications()

  // PWA install state
  const {
    canInstall,
    isInstalled,
    isIOS,
    hasPrompt,
    isInstalling,
    promptInstall
  } = usePWAInstall()
  const [showIOSInstallOverlay, setShowIOSInstallOverlay] = useState(false)

  // Reminder preferences state
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPreferences>({
    workout_reminders_enabled: true,
    preferred_time: '09:00'
  })
  const [reminderPrefsLoading, setReminderPrefsLoading] = useState(true)

  // State
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState(false)
  const [availableEvents, setAvailableEvents] = useState<Event[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([])

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
      // Set selected event IDs from stored events
      const storedEvents = userData.athlete.events as Array<{ id: number }> | null
      if (storedEvents && Array.isArray(storedEvents)) {
        setSelectedEventIds(storedEvents.map(e => e.id))
      }
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

  // Push notification handlers
  const handlePushToggle = async () => {
    if (isPushSubscribed) {
      const success = await unsubscribePush()
      if (success) {
        toast({ title: "Notifications disabled", description: "You won't receive push notifications anymore" })
      } else {
        toast({ title: "Error", description: "Failed to disable notifications", variant: "destructive" })
      }
    } else {
      const success = await subscribePush()
      if (success) {
        toast({ title: "Notifications enabled", description: "You'll now receive workout reminders" })
        // Load reminder preferences after subscribing
        loadReminderPreferences()
      } else if (pushPermission === 'denied') {
        toast({ title: "Blocked", description: "Please enable notifications in your browser settings", variant: "destructive" })
      } else {
        toast({ title: "Error", description: "Failed to enable notifications", variant: "destructive" })
      }
    }
  }

  const handleReminderToggle = async () => {
    const newValue = !reminderPrefs.workout_reminders_enabled
    setReminderPrefs(prev => ({ ...prev, workout_reminders_enabled: newValue }))

    const result = await updateReminderPreferencesAction({ workout_reminders_enabled: newValue })
    if (!result.isSuccess) {
      setReminderPrefs(prev => ({ ...prev, workout_reminders_enabled: !newValue }))
      toast({ title: "Error", description: "Failed to update preference", variant: "destructive" })
    }
  }

  const handleReminderTimeChange = async (newTime: string) => {
    setReminderPrefs(prev => ({ ...prev, preferred_time: newTime }))

    const result = await updateReminderPreferencesAction({ preferred_time: newTime })
    if (result.isSuccess) {
      toast({ title: "Reminder time updated", description: `You'll be reminded at ${newTime}` })
    } else {
      toast({ title: "Error", description: "Failed to update reminder time", variant: "destructive" })
    }
  }

  const loadReminderPreferences = async () => {
    const result = await getReminderPreferencesAction()
    if (result.isSuccess && result.data) {
      setReminderPrefs({
        workout_reminders_enabled: result.data.workout_reminders_enabled,
        preferred_time: result.data.preferred_time.slice(0, 5) // Convert HH:MM:SS to HH:MM
      })
    }
    setReminderPrefsLoading(false)
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
        metadata: profileData.metadata as { [key: string]: Json | undefined }
      }

      const userResult = await updateSupabaseUserAction(clerkUser.id, updateData)

      if (!userResult.isSuccess) {
        throw new Error(userResult.message)
      }

      // Always save athlete profile (both athletes and coaches can have athlete data)
      if (athleteData) {
        // Convert selected events to minimal format for storage (id + name only)
        // type/category can be looked up from events table when needed
        const eventsToSave = selectedEventIds.length > 0
          ? availableEvents.filter(e => selectedEventIds.includes(e.id)).map(e => ({
              id: e.id,
              name: e.name
            }))
          : null

        const athleteResult = await createOrUpdateAthleteProfileAction({
          height: athleteData.height,
          weight: athleteData.weight,
          training_goals: athleteData.training_goals,
          experience: athleteData.experience,
          events: eventsToSave as Json | null
        })

        if (!athleteResult.isSuccess) {
          console.warn('Failed to update athlete profile:', athleteResult.message)
        }
      }

      // Save coach profile only for coaches
      if (profileData.role === 'coach' && coachData) {
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

  // Helper function to extract distance from event name for sorting
  const getEventDistance = (name: string | null): number => {
    if (!name) return 99999
    // Extract numeric distance from event name (e.g., "100m" -> 100, "1500m" -> 1500)
    const match = name.match(/^(\d+(?:\.\d+)?)\s*(?:m|km|k)?/i)
    if (match) {
      let distance = parseFloat(match[1])
      // Convert km to meters for proper sorting
      if (name.toLowerCase().includes('km') || name.toLowerCase().includes('k ')) {
        distance *= 1000
      }
      // Marathon is ~42195m, Half Marathon is ~21097m
      if (name.toLowerCase().includes('marathon') && !name.toLowerCase().includes('half')) {
        return 42195
      }
      if (name.toLowerCase().includes('half marathon')) {
        return 21097
      }
      return distance
    }
    // For events without distance (e.g., "Hurdles"), return a high number to sort last within type
    return 99999
  }

  // Sort events: by distance (short to long) then A-Z
  const sortEvents = (events: Event[]): Event[] => {
    return [...events].sort((a, b) => {
      // First sort by type to group them
      if (a.type !== b.type) {
        const typeOrder = ['track', 'field', 'decathlon', 'heptathlon']
        return typeOrder.indexOf(a.type || '') - typeOrder.indexOf(b.type || '')
      }
      // Within same type, sort by distance then alphabetically
      const distA = getEventDistance(a.name)
      const distB = getEventDistance(b.name)
      if (distA !== distB) {
        return distA - distB
      }
      // Same distance, sort alphabetically
      return (a.name || '').localeCompare(b.name || '')
    })
  }

  // Load available events
  const loadEvents = async () => {
    const result = await getEventsAction()
    if (result.isSuccess && result.data) {
      setAvailableEvents(sortEvents(result.data))
    }
  }

  // Toggle event selection
  const toggleEventSelection = (eventId: number) => {
    setSelectedEventIds(prev => {
      const newIds = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
      // Update athleteData.events with the selected events
      const selectedEvents = availableEvents.filter(e => newIds.includes(e.id))
      setAthleteData(prevData => ({
        ...prevData,
        events: selectedEvents as unknown[] | null
      }))
      setHasChanges(true)
      return newIds
    })
  }

  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      loadUserData()
      loadEvents()
      loadReminderPreferences()
    }
  }, [clerkLoaded, clerkUser])

  const handleDeleteAccount = async () => {
    if (!clerkUser) return
    setIsDeleting(true)
    try {
      await clerkUser.delete()
      // Clerk auto-signs out after deletion; middleware redirects to /sign-in
    } catch (error) {
      console.error('[handleDeleteAccount] Failed to delete account:', error)
      toast({
        title: 'Failed to delete account',
        description: 'Please try again or contact support if the problem persists.',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

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
            <div className="w-16 h-16 rounded-full border-4 border-border" />
            <motion.div
              className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
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
        {/* SECTION 1: Account & Identity */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.1} className="mb-12">
          <SectionHeader
            title="Account"
            subtitle="Manage your account settings and subscription"
            icon={<Shield className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clerk Account Settings Card */}
            <BentoCard variant="highlight" className="md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {clerkUser?.imageUrl ? (
                    <img
                      src={clerkUser.imageUrl}
                      alt={`${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`}
                      className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/25">
                      {clerkUser?.firstName?.[0]?.toUpperCase() || clerkUser?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}
                      {clerkUser?.lastName?.[0]?.toUpperCase() || ''}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {clerkUser?.firstName} {clerkUser?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {clerkUser?.emailAddresses?.[0]?.emailAddress}
                    </p>
                    {clerkUser?.username && (
                      <p className="text-xs text-muted-foreground">@{clerkUser.username}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => openUserProfile()}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Manage Account
                </Button>
              </div>
            </BentoCard>

            {/* Status Cards */}
            <BentoCard>
              <StatCard
                label="Status"
                value={user?.onboarding_completed ? "Active" : "Setup Required"}
                icon={user?.onboarding_completed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
              />
            </BentoCard>
            <BentoCard>
              <div className="flex items-center justify-between">
                <StatCard
                  label="Plan"
                  value={(user?.subscription_status || "Free").charAt(0).toUpperCase() + (user?.subscription_status || "free").slice(1)}
                  icon={<Zap className="w-4 h-4 text-primary" />}
                />
              </div>
            </BentoCard>
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 2: Notifications */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.15} className="mb-12">
          <SectionHeader
            title="Notifications"
            subtitle="Manage workout reminders and alerts"
            icon={<Bell className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Push Notifications Toggle */}
            <BentoCard variant={isPushSubscribed ? "highlight" : "default"} className="md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    isPushSubscribed
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {!isPushSupported
                        ? "Not supported in this browser"
                        : pushPermission === 'denied'
                          ? "Blocked — click the lock icon in your address bar to allow"
                          : isPushSubscribed
                            ? "Receiving notifications on this device"
                            : "Get reminders about your workouts"}
                    </p>
                    {pushError && (
                      <p className="text-sm text-destructive mt-1">{pushError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isPushSubscribed && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Active
                    </Badge>
                  )}
                  <button
                    type="button"
                    disabled={!isPushSupported || pushPermission === 'denied' || isPushLoading}
                    onClick={handlePushToggle}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      (!isPushSupported || pushPermission === 'denied') && "opacity-50 cursor-not-allowed",
                      isPushSubscribed ? "bg-primary" : "bg-muted"
                    )}
                  >
                    {isPushLoading ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </span>
                    ) : (
                      <span className={cn(
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                        isPushSubscribed ? "translate-x-5" : "translate-x-0"
                      )} />
                    )}
                  </button>
                </div>
              </div>
            </BentoCard>

            {/* Daily Workout Reminders */}
            <BentoCard className={cn(!isPushSubscribed && "opacity-60")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    reminderPrefs.workout_reminders_enabled && isPushSubscribed
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Daily Reminders</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Notify when you have training
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isPushSubscribed || reminderPrefsLoading}
                  onClick={handleReminderToggle}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                    !isPushSubscribed && "cursor-not-allowed",
                    reminderPrefs.workout_reminders_enabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                    reminderPrefs.workout_reminders_enabled ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </BentoCard>

            {/* Reminder Time */}
            <BentoCard className={cn((!isPushSubscribed || !reminderPrefs.workout_reminders_enabled) && "opacity-60")}>
              <FormField
                label="Reminder Time"
                icon={<Clock className="w-4 h-4" />}
                description="When should we remind you?"
              >
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={reminderPrefs.preferred_time}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    disabled={!isPushSubscribed || !reminderPrefs.workout_reminders_enabled || reminderPrefsLoading}
                    className={cn(
                      "w-full h-12 pl-12 pr-4 text-sm rounded-xl border border-input",
                      "bg-muted/50 text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                      (!isPushSubscribed || !reminderPrefs.workout_reminders_enabled) && "cursor-not-allowed"
                    )}
                  />
                </div>
              </FormField>
            </BentoCard>

            {/* iOS PWA Info Banner */}
            {isPushSupported && !isPushSubscribed && pushPermission !== 'denied' && (
              <BentoCard variant="subtle" className="md:col-span-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How it works</p>
                    <p>Enable push notifications to get daily reminders about your scheduled workouts. You&apos;ll only be notified on days when you have training planned.</p>
                    <p className="mt-2 text-xs">
                      <strong>iOS users:</strong> Add this app to your home screen for the best notification experience.
                    </p>
                  </div>
                </div>
              </BentoCard>
            )}
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 2.5: Install App */}
        {/* ================================================================ */}
        {!isInstalled && (canInstall || hasPrompt) && (
          <AnimatedSection delay={0.2} className="mb-12">
            <SectionHeader
              title="Install App"
              subtitle="Get the full app experience on your device"
              icon={<Download className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 gap-4">
              <BentoCard variant="highlight">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {isIOS ? "Add to Home Screen" : "Install Kasoku"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isIOS
                          ? "Install as an app for quick access and offline support"
                          : "Install as an app for the best experience"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (isIOS) {
                        setShowIOSInstallOverlay(true)
                      } else {
                        promptInstall()
                      }
                    }}
                    disabled={isInstalling}
                    className="flex items-center gap-2"
                  >
                    {isInstalling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isIOS ? "How to Install" : "Install"}
                  </Button>
                </div>

                {/* Benefits list */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Quick launch from home screen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Full screen experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Push notifications</span>
                    </div>
                  </div>
                </div>
              </BentoCard>
            </div>
          </AnimatedSection>
        )}

        {/* iOS Install Instructions Overlay */}
        <AnimatePresence>
          {showIOSInstallOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowIOSInstallOverlay(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative p-6 pb-4 bg-linear-to-b from-primary/10 to-transparent">
                  <button
                    onClick={() => setShowIOSInstallOverlay(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                      K
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Install Kasoku</h3>
                      <p className="text-sm text-muted-foreground">Add to your home screen</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-6 pt-2 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Follow these steps to install Kasoku on your {navigator.platform?.includes('iPad') ? 'iPad' : 'iPhone'}:
                  </p>

                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Find the <Share className="w-4 h-4 inline-block mx-1 text-primary" /> icon at the bottom of Safari
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Scroll down and tap</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Look for <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs font-medium"><Plus className="w-3 h-3" /> Add to Home Screen</span>
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Tap Add</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Confirm by tapping <span className="font-medium text-primary">Add</span> in the top right corner
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mt-4 p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> Make sure you&apos;re using Safari. This feature isn&apos;t available in other browsers on iOS.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                  <Button
                    onClick={() => setShowIOSInstallOverlay(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Got it
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-destructive/20 bg-destructive/5">
                  {!isDeleting && (
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Delete your account?</h3>
                      <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  {/* Role-specific consequence summary */}
                  <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm text-muted-foreground">
                    {profileData.role === 'coach' && (
                      <>
                        <p className="font-medium text-foreground text-xs uppercase tracking-wider">You will permanently lose:</p>
                        <p>• All athlete groups, training plans, and knowledge base content</p>
                        <p>• All AI coaching memories for your athletes</p>
                        <p>• Your own workout history and personal records</p>
                        <p className="text-green-700 dark:text-green-400 pt-1 border-t border-border/50">
                          ✓ Your athletes keep their own workout logs
                        </p>
                      </>
                    )}
                    {profileData.role === 'athlete' && (
                      <>
                        <p className="font-medium text-foreground text-xs uppercase tracking-wider">You will permanently lose:</p>
                        <p>• All your workout logs and performance data</p>
                        <p>• All personal bests, race records, and AI memories</p>
                        <p className="text-green-700 dark:text-green-400 pt-1 border-t border-border/50">
                          ✓ Your coach's plans and groups are not affected
                        </p>
                      </>
                    )}
                    {profileData.role === 'individual' && (
                      <>
                        <p className="font-medium text-foreground text-xs uppercase tracking-wider">You will permanently lose:</p>
                        <p>• All workout logs, personal bests, and training plans</p>
                        <p>• All AI performance memories and coaching notes</p>
                        <p className="text-amber-700 dark:text-amber-400 pt-1 border-t border-border/50">
                          ⚠ Custom exercises will be detached but not deleted
                        </p>
                      </>
                    )}
                  </div>

                  {/* Email confirmation */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Type your email to confirm:{' '}
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {clerkUser?.emailAddresses?.[0]?.emailAddress}
                      </span>
                    </label>
                    <input
                      type="email"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder="Enter your email address"
                      disabled={isDeleting}
                      className="w-full h-11 px-4 text-sm rounded-xl border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirmEmail('') }}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeleting ||
                      deleteConfirmEmail !== clerkUser?.emailAddresses?.[0]?.emailAddress
                    }
                    className="flex-1 flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete my account
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* SECTION 3: Personal Details */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.25} className="mb-12">
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
                        "w-full h-12 justify-start text-left font-normal bg-muted/50 border-input hover:bg-muted",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
                      <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
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
                  <SelectTrigger className="h-12 bg-muted/50 border-input">
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
                  <SelectTrigger className="h-12 bg-muted/50 border-input">
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
        {/* SECTION 4: Coaching Profile (Coaches) - Shown first when applicable */}
        {/* ================================================================ */}
        {profileData.role === "coach" && (
          <AnimatedSection delay={0.35} className="mb-12">
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
                    className="h-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </FormField>
              </BentoCard>

              <BentoCard>
                <FormField label="Sport Focus" icon={<Target className="w-4 h-4" />}>
                  <Input
                    value={coachData.sport_focus || ""}
                    onChange={(e) => handleCoachChange('sport_focus', e.target.value)}
                    placeholder="e.g., Track & Field, CrossFit, Marathon"
                    className="h-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                    className="min-h-[100px] bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
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
                    className="min-h-[120px] bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </FormField>
              </BentoCard>
            </div>
          </AnimatedSection>
        )}

        {/* ================================================================ */}
        {/* SECTION 5: Athlete Profile (Both Athletes & Coaches) */}
        {/* ================================================================ */}
        <AnimatedSection delay={profileData.role === "coach" ? 0.45 : 0.35} className="mb-12">
          <SectionHeader
            title="Athlete Profile"
            subtitle="Physical metrics, events, and training objectives"
            icon={<Target className="w-5 h-5" />}
            badge={profileData.role === "coach" ? "Coach Athlete" : "Athlete"}
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
                    className="h-12 pr-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
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
                    className="h-12 pr-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                </div>
              </FormField>
            </BentoCard>

            <BentoCard className="md:col-span-2">
              <FormField label="Experience Level" icon={<Sparkles className="w-4 h-4" />}>
                <Select
                  value={athleteData.experience || ""}
                  onValueChange={(value) => handleAthleteChange('experience', value as ExperienceLevel)}
                >
                  <SelectTrigger className="h-12 bg-muted/50 border-input">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{level.label}</span>
                          <span className="text-xs text-muted-foreground">— {level.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </BentoCard>

            {/* Events Multi-Select */}
            <BentoCard className="md:col-span-2 lg:col-span-4">
              <FormField
                label="Events"
                icon={<Medal className="w-4 h-4" />}
                description="Select the track & field events you compete in or train for"
              >
                <div className="space-y-3">
                  {/* Selected Events */}
                  {selectedEventIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEventIds.map(eventId => {
                        const event = availableEvents.find(e => e.id === eventId)
                        return event ? (
                          <Badge
                            key={event.id}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                            onClick={() => toggleEventSelection(event.id)}
                          >
                            {event.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Event Categories */}
                  <div className="space-y-4">
                    {/* Track Events */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Track</p>
                      <div className="flex flex-wrap gap-2">
                        {availableEvents
                          .filter(e => e.type === 'track')
                          .map(event => (
                            <Badge
                              key={event.id}
                              variant={selectedEventIds.includes(event.id) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all",
                                selectedEventIds.includes(event.id)
                                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => toggleEventSelection(event.id)}
                            >
                              {event.name}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Field Events */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Field</p>
                      <div className="flex flex-wrap gap-2">
                        {availableEvents
                          .filter(e => e.type === 'field')
                          .map(event => (
                            <Badge
                              key={event.id}
                              variant={selectedEventIds.includes(event.id) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all",
                                selectedEventIds.includes(event.id)
                                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => toggleEventSelection(event.id)}
                            >
                              {event.name}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Combined Events */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Combined</p>
                      <div className="flex flex-wrap gap-2">
                        {availableEvents
                          .filter(e => e.type === 'decathlon' || e.type === 'heptathlon')
                          .map(event => (
                            <Badge
                              key={event.id}
                              variant={selectedEventIds.includes(event.id) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all",
                                selectedEventIds.includes(event.id)
                                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => toggleEventSelection(event.id)}
                            >
                              {event.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                  className="min-h-[120px] bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </FormField>
            </BentoCard>
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 6: Appearance / Theme */}
        {/* ================================================================ */}
        <AnimatedSection delay={profileData.role === "coach" ? 0.55 : 0.45} className="mb-12">
          <SectionHeader
            title="Appearance"
            subtitle="Customize how Kasoku looks for you"
            icon={<Palette className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeMounted && (
              <>
                {/* Light Theme */}
                <BentoCard
                  className={cn(
                    "cursor-pointer transition-all",
                    theme === "light" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <button
                    onClick={() => setTheme("light")}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        theme === "light"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Light</p>
                        <p className="text-sm text-muted-foreground">Bright and clean</p>
                      </div>
                      {theme === "light" && (
                        <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                </BentoCard>

                {/* Dark Theme */}
                <BentoCard
                  className={cn(
                    "cursor-pointer transition-all",
                    theme === "dark" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <button
                    onClick={() => setTheme("dark")}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        theme === "dark"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Dark</p>
                        <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                      </div>
                      {theme === "dark" && (
                        <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                </BentoCard>

                {/* System Theme */}
                <BentoCard
                  className={cn(
                    "cursor-pointer transition-all",
                    theme === "system" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <button
                    onClick={() => setTheme("system")}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        theme === "system"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">System</p>
                        <p className="text-sm text-muted-foreground">Match device settings</p>
                      </div>
                      {theme === "system" && (
                        <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                </BentoCard>
              </>
            )}
          </div>
        </AnimatedSection>

        {/* ================================================================ */}
        {/* SECTION 7: Danger Zone */}
        {/* ================================================================ */}
        <AnimatedSection delay={0.6} className="mb-12">
          <SectionHeader
            title="Danger Zone"
            subtitle="Irreversible actions — read carefully before proceeding"
            icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          />

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="font-semibold text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently deletes your account and all associated data. This cannot be undone.
                </p>

                {/* Role-specific impact summary */}
                <div className="mt-4 space-y-1.5">
                  {profileData.role === 'coach' && (
                    <>
                      <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">What will be deleted</p>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All athlete groups you manage and their membership histories</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All training plans (macrocycles, mesocycles, microcycles, sessions) you created</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your full knowledge base library — all articles and categories</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All AI coaching memories and performance insights for your athletes</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your own workout logs, personal bests, and race records</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 mt-3 pt-3 border-t border-border/50">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Your athletes' personal workout logs are <strong>not</strong> deleted — they retain all their own data</span>
                      </div>
                    </>
                  )}

                  {profileData.role === 'athlete' && (
                    <>
                      <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">What will be deleted</p>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All your workout logs and performance tracking data</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All your personal bests and race records</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your training cycle history and AI performance memories</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your notification preferences and push subscriptions</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 mt-3 pt-3 border-t border-border/50">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Your coach's training plans and group structure are <strong>not</strong> affected</span>
                      </div>
                    </>
                  )}

                  {profileData.role === 'individual' && (
                    <>
                      <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">What will be deleted</p>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All your workout logs and performance data</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>All your personal bests and race records</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your personal training plans (all macrocycles, mesocycles, microcycles and sessions)</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your AI performance memories and coaching notes</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>Your notification preferences and push subscriptions</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 mt-3 pt-3 border-t border-border/50">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Custom exercises you created will be detached from your account but remain in the system (they may be shared with others)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
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
              <div className="bg-background/80 backdrop-blur-xl border-t border-border">
                <div className="max-w-5xl mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium text-muted-foreground">
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
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Discard
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
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
