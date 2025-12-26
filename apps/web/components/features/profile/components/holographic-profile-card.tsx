/**
 * Holographic Profile Card Component
 *
 * A premium Pokemon TCG-style holographic trading card for athlete/coach profiles.
 * Features authentic foil effects with cosmos pattern, rainbow sweep, and spotlight.
 *
 * Inspired by the distinctive look of holographic rare Pokemon cards:
 * - Cosmos/galaxy sparkle pattern
 * - Rainbow color sweep that shifts with tilt
 * - Radial spotlight following pointer
 * - Layered depth effect
 * - High-contrast glitter/sparkle
 */

"use client"

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Target,
  Medal,
  Flame,
  TrendingUp,
  Calendar,
  MapPin,
  Dumbbell,
  Sparkles
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
  birthdate?: string | null
  sex?: string | null
  timezone?: string
  joinDate?: string
  height?: number | null
  weight?: number | null
  experience?: ExperienceLevel | null
  events?: string[]
  trainingGoals?: string | null
  athleteStats?: AthleteStats
  groupName?: string
  speciality?: string | null
  sportFocus?: string | null
  philosophy?: string | null
  coachExperience?: string | null
  coachStats?: CoachStats
}

interface HolographicProfileCardProps {
  profile: ProfileCardData
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
// CSS for Pokemon TCG-Style Holographic Effects
// ============================================================================

const holoStyles = `
  /* ========================================
     Pokemon TCG Holographic Card Styles
     ======================================== */

  .ptcg-card {
    --mx: 0.5;
    --my: 0.5;
    --s: 1;
    --o: 0;
    --rx: 0deg;
    --ry: 0deg;
    --pos: 50% 50%;
    --posx: 50%;
    --posy: 50%;
    --hyp: 0;
  }

  .ptcg-card[data-hovered="true"] {
    --s: 1;
    --o: 1;
  }

  /* === COSMOS HOLO PATTERN === */
  /* The signature Pokemon cosmos/galaxy sparkle effect */
  .ptcg-cosmos {
    --space: 5%;
    --red: #ff5555;
    --orange: #ffaa00;
    --yellow: #ffff55;
    --green: #55ff55;
    --cyan: #55ffff;
    --blue: #5555ff;
    --magenta: #ff55ff;

    background-image:
      /* Radial stars/sparkles */
      radial-gradient(circle at 10% 10%, var(--red) 0.5px, transparent 0.5px),
      radial-gradient(circle at 90% 15%, var(--orange) 0.4px, transparent 0.4px),
      radial-gradient(circle at 25% 80%, var(--yellow) 0.6px, transparent 0.6px),
      radial-gradient(circle at 75% 85%, var(--green) 0.5px, transparent 0.5px),
      radial-gradient(circle at 50% 50%, var(--cyan) 0.7px, transparent 0.7px),
      radial-gradient(circle at 15% 45%, var(--blue) 0.4px, transparent 0.4px),
      radial-gradient(circle at 85% 45%, var(--magenta) 0.5px, transparent 0.5px),
      radial-gradient(circle at 40% 25%, var(--red) 0.3px, transparent 0.3px),
      radial-gradient(circle at 60% 70%, var(--yellow) 0.4px, transparent 0.4px),
      radial-gradient(circle at 30% 60%, var(--cyan) 0.5px, transparent 0.5px),
      radial-gradient(circle at 70% 30%, var(--green) 0.4px, transparent 0.4px),
      radial-gradient(circle at 5% 90%, var(--magenta) 0.6px, transparent 0.6px),
      radial-gradient(circle at 95% 5%, var(--blue) 0.5px, transparent 0.5px),
      radial-gradient(circle at 45% 95%, var(--orange) 0.4px, transparent 0.4px),
      radial-gradient(circle at 55% 5%, var(--yellow) 0.3px, transparent 0.3px);

    background-size:
      60px 60px, 55px 55px, 65px 65px, 50px 50px, 70px 70px,
      45px 45px, 58px 58px, 52px 52px, 62px 62px, 48px 48px,
      68px 68px, 42px 42px, 72px 72px, 56px 56px, 64px 64px;

    background-position: var(--pos);
    mix-blend-mode: color-dodge;
    filter: brightness(1) contrast(1);
    opacity: calc(var(--o) * 0.8);
    transition: opacity 0.3s ease-out;
  }

  /* === RAINBOW GRADIENT SWEEP === */
  /* The prismatic color shift that sweeps across as you tilt */
  .ptcg-rainbow {
    background: linear-gradient(
      115deg,
      transparent 0%,
      transparent calc(var(--posx) - 30%),
      rgba(255, 0, 0, 0.15) calc(var(--posx) - 25%),
      rgba(255, 154, 0, 0.15) calc(var(--posx) - 20%),
      rgba(208, 222, 33, 0.15) calc(var(--posx) - 15%),
      rgba(79, 220, 74, 0.15) calc(var(--posx) - 10%),
      rgba(63, 218, 216, 0.2) calc(var(--posx) - 5%),
      rgba(47, 201, 226, 0.25) var(--posx),
      rgba(28, 127, 238, 0.2) calc(var(--posx) + 5%),
      rgba(95, 21, 242, 0.15) calc(var(--posx) + 10%),
      rgba(186, 12, 248, 0.15) calc(var(--posx) + 15%),
      rgba(251, 7, 217, 0.15) calc(var(--posx) + 20%),
      rgba(255, 0, 0, 0.1) calc(var(--posx) + 25%),
      transparent calc(var(--posx) + 30%),
      transparent 100%
    );
    background-size: 200% 200%;
    background-position: var(--pos);
    mix-blend-mode: color-dodge;
    filter: saturate(2) brightness(1.2);
    opacity: calc(var(--o) * 0.9);
    transition: opacity 0.25s ease-out;
  }

  /* === SPOTLIGHT/GLARE === */
  /* The bright spot that follows your cursor like light on foil */
  .ptcg-spotlight {
    background: radial-gradient(
      circle at var(--posx) var(--posy),
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0.8) 5%,
      rgba(255, 255, 255, 0.4) 15%,
      rgba(255, 255, 255, 0.1) 30%,
      transparent 60%
    );
    mix-blend-mode: soft-light;
    opacity: calc(var(--o) * 0.7);
    transition: opacity 0.15s ease-out;
  }

  /* === GLOSS/SHINE LAYER === */
  /* The diagonal shine that sweeps across like light on plastic */
  .ptcg-gloss {
    background: linear-gradient(
      115deg,
      transparent 0%,
      transparent 25%,
      rgba(255, 255, 255, 0.15) 45%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0.15) 55%,
      transparent 75%,
      transparent 100%
    );
    background-size: 300% 300%;
    background-position: var(--pos);
    opacity: calc(var(--o) * 0.6);
    transition: opacity 0.2s ease-out;
  }

  /* === GRAIN/SPARKLE TEXTURE === */
  /* The high-contrast sparkle effect like glitter in the foil */
  .ptcg-grain {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 150px;
    filter: contrast(400%) brightness(250%);
    mix-blend-mode: color-dodge;
    opacity: calc(var(--o) * 0.12);
    transition: opacity 0.3s ease-out;
    animation: grainShift 8s ease-in-out infinite;
  }

  @keyframes grainShift {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-2px, 1px); }
    50% { transform: translate(1px, -2px); }
    75% { transform: translate(-1px, -1px); }
  }

  /* === EDGE HIGHLIGHT === */
  /* The bright edge glow like light catching the card edge */
  .ptcg-edge {
    background:
      linear-gradient(to right, rgba(255,255,255,0.3) 0%, transparent 5%, transparent 95%, rgba(255,255,255,0.3) 100%),
      linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 3%, transparent 97%, rgba(255,255,255,0.2) 100%);
    opacity: calc(var(--o) * 0.5);
    transition: opacity 0.2s ease-out;
  }

  /* === BORDER GLOW === */
  .ptcg-glow {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.1),
      0 0 15px 2px rgba(255, 200, 50, calc(var(--o) * 0.15)),
      0 0 30px 5px rgba(200, 100, 255, calc(var(--o) * 0.1)),
      0 0 45px 8px rgba(100, 200, 255, calc(var(--o) * 0.08)),
      0 15px 30px -10px rgba(0, 0, 0, 0.4);
    transition: box-shadow 0.3s ease-out;
  }

  /* === SUBTLE IRIDESCENT SHEEN === */
  .ptcg-iridescent {
    background: conic-gradient(
      from calc(var(--mx) * 360deg) at var(--posx) var(--posy),
      rgba(255, 0, 128, 0.1),
      rgba(255, 128, 0, 0.1),
      rgba(128, 255, 0, 0.1),
      rgba(0, 255, 128, 0.1),
      rgba(0, 128, 255, 0.1),
      rgba(128, 0, 255, 0.1),
      rgba(255, 0, 128, 0.1)
    );
    mix-blend-mode: overlay;
    opacity: calc(var(--o) * 0.4);
    transition: opacity 0.25s ease-out;
  }
`

// ============================================================================
// Main Component
// ============================================================================

export function HolographicProfileCard({
  profile,
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
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 })

  // Inject styles
  useEffect(() => {
    const styleId = 'ptcg-holo-styles'
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style')
      styleEl.id = styleId
      styleEl.textContent = holoStyles
      document.head.appendChild(styleEl)
    }
  }, [])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  }, [])

  const dimensions = useMemo(() => {
    switch (size) {
      case "sm": return { width: "w-64", height: "h-80" }
      case "lg": return { width: "w-96", height: "h-[480px]" }
      default: return { width: "w-80", height: "h-[400px]" }
    }
  }, [size])

  const age = calculateAge(profile.birthdate)

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

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (prefersReducedMotion || !interactive) return

    const rect = rectRef.current ?? cardRef.current?.getBoundingClientRect()
    if (!rect) return
    rectRef.current = rect

    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const py = clamp((e.clientY - rect.top) / rect.height, 0, 1)

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setPointer({ x: px, y: py })
    })
  }, [prefersReducedMotion, interactive])

  const handlePointerEnter = useCallback(() => {
    if (interactive) setIsHovered(true)
  }, [interactive])

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
    setPointer({ x: 0.5, y: 0.5 })
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

  // Calculate transforms - card surface faces toward the mouse position
  // rotateX: positive = top edge toward viewer, negative = top edge away
  // rotateY: positive = right edge toward viewer, negative = right edge away
  // For natural "card faces mouse" effect:
  // - Mouse at top → surface faces up → top edge away → rotateX negative
  // - Mouse at bottom → surface faces down → top edge toward → rotateX positive
  // - Mouse at left → surface faces left → right edge toward → rotateY positive
  // - Mouse at right → surface faces right → right edge away → rotateY negative
  const maxTilt = 20 // degrees
  const tiltX = (pointer.y - 0.5) * (isHovered ? maxTilt : 0)
  const tiltY = (0.5 - pointer.x) * (isHovered ? maxTilt : 0) // Inverted for natural feel
  const hyp = Math.sqrt(Math.pow(pointer.x - 0.5, 2) + Math.pow(pointer.y - 0.5, 2))

  // CSS variables for holo effects
  const cssVars = {
    "--mx": pointer.x.toFixed(3),
    "--my": pointer.y.toFixed(3),
    "--posx": `${pointer.x * 100}%`,
    "--posy": `${pointer.y * 100}%`,
    "--pos": `${50 + (pointer.x - 0.5) * 50}% ${50 + (pointer.y - 0.5) * 50}%`,
    "--hyp": hyp.toFixed(3),
    "--o": isHovered ? "1" : "0",
    "--rx": `${tiltX}deg`,
    "--ry": `${tiltY}deg`,
  } as React.CSSProperties

  return (
    <div className={cn("relative select-none", dimensions.width, className)}>
      {/* Perspective wrapper */}
      <div
        className="relative"
        style={{ perspective: "1200px", perspectiveOrigin: "center" }}
      >
        {/* Tilt wrapper - handles mouse-follow rotation */}
        <div
          ref={cardRef}
          className="relative"
          style={{
            transform: prefersReducedMotion ? undefined : (
              `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.02 : 1})`
            ),
            transformStyle: "preserve-3d",
            transition: isHovered
              ? "transform 0.1s ease-out" // Fast response when hovering
              : "transform 0.4s ease-out", // Smooth return when leaving
          }}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {/* Flip wrapper - handles the card flip */}
          <div
            className={cn(
              "ptcg-card relative cursor-pointer rounded-2xl",
              dimensions.height, // Add height here so children can use absolute positioning
              isHovered && "ptcg-glow"
            )}
            style={{
              ...cssVars,
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)",
            }}
            data-hovered={isHovered}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`${profile.firstName} ${profile.lastName}'s profile card. Click to flip.`}
            aria-pressed={isFlipped}
          >
          {/* ==================== FRONT FACE ==================== */}
          <div
            className={cn(
              "absolute inset-0",
              dimensions.height,
              "rounded-2xl overflow-hidden",
              "border-4 border-white/10"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Base gradient background */}
            <div className={cn(
              "absolute inset-0",
              profile.role === "athlete"
                ? "bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900"
                : "bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950"
            )} />

            {/* Subtle texture */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }}
            />

            {/* Content layer */}
            <div className="relative z-10 h-full flex flex-col p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={cn(
                    "px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase border-0",
                    "shadow-lg",
                    profile.role === "athlete"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  )}
                >
                  {profile.role}
                </Badge>
                <span className="text-white/50 text-xs font-mono tracking-wider">
                  {new Date().getFullYear()}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className={cn(
                    "absolute -inset-4 rounded-full blur-2xl opacity-60",
                    profile.role === "athlete"
                      ? "bg-gradient-to-br from-amber-500/50 via-orange-500/30 to-red-500/50"
                      : "bg-gradient-to-br from-cyan-500/50 via-blue-500/30 to-purple-500/50"
                  )} />
                  <Avatar className={cn(
                    "relative border-[3px] border-white/20 shadow-2xl",
                    size === "sm" ? "h-20 w-20" : size === "lg" ? "h-32 w-32" : "h-24 w-24"
                  )}>
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className={cn(
                      "text-2xl font-black",
                      profile.role === "athlete"
                        ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                        : "bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
                    )}>
                      {getInitials(profile.firstName, profile.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {profile.role === "athlete" && profile.experience && (
                  <Badge className={cn(
                    "mt-4 px-3 py-0.5 text-[10px] font-bold tracking-wide",
                    getExperienceBadgeColor(profile.experience),
                    "text-white border border-white/20"
                  )}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {getExperienceLabel(profile.experience)}
                  </Badge>
                )}
              </div>

              {/* Name section */}
              <div className="mt-auto text-center">
                <h3 className={cn(
                  "font-black tracking-tight text-white",
                  "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
                  size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl"
                )}>
                  {profile.firstName} {profile.lastName}
                </h3>

                {profile.groupName && (
                  <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.groupName}
                  </p>
                )}

                <div className="flex items-center justify-center gap-3 mt-2 text-white/60">
                  {age && <span className="text-xs font-medium">{age}y</span>}
                  {profile.sex && <span className="text-xs font-medium uppercase">{profile.sex}</span>}
                </div>

                {profile.role === "coach" && profile.sportFocus && (
                  <Badge variant="outline" className="mt-2 text-[10px] border-cyan-500/30 text-cyan-400">
                    {profile.sportFocus}
                  </Badge>
                )}
              </div>

              <p className="text-center text-white/25 text-[10px] mt-3 tracking-wide">
                TAP TO FLIP
              </p>
            </div>

            {/* ===== HOLOGRAPHIC EFFECT LAYERS ===== */}

            {/* Layer 1: Cosmos sparkle pattern */}
            <div className="ptcg-cosmos absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 2: Rainbow gradient sweep */}
            <div className="ptcg-rainbow absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 3: Iridescent conic gradient */}
            <div className="ptcg-iridescent absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 4: Spotlight/glare */}
            <div className="ptcg-spotlight absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 5: Diagonal gloss */}
            <div className="ptcg-gloss absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 6: Grain/sparkle texture */}
            <div className="ptcg-grain absolute inset-0 pointer-events-none rounded-xl" />

            {/* Layer 7: Edge highlight */}
            <div className="ptcg-edge absolute inset-0 pointer-events-none rounded-xl" />
          </div>

          {/* ==================== BACK FACE ==================== */}
          <div
            className={cn(
              "absolute inset-0",
              dimensions.height,
              "rounded-2xl overflow-hidden",
              "border-4 border-white/10"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div className={cn(
              "absolute inset-0",
              profile.role === "athlete"
                ? "bg-gradient-to-br from-amber-50 via-white to-orange-50"
                : "bg-gradient-to-br from-cyan-50 via-white to-blue-50"
            )} />

            <div className="relative z-10 h-full flex flex-col p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <h4 className="font-black text-slate-900 text-base tracking-tight">
                  {profile.firstName} {profile.lastName}
                </h4>
                <Badge className={cn(
                  "text-[10px] font-bold",
                  profile.role === "athlete"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-cyan-100 text-cyan-800"
                )}>
                  {profile.role}
                </Badge>
              </div>

              {profile.role === "athlete" ? (
                <AthleteBackContent profile={profile} size={size} />
              ) : (
                <CoachBackContent profile={profile} size={size} />
              )}

              <p className="text-center text-slate-300 text-[10px] mt-auto pt-2 tracking-wide">
                TAP TO FLIP BACK
              </p>
            </div>

            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                backgroundSize: "12px 12px"
              }}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function AthleteBackContent({ profile, size }: { profile: ProfileCardData; size: string }) {
  const stats = profile.athleteStats

  return (
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBox
          icon={<Dumbbell className="h-3.5 w-3.5" />}
          label="Workouts"
          value={stats?.totalWorkouts ?? "—"}
          gradient="from-amber-100 to-orange-100"
          textColor="text-amber-800"
        />
        <StatBox
          icon={<Flame className="h-3.5 w-3.5" />}
          label="Streak"
          value={stats?.weeklyStreak ? `${stats.weeklyStreak}w` : "—"}
          gradient="from-orange-100 to-red-100"
          textColor="text-orange-800"
        />
        <StatBox
          icon={<Medal className="h-3.5 w-3.5" />}
          label="PRs"
          value={stats?.personalRecords ?? "—"}
          gradient="from-purple-100 to-pink-100"
          textColor="text-purple-800"
        />
        <StatBox
          icon={<Target className="h-3.5 w-3.5" />}
          label="Rate"
          value={stats?.completionRate ? `${stats.completionRate}%` : "—"}
          gradient="from-emerald-100 to-teal-100"
          textColor="text-emerald-800"
        />
      </div>

      {(profile.height || profile.weight) && (
        <div className="flex items-center justify-center gap-6 py-2 border-y border-slate-100">
          {profile.height && (
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Height</p>
              <p className="text-sm font-black text-slate-900">{profile.height}cm</p>
            </div>
          )}
          {profile.weight && (
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Weight</p>
              <p className="text-sm font-black text-slate-900">{profile.weight}kg</p>
            </div>
          )}
        </div>
      )}

      {profile.trainingGoals && (
        <div className="mt-2 flex-1">
          <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Goals</p>
          <p className={cn(
            "text-slate-600 leading-relaxed",
            size === "sm" ? "text-[10px] line-clamp-2" : "text-xs line-clamp-3"
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
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBox
          icon={<Trophy className="h-3.5 w-3.5" />}
          label="Athletes"
          value={stats?.athletesCoached ?? "—"}
          gradient="from-cyan-100 to-blue-100"
          textColor="text-cyan-800"
        />
        <StatBox
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Years"
          value={stats?.yearsExperience ?? "—"}
          gradient="from-blue-100 to-indigo-100"
          textColor="text-blue-800"
        />
        <StatBox
          icon={<Target className="h-3.5 w-3.5" />}
          label="Programs"
          value={stats?.programsCreated ?? "—"}
          gradient="from-indigo-100 to-purple-100"
          textColor="text-indigo-800"
        />
        <StatBox
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Success"
          value={stats?.successRate ? `${stats.successRate}%` : "—"}
          gradient="from-purple-100 to-pink-100"
          textColor="text-purple-800"
        />
      </div>

      {profile.speciality && (
        <div className="py-2 border-y border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Specialty</p>
          <p className="text-sm font-black text-slate-900">{profile.speciality}</p>
        </div>
      )}

      {profile.philosophy && (
        <div className="mt-2 flex-1">
          <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Philosophy</p>
          <p className={cn(
            "text-slate-600 leading-relaxed italic",
            size === "sm" ? "text-[10px] line-clamp-2" : "text-xs line-clamp-3"
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
  gradient,
  textColor
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  gradient: string
  textColor: string
}) {
  return (
    <div className={cn(
      "rounded-lg p-2 text-center",
      `bg-gradient-to-br ${gradient}`,
      textColor
    )}>
      <div className="flex items-center justify-center mb-0.5 opacity-70">
        {icon}
      </div>
      <p className="text-base font-black">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{label}</p>
    </div>
  )
}

export default HolographicProfileCard
