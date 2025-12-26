/**
 * Holographic Profile Card Component
 *
 * A distinctive 3D trading-card style component for displaying athlete/coach profiles
 * with holographic effects, tilt animation, and flip interaction.
 *
 * Features:
 * - 3D CSS transforms with preserve-3d
 * - Holographic rainbow gradient effects
 * - Pointer-tracking tilt animation
 * - Flip animation to reveal back
 * - Accessibility and reduced-motion support
 * - Touch support for mobile devices
 */

"use client"

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Target,
  Zap,
  Medal,
  Flame,
  TrendingUp,
  Calendar,
  MapPin,
  Dumbbell,
  Timer
} from "lucide-react"

// ============================================================================
// Types
// ============================================================================

export type ProfileRole = "athlete" | "coach"
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite"

interface AthleteStats {
  totalWorkouts?: number
  weeklyStreak?: number
  personalRecords?: number
  completionRate?: number
}

interface CoachStats {
  athletesCoached?: number
  yearsExperience?: number
  programsCreated?: number
  successRate?: number
}

export interface ProfileCardData {
  id: number
  firstName: string
  lastName: string
  username?: string
  avatarUrl?: string | null
  role: ProfileRole

  // Common fields
  birthdate?: string | null
  sex?: string | null
  timezone?: string
  joinDate?: string

  // Athlete-specific
  height?: number | null
  weight?: number | null
  experience?: ExperienceLevel | null
  events?: string[]
  trainingGoals?: string | null
  athleteStats?: AthleteStats
  groupName?: string

  // Coach-specific
  speciality?: string | null
  sportFocus?: string | null
  philosophy?: string | null
  coachExperience?: string | null
  coachStats?: CoachStats
}

interface HolographicProfileCardProps {
  profile: ProfileCardData
  onViewProfile?: (profileId: number) => void
  onFlip?: (isFlipped: boolean) => void
  className?: string
  size?: "sm" | "md" | "lg"
  interactive?: boolean
}

// ============================================================================
// Utility Functions
// ============================================================================

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function calculateAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function getExperienceBadgeColor(level: ExperienceLevel | null | undefined): string {
  switch (level) {
    case "beginner": return "bg-emerald-500/90"
    case "intermediate": return "bg-blue-500/90"
    case "advanced": return "bg-purple-500/90"
    case "elite": return "bg-amber-500/90"
    default: return "bg-slate-500/90"
  }
}

function getExperienceLabel(level: ExperienceLevel | null | undefined): string {
  switch (level) {
    case "beginner": return "Beginner"
    case "intermediate": return "Intermediate"
    case "advanced": return "Advanced"
    case "elite": return "Elite"
    default: return "—"
  }
}

// ============================================================================
// Component
// ============================================================================

export function HolographicProfileCard({
  profile,
  onViewProfile,
  onFlip,
  className,
  size = "md",
  interactive = true
}: HolographicProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const rectRef = useRef<DOMRect | null>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  }, [])

  // Card dimensions based on size
  const dimensions = useMemo(() => {
    switch (size) {
      case "sm": return { width: "w-64", height: "h-80" }
      case "lg": return { width: "w-96", height: "h-[480px]" }
      default: return { width: "w-80", height: "h-[400px]" }
    }
  }, [size])

  const age = calculateAge(profile.birthdate)

  // Update cached rect on resize/scroll
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const updateRect = () => {
      rectRef.current = el.getBoundingClientRect()
    }

    updateRect()
    const resizeObserver = new ResizeObserver(updateRect)
    resizeObserver.observe(el)
    window.addEventListener("scroll", updateRect, { passive: true })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("scroll", updateRect)
    }
  }, [])

  // Handle pointer movement for tilt effect
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (prefersReducedMotion || !interactive) return

    const el = cardRef.current
    if (!el) return

    const rect = rectRef.current ?? el.getBoundingClientRect()
    rectRef.current = rect

    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const py = clamp((e.clientY - rect.top) / rect.height, 0, 1)

    // Map to [-1, 1] for tilt math
    const nx = px * 2 - 1
    const ny = py * 2 - 1

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setPointerPos({ x: nx, y: ny })
    })
  }, [prefersReducedMotion, interactive])

  const handlePointerEnter = useCallback(() => {
    if (interactive) setIsHovered(true)
  }, [interactive])

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
    setPointerPos({ x: 0, y: 0 })
  }, [])

  const handleClick = useCallback(() => {
    if (!interactive) return
    const newFlipped = !isFlipped
    setIsFlipped(newFlipped)
    onFlip?.(newFlipped)
  }, [interactive, isFlipped, onFlip])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!interactive) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }, [interactive, handleClick])

  // CSS custom properties for effects
  const cardStyle = {
    "--pointer-x": pointerPos.x.toFixed(4),
    "--pointer-y": pointerPos.y.toFixed(4),
    "--tilt-intensity": isHovered ? "12deg" : "0deg",
  } as React.CSSProperties

  return (
    <div className={cn("relative select-none", dimensions.width, className)}>
      <div
        ref={cardRef}
        className={cn(
          "relative cursor-pointer",
          "rounded-2xl",
          "transition-shadow duration-300",
          isHovered ? "shadow-2xl shadow-black/25" : "shadow-xl shadow-black/15"
        )}
        style={cardStyle}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-label={`${profile.firstName} ${profile.lastName}'s profile card. Press Enter or click to flip.`}
        aria-pressed={isFlipped}
      >
        {/* 3D Scene Container */}
        <div
          className={cn(
            "relative",
            dimensions.height,
            "w-full",
            "rounded-2xl",
            "overflow-visible",
            "[transform-style:preserve-3d]",
            "transition-transform duration-500 ease-out",
            prefersReducedMotion ? "" : isFlipped ? "[transform:rotateY(180deg)]" : ""
          )}
          style={prefersReducedMotion ? undefined : {
            transform: isFlipped
              ? "rotateY(180deg)"
              : `rotateX(calc(var(--pointer-y) * var(--tilt-intensity) * -1)) rotateY(calc(var(--pointer-x) * var(--tilt-intensity)))`
          }}
        >
          {/* FRONT FACE */}
          <div
            className={cn(
              "absolute inset-0",
              "rounded-2xl",
              "overflow-hidden",
              "[backface-visibility:hidden]",
              "[transform-style:preserve-3d]"
            )}
          >
            {/* Background gradient */}
            <div className={cn(
              "absolute inset-0",
              profile.role === "athlete"
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                : "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950"
            )} />

            {/* Geometric pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col p-5">
              {/* Header with role badge and year */}
              <div className="flex items-center justify-between mb-4">
                <Badge
                  className={cn(
                    "px-3 py-1 text-xs font-bold tracking-wider uppercase",
                    profile.role === "athlete"
                      ? "bg-amber-500/90 text-black"
                      : "bg-cyan-500/90 text-black"
                  )}
                >
                  {profile.role}
                </Badge>
                <span className="text-white/60 text-sm font-mono">
                  {new Date().getFullYear()}
                </span>
              </div>

              {/* Avatar section */}
              <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                <div className="relative">
                  <div className={cn(
                    "absolute -inset-2 rounded-full blur-xl opacity-60",
                    profile.role === "athlete"
                      ? "bg-gradient-to-br from-amber-400 to-orange-600"
                      : "bg-gradient-to-br from-cyan-400 to-blue-600"
                  )} />
                  <Avatar className={cn(
                    "relative border-4 border-white/20",
                    size === "sm" ? "h-20 w-20" : size === "lg" ? "h-32 w-32" : "h-24 w-24"
                  )}>
                    <AvatarImage
                      src={profile.avatarUrl || undefined}
                      alt={`${profile.firstName} ${profile.lastName}`}
                    />
                    <AvatarFallback className={cn(
                      "text-2xl font-bold",
                      profile.role === "athlete"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                    )}>
                      {getInitials(profile.firstName, profile.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Experience badge for athletes */}
                {profile.role === "athlete" && profile.experience && (
                  <Badge className={cn(
                    "mt-3 px-3 py-0.5 text-xs font-semibold",
                    getExperienceBadgeColor(profile.experience),
                    "text-white shadow-lg"
                  )}>
                    {getExperienceLabel(profile.experience)}
                  </Badge>
                )}
              </div>

              {/* Name and info section */}
              <div className="mt-auto text-center">
                <h3 className={cn(
                  "font-black tracking-tight text-white",
                  size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl"
                )}>
                  {profile.firstName} {profile.lastName}
                </h3>

                {profile.groupName && (
                  <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.groupName}
                  </p>
                )}

                {/* Quick stats row */}
                <div className="flex items-center justify-center gap-4 mt-3 text-white/70">
                  {age && (
                    <span className="text-sm">{age}y</span>
                  )}
                  {profile.sex && (
                    <span className="text-sm uppercase">{profile.sex}</span>
                  )}
                  {profile.role === "athlete" && profile.height && (
                    <span className="text-sm">{profile.height}cm</span>
                  )}
                </div>

                {/* Events tags for athletes */}
                {profile.role === "athlete" && profile.events && profile.events.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    {profile.events.slice(0, 3).map((event, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs border-white/30 text-white/80 bg-white/5"
                      >
                        {event}
                      </Badge>
                    ))}
                    {profile.events.length > 3 && (
                      <Badge variant="outline" className="text-xs border-white/30 text-white/60">
                        +{profile.events.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Sport focus for coaches */}
                {profile.role === "coach" && profile.sportFocus && (
                  <Badge
                    variant="outline"
                    className="mt-3 text-xs border-cyan-400/50 text-cyan-300"
                  >
                    {profile.sportFocus}
                  </Badge>
                )}
              </div>

              {/* Flip hint */}
              <p className="text-center text-white/30 text-xs mt-3">
                Click to flip
              </p>
            </div>

            {/* Holographic overlay effects */}
            <HolographicOverlay isHovered={isHovered} role={profile.role} />
          </div>

          {/* BACK FACE */}
          <div
            className={cn(
              "absolute inset-0",
              "rounded-2xl",
              "overflow-hidden",
              "[backface-visibility:hidden]",
              "[transform:rotateY(180deg)]"
            )}
          >
            {/* Background */}
            <div className={cn(
              "absolute inset-0",
              profile.role === "athlete"
                ? "bg-gradient-to-br from-slate-100 via-white to-slate-100"
                : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"
            )} />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className={cn(
                  "font-bold text-slate-900",
                  size === "sm" ? "text-base" : "text-lg"
                )}>
                  {profile.firstName} {profile.lastName}
                </h4>
                <Badge
                  className={cn(
                    "text-xs",
                    profile.role === "athlete"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-cyan-100 text-cyan-800"
                  )}
                >
                  {profile.role}
                </Badge>
              </div>

              {/* Stats grid */}
              {profile.role === "athlete" ? (
                <AthleteBackContent profile={profile} size={size} />
              ) : (
                <CoachBackContent profile={profile} size={size} />
              )}

              {/* Flip hint */}
              <p className="text-center text-slate-400 text-xs mt-auto pt-3">
                Click to flip back
              </p>
            </div>

            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function HolographicOverlay({ isHovered, role }: { isHovered: boolean; role: ProfileRole }) {
  return (
    <>
      {/* Rainbow holographic gradient */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          "mix-blend-color-dodge",
          "transition-opacity duration-300",
          isHovered ? "opacity-40" : "opacity-20"
        )}
        style={{
          background: `linear-gradient(
            115deg,
            rgba(255, 0, 180, 0.35),
            rgba(0, 210, 255, 0.35),
            rgba(140, 255, 120, 0.25),
            rgba(255, 220, 80, 0.25),
            rgba(255, 0, 180, 0.30)
          )`,
          backgroundSize: "200% 200%",
          backgroundPosition: `calc(50% + calc(var(--pointer-x) * 20%)) calc(50% + calc(var(--pointer-y) * 20%))`,
          filter: "saturate(1.35) contrast(1.1)"
        }}
      />

      {/* Spotlight highlight */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          "mix-blend-overlay",
          "transition-opacity duration-300",
          isHovered ? "opacity-70" : "opacity-30"
        )}
        style={{
          background: `radial-gradient(
            280px circle at
              calc(50% + calc(var(--pointer-x) * 45%))
              calc(45% + calc(var(--pointer-y) * 35%)),
            rgba(255, 255, 255, 0.85),
            rgba(255, 255, 255, 0.12) 45%,
            rgba(255, 255, 255, 0.0) 70%
          )`
        }}
      />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15 mix-blend-soft-light"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.05),
            rgba(255,255,255,0.05) 1px,
            rgba(0,0,0,0.05) 2px,
            rgba(0,0,0,0.05) 3px
          )`,
          filter: "blur(0.2px)"
        }}
      />
    </>
  )
}

function AthleteBackContent({ profile, size }: { profile: ProfileCardData; size: string }) {
  const stats = profile.athleteStats

  return (
    <div className="flex-1 flex flex-col">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatBox
          icon={<Dumbbell className="h-4 w-4" />}
          label="Workouts"
          value={stats?.totalWorkouts ?? "—"}
          color="bg-amber-100 text-amber-700"
        />
        <StatBox
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={stats?.weeklyStreak ? `${stats.weeklyStreak}w` : "—"}
          color="bg-orange-100 text-orange-700"
        />
        <StatBox
          icon={<Medal className="h-4 w-4" />}
          label="PRs"
          value={stats?.personalRecords ?? "—"}
          color="bg-purple-100 text-purple-700"
        />
        <StatBox
          icon={<Target className="h-4 w-4" />}
          label="Complete"
          value={stats?.completionRate ? `${stats.completionRate}%` : "—"}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Physical stats */}
      {(profile.height || profile.weight) && (
        <div className="flex items-center justify-center gap-6 py-2 border-y border-slate-200">
          {profile.height && (
            <div className="text-center">
              <p className="text-xs text-slate-500">Height</p>
              <p className="font-semibold text-slate-900">{profile.height} cm</p>
            </div>
          )}
          {profile.weight && (
            <div className="text-center">
              <p className="text-xs text-slate-500">Weight</p>
              <p className="font-semibold text-slate-900">{profile.weight} kg</p>
            </div>
          )}
        </div>
      )}

      {/* Training goals */}
      {profile.trainingGoals && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1">Training Goals</p>
          <p className={cn(
            "text-slate-700 leading-tight",
            size === "sm" ? "text-xs line-clamp-2" : "text-sm line-clamp-3"
          )}>
            {profile.trainingGoals}
          </p>
        </div>
      )}
    </div>
  )
}

function CoachBackContent({ profile, size }: { profile: ProfileCardData; size: string }) {
  const stats = profile.coachStats

  return (
    <div className="flex-1 flex flex-col">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatBox
          icon={<Trophy className="h-4 w-4" />}
          label="Athletes"
          value={stats?.athletesCoached ?? "—"}
          color="bg-cyan-100 text-cyan-700"
        />
        <StatBox
          icon={<Calendar className="h-4 w-4" />}
          label="Years"
          value={stats?.yearsExperience ?? "—"}
          color="bg-blue-100 text-blue-700"
        />
        <StatBox
          icon={<Target className="h-4 w-4" />}
          label="Programs"
          value={stats?.programsCreated ?? "—"}
          color="bg-indigo-100 text-indigo-700"
        />
        <StatBox
          icon={<TrendingUp className="h-4 w-4" />}
          label="Success"
          value={stats?.successRate ? `${stats.successRate}%` : "—"}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Speciality */}
      {profile.speciality && (
        <div className="py-2 border-y border-slate-200 text-center">
          <p className="text-xs text-slate-500">Specialization</p>
          <p className="font-semibold text-slate-900">{profile.speciality}</p>
        </div>
      )}

      {/* Philosophy */}
      {profile.philosophy && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1">Coaching Philosophy</p>
          <p className={cn(
            "text-slate-700 leading-tight italic",
            size === "sm" ? "text-xs line-clamp-2" : "text-sm line-clamp-3"
          )}>
            "{profile.philosophy}"
          </p>
        </div>
      )}
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={cn(
      "rounded-lg p-2.5 text-center",
      color
    )}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}

export default HolographicProfileCard
