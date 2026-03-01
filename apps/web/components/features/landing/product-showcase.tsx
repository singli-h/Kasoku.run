"use client"

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import {
  Bot, Brain, Dumbbell,
  Sparkles, Zap, TrendingUp,
  Send, ArrowRightLeft, Trophy,
  Calendar, Activity, Layers,
  ShieldAlert, Settings, ClipboardList,
  Check, MessageCircle, Plus
} from 'lucide-react'

/* ────────────────────────────────────────────────────────
   Custom Hooks
   ──────────────────────────────────────────────────────── */

function useStepAnimation(
  progress: MotionValue<number>,
  step: number,
  total: number
) {
  const size = 1 / total
  const start = step * size
  const fadeIn = start + size * 0.15
  const fadeOut = start + size * 0.8
  const end = start + size
  const isFirst = step === 0
  const isLast = step === total - 1

  // First step starts visible immediately (no blank screen on entry)
  const opacity = useTransform(
    progress,
    isFirst ? [0, fadeOut, end] :
    isLast  ? [start, fadeIn, 1] :
              [start, fadeIn, fadeOut, end],
    isFirst ? [1, 1, 0] :
    isLast  ? [0, 1, 1] :
              [0, 1, 1, 0]
  )
  const y = useTransform(
    progress,
    isFirst ? [0, fadeOut, end] :
    isLast  ? [start, fadeIn, 1] :
              [start, fadeIn, fadeOut, end],
    isFirst ? [0, 0, -40] :
    isLast  ? [60, 0, 0] :
              [60, 0, 0, -40]
  )
  const scale = useTransform(
    progress,
    isFirst ? [0, fadeOut, end] :
    isLast  ? [start, fadeIn, 1] :
              [start, fadeIn, fadeOut, end],
    isFirst ? [1, 1, 0.97] :
    isLast  ? [0.96, 1, 1] :
              [0.96, 1, 1, 0.97]
  )

  return { opacity, y, scale }
}

function useDotAnimation(
  progress: MotionValue<number>,
  step: number,
  total: number
) {
  const size = 1 / total
  const mid = (step + 0.5) * size

  const dotScale = useTransform(
    progress,
    [mid - size * 0.7, mid - size * 0.3, mid, mid + size * 0.3, mid + size * 0.7],
    [0.5, 0.8, 1.5, 0.8, 0.5]
  )
  const dotOpacity = useTransform(
    progress,
    [mid - size * 0.7, mid - size * 0.3, mid, mid + size * 0.3, mid + size * 0.7],
    [0.15, 0.4, 1, 0.4, 0.15]
  )

  return { dotScale, dotOpacity }
}

/* ────────────────────────────────────────────────────────
   Demo Panel: AI Plan Generation Chat
   ──────────────────────────────────────────────────────── */

function PlanGenerationPanel() {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-border/30 bg-card overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-medium text-foreground block">AI Assistant</span>
          <span className="text-xs text-muted-foreground">Ready to help</span>
        </div>
        <span className="ml-auto text-[10px] text-primary/50 uppercase tracking-[0.15em] font-medium">
          Plan Generator
        </span>
      </div>

      {/* Chat */}
      <div className="p-5 flex flex-col gap-4">
        {/* User message — solid primary bg like real app */}
        <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5">
          <p className="text-sm leading-relaxed">
            Build a 12-week sprint program for my U18 group, peaking for nationals in March.
          </p>
        </div>

        {/* AI message — bg-muted like real app */}
        <div className="self-start max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="text-primary font-medium">Here&apos;s your periodized plan:</span>{" "}
            4 phases across 12 weeks. GPP builds base strength (wk 1–3),
            SPP targets sprint-specific power (wk 4–8), taper reduces volume (wk 9–11),
            then competition week.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-surface/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground/60 flex-1">Adjust the taper length…</span>
          <Send className="w-4 h-4 text-primary/60" />
        </div>
      </div>

      {/* Plan Approval Bar — matches real PlanApprovalBar card */}
      <div className="px-5 py-4 border-t border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">Your AI Training Plan</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span><span className="font-medium text-foreground">12</span> weeks</span>
              <span className="text-muted-foreground/50">·</span>
              <span><span className="font-medium text-foreground">4</span> sessions/wk</span>
              <span className="text-muted-foreground/50">·</span>
              <span><span className="font-medium text-foreground">48</span> exercises</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium text-foreground bg-background">
            <MessageCircle className="w-4 h-4" /> Chat with AI
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm font-medium shadow-sm">
            <Check className="w-4 h-4" /> Apply Plan
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Demo Panel: AI Memory Cards
   ──────────────────────────────────────────────────────── */

function MemoryPanel() {
  const memories = [
    {
      Icon: ShieldAlert,
      type: "Injury",
      accent: "amber",
      content: "Left knee ACL rehab — avoid deep squats, heavy lunges",
    },
    {
      Icon: Settings,
      type: "Preference",
      accent: "blue",
      content: "Prefers dumbbells over barbells for pressing movements",
    },
    {
      Icon: Brain,
      type: "Philosophy",
      accent: "violet",
      content: "RPE-based progression, no percentage work for U18 athletes",
    },
    {
      Icon: ClipboardList,
      type: "Session",
      accent: "emerald",
      content: "Last session: avg RPE 8.2, 95% completion, PR on back squat",
    },
  ] as const

  const accentMap = {
    amber: { border: "border-amber-400/20", bg: "bg-amber-400/[0.04]", text: "text-amber-400" },
    blue: { border: "border-blue-400/20", bg: "bg-blue-400/[0.04]", text: "text-blue-400" },
    violet: { border: "border-violet-400/20", bg: "bg-violet-400/[0.04]", text: "text-violet-400" },
    emerald: { border: "border-emerald-400/20", bg: "bg-emerald-400/[0.04]", text: "text-emerald-400" },
  } as const

  return (
    <div className="w-full max-w-lg grid grid-cols-2 gap-3">
      {memories.map((mem) => {
        const a = accentMap[mem.accent]
        return (
          <div
            key={mem.type}
            className={`rounded-xl border ${a.border} ${a.bg} p-4 flex flex-col gap-2.5`}
          >
            <div className="flex items-center gap-2">
              <mem.Icon className={`w-4 h-4 ${a.text}`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${a.text}`}>
                {mem.type}
              </span>
            </div>
            <p className="text-[13px] text-foreground/75 leading-relaxed">{mem.content}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Demo Panel: Training Plan with AI Proposals
   ──────────────────────────────────────────────────────── */

function TrainingPlanPanel() {
  const phases = [
    { name: "GPP", color: "bg-blue-500/80" },
    { name: "SPP", color: "bg-orange-500/80" },
    { name: "Taper", color: "bg-yellow-500/80" },
    { name: "Comp", color: "bg-emerald-500/80" },
  ]

  const sessions = [
    { day: "Monday", type: "Speed", count: 4, accent: "text-blue-400" },
    { day: "Wednesday", type: "Strength", count: 6, accent: "text-orange-400" },
    { day: "Friday", type: "Recovery", count: 3, accent: "text-emerald-400" },
  ]

  return (
    <div className="w-full max-w-xl rounded-2xl border border-border/30 bg-card overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* Macrocycle Timeline */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground/60 uppercase tracking-[0.12em]">
            12-Week Macrocycle
          </span>
          <span className="flex items-center gap-1 text-[10px] text-primary/50">
            <Trophy className="w-3 h-3" /> Nationals
          </span>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden gap-px">
          {phases.map((p) => (
            <div
              key={p.name}
              className={`${p.color} flex-1 flex items-center justify-center first:rounded-l-lg last:rounded-r-lg`}
            >
              <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Cards */}
      <div className="px-5 pb-4 flex gap-2.5">
        {sessions.map((s) => (
          <div key={s.day} className="flex-1 rounded-xl border border-border/25 bg-surface/20 p-3">
            <div className="text-[10px] text-muted-foreground/50 mb-1">{s.day}</div>
            <div className={`text-sm font-semibold ${s.accent} mb-1.5`}>{s.type}</div>
            <div className="text-[11px] text-muted-foreground/60">{s.count} exercises</div>
          </div>
        ))}
      </div>

      {/* Inline Proposal — matches real InlineProposalSection */}
      <div className="mx-5 mb-4 rounded-lg bg-muted/80 border border-border px-3 py-2 flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm text-foreground/80 flex-1">
          <span className="font-semibold tabular-nums">3 changes</span>{" "}
          <span className="text-muted-foreground">|</span>{" "}
          <span className="text-muted-foreground">+2 exercises, 1 update</span>
        </span>
        <div className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> Apply
        </div>
      </div>

      {/* AI Context Scope — matches real AIContextIndicator */}
      <div className="px-5 pb-4 flex items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          <Layers className="w-3 h-3" />
          Block
        </div>
        <span className="text-[10px] text-muted-foreground/50">
          AI sees your entire program
        </span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Demo Panel: Workout with AI Assistance
   ──────────────────────────────────────────────────────── */

function WorkoutPanel() {
  const sets = [
    { num: 1, reps: 5, weight: "140kg", rpe: "8" },
    { num: 2, reps: 5, weight: "140kg", rpe: "8.5" },
    { num: 3, reps: 3, weight: "145kg", rpe: "9", highlight: true },
  ]

  return (
    <div className="w-full max-w-lg rounded-2xl border border-border/30 bg-card overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* Exercise Header */}
      <div className="px-5 py-3.5 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Back Squat</span>
        </div>
        <span className="text-[10px] text-muted-foreground">3/4 sets</span>
      </div>

      {/* Set Rows */}
      <div className="px-5 py-3 flex flex-col gap-1.5">
        {sets.map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 py-1.5 px-1 rounded-md ${
              s.highlight ? "bg-primary/[0.04]" : ""
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[10px] font-medium text-muted-foreground">{s.num}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground">{s.reps} reps</span>
              <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground">{s.weight}</span>
              <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground">RPE {s.rpe}</span>
            </div>
          </div>
        ))}

        {/* Ghost Set Row — stronger border like real GhostSetRow */}
        <div className="relative flex items-center gap-2 py-1.5 px-1 mt-1 rounded-md border-2 border-dashed border-emerald-400 bg-emerald-50/6">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
            <Plus className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-400">5 reps</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-400">130kg</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-400">RPE 7</span>
          </div>
          {/* Floating AI badge */}
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Bot className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      <div className="px-5 pb-4 pt-1 flex flex-col gap-2.5">
        <div className="h-px bg-border/15" />

        <div className="self-end max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2">
          <p className="text-xs">Squat rack is taken. What should I do?</p>
        </div>

        <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2">
          <p className="text-xs text-foreground leading-relaxed">
            Swapping to <span className="text-primary font-semibold">Leg Press</span>.
            4 sets of 5 at similar intensity.
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-blue-400/80">
            <ArrowRightLeft className="w-3 h-3" />
            <span>Back Squat → Leg Press</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Demo Panel: Analytics + AI Feedback Loop
   ──────────────────────────────────────────────────────── */

function AnalyticsPanel() {
  const weeks = [
    [0, 1, 0, 2, 0, 3, 0],
    [1, 0, 2, 0, 3, 0, 1],
    [0, 2, 0, 3, 0, 2, 0],
    [2, 0, 3, 0, 2, 0, 2],
    [0, 3, 0, 2, 0, 3, 0],
    [3, 0, 2, 0, 3, 0, 3],
    [0, 2, 0, 4, 0, 3, 0],
    [2, 0, 4, 0, 3, 0, 4],
  ]

  const intensityColors = [
    "bg-muted/30",
    "bg-green-500/20",
    "bg-green-500/40",
    "bg-green-500/60",
    "bg-green-500/90",
  ]

  const stats = [
    { label: "Best 100m", value: "11.2s", Icon: Zap, accent: "text-amber-400" },
    { label: "Volume", value: "+12%", Icon: TrendingUp, accent: "text-emerald-400" },
    { label: "PRs", value: "3", Icon: Trophy, accent: "text-primary" },
  ]

  return (
    <div className="w-full max-w-lg flex flex-col gap-2 sm:gap-3">
      {/* Heatmap */}
      <div className="rounded-2xl border border-border/30 bg-card p-3 sm:p-5 shadow-2xl shadow-black/10 dark:shadow-black/40">
        <div className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">Workout Consistency</div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1">
              {week.map((intensity, di) => (
                <div
                  key={di}
                  className={`aspect-square rounded-sm ${intensityColors[intensity]}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2.5">
          <span className="text-[9px] text-muted-foreground/40 mr-1">Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
          ))}
          <span className="text-[9px] text-muted-foreground/40 ml-1">More</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/25 bg-card p-2.5 sm:p-3.5 shadow-lg shadow-black/5 dark:shadow-black/20"
          >
            <stat.Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.accent} mb-1.5 sm:mb-2`} />
            <div className="text-base sm:text-lg font-bold text-foreground leading-none">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* New Memory Card — hidden on mobile to prevent overflow */}
      <div className="hidden sm:flex rounded-xl border border-primary/20 bg-primary/[0.03] p-4 items-start gap-3 shadow-lg shadow-primary/[0.08]">
        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-[0.12em] mb-1">
            New Memory Saved
          </div>
          <p className="text-[13px] text-foreground/70 leading-relaxed">
            Average RPE trending up +0.3 over 4 weeks. Consider scheduling a deload.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Step Configuration
   ──────────────────────────────────────────────────────── */

const STEP_DATA = [
  {
    num: "01",
    title: "Describe your goals.",
    subtitle: "AI builds the plan.",
    description:
      "Tell the AI what you need in plain language. It generates a full periodized program — weeks, sessions, exercises, sets — tailored to your athletes and timeline.",
    Panel: PlanGenerationPanel,
  },
  {
    num: "02",
    title: "AI remembers everything",
    subtitle: "about your athletes.",
    description:
      "Injuries, preferences, training philosophy, past performance. The AI carries context across every session so your athletes never have to repeat themselves.",
    Panel: MemoryPanel,
  },
  {
    num: "03",
    title: "Your training plan,",
    subtitle: "built intelligently.",
    description:
      "AI proposes changes across sessions, weeks, or your entire block. Review inline diffs, approve with one click. It sees the big picture so you can focus on coaching.",
    Panel: TrainingPlanPanel,
  },
  {
    num: "04",
    title: "Real-time coaching",
    subtitle: "during every workout.",
    description:
      "Athletes get AI assistance mid-session. Equipment unavailable? AI suggests swaps. Fatigued? It adjusts the load. Every decision based on today's performance.",
    Panel: WorkoutPanel,
  },
  {
    num: "05",
    title: "Every session makes",
    subtitle: "AI smarter.",
    description:
      "Performance data feeds back into AI memory. It spots trends you might miss — RPE creep, volume plateaus, recovery gaps — and suggests adjustments before problems emerge.",
    Panel: AnalyticsPanel,
  },
]

const TOTAL_STEPS = STEP_DATA.length

/* ────────────────────────────────────────────────────────
   Aurora Drift — orb color palette per step
   ──────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────── */

export default function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Shorter scroll distance on mobile (content stacks vertically, less needed per step)
  const [vhPerStep, setVhPerStep] = React.useState(100)
  React.useEffect(() => {
    const update = () => setVhPerStep(window.innerWidth < 768 ? 70 : 100)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Step animations — hooks called unconditionally in fixed order
  const s0 = useStepAnimation(scrollYProgress, 0, TOTAL_STEPS)
  const s1 = useStepAnimation(scrollYProgress, 1, TOTAL_STEPS)
  const s2 = useStepAnimation(scrollYProgress, 2, TOTAL_STEPS)
  const s3 = useStepAnimation(scrollYProgress, 3, TOTAL_STEPS)
  const s4 = useStepAnimation(scrollYProgress, 4, TOTAL_STEPS)
  const stepAnims = [s0, s1, s2, s3, s4]

  // Dot animations
  const d0 = useDotAnimation(scrollYProgress, 0, TOTAL_STEPS)
  const d1 = useDotAnimation(scrollYProgress, 1, TOTAL_STEPS)
  const d2 = useDotAnimation(scrollYProgress, 2, TOTAL_STEPS)
  const d3 = useDotAnimation(scrollYProgress, 3, TOTAL_STEPS)
  const d4 = useDotAnimation(scrollYProgress, 4, TOTAL_STEPS)
  const dotAnims = [d0, d1, d2, d3, d4]

  // ── Aurora Drift: morphing gradient orbs ──
  // Orb 1 (indigo) — drifts from bottom-left to center-right
  const orb1X = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["10%", "25%", "45%", "60%", "70%"])
  const orb1Y = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["70%", "55%", "40%", "30%", "20%"])
  const orb1Scale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.8, 1.1, 1.3, 1.6])
  const orb1Opacity = useTransform(scrollYProgress, [0, 0.05, 0.9, 1], [0, 0.18, 0.18, 0.06])

  // Orb 2 (violet) — rises from right, merges center at step 3
  const orb2X = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], ["80%", "70%", "50%", "35%", "30%"])
  const orb2Y = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], ["80%", "60%", "45%", "35%", "25%"])
  const orb2Scale = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.5, 0.8, 1.2, 1.0, 1.4])
  const orb2Opacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.9, 1], [0, 0.12, 0.16, 0.16, 0.05])

  // Orb 3 (cyan/teal accent) — appears mid-scroll, subtle
  const orb3X = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 1], ["20%", "35%", "55%", "65%"])
  const orb3Y = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 1], ["30%", "50%", "35%", "45%"])
  const orb3Scale = useTransform(scrollYProgress, [0.3, 0.5, 0.8, 1], [0.3, 0.7, 1.0, 0.9])
  const orb3Opacity = useTransform(scrollYProgress, [0.25, 0.35, 0.7, 0.9, 1], [0, 0.1, 0.14, 0.14, 0.04])

  // Overall aurora intensity ramps up through scroll
  const auroraOpacity = useTransform(scrollYProgress, [0, 0.06, 0.85, 1], [0, 1, 1, 0.3])

  return (
    <section
      ref={containerRef}
      className="relative bg-background w-full z-20"
      style={{ minHeight: `${TOTAL_STEPS * vhPerStep}vh` }}
      aria-label="Product showcase — How Kasoku AI works"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">

        {/* ── Aurora Drift: scroll-driven morphing gradient orbs ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{ opacity: prefersReducedMotion ? 0.12 : auroraOpacity }}
        >
          {/* Orb 1 — Indigo primary */}
          <motion.div
            style={{
              left: prefersReducedMotion ? "40%" : orb1X,
              top: prefersReducedMotion ? "45%" : orb1Y,
              scale: prefersReducedMotion ? 1 : orb1Scale,
              opacity: prefersReducedMotion ? 0.15 : orb1Opacity,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500 blur-[120px] will-change-transform"
          />

          {/* Orb 2 — Violet accent */}
          <motion.div
            style={{
              left: prefersReducedMotion ? "60%" : orb2X,
              top: prefersReducedMotion ? "50%" : orb2Y,
              scale: prefersReducedMotion ? 0.8 : orb2Scale,
              opacity: prefersReducedMotion ? 0.1 : orb2Opacity,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-violet-500 blur-[110px] will-change-transform"
          />

          {/* Orb 3 — Cyan/teal accent, appears mid-scroll */}
          <motion.div
            style={{
              left: prefersReducedMotion ? "40%" : orb3X,
              top: prefersReducedMotion ? "40%" : orb3Y,
              scale: prefersReducedMotion ? 0.6 : orb3Scale,
              opacity: prefersReducedMotion ? 0.08 : orb3Opacity,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-cyan-400 blur-[100px] will-change-transform"
          />
        </motion.div>

        {/* Section overline — persistent */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <span className="text-xs text-muted-foreground/60 uppercase tracking-[0.25em] font-mono">
            How It Works
          </span>
        </div>

        {/* Progress dots — desktop only */}
        <div
          className="hidden lg:flex flex-col items-center gap-4 absolute left-8 xl:left-12 top-1/2 -translate-y-1/2 z-30"
          aria-hidden="true"
        >
          {/* Connecting line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border/10" />

          {dotAnims.map((dot, i) => (
            <motion.div
              key={i}
              style={{
                scale: prefersReducedMotion ? 1 : dot.dotScale,
                opacity: prefersReducedMotion ? 0.4 : dot.dotOpacity,
              }}
              className="w-2 h-2 rounded-full bg-primary relative z-10 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            />
          ))}
        </div>

        {/* Steps */}
        {STEP_DATA.map((data, i) => {
          const anim = stepAnims[i]
          return (
            <motion.div
              key={data.num}
              style={{
                opacity: anim.opacity,
                y: prefersReducedMotion ? 0 : anim.y,
                scale: prefersReducedMotion ? 1 : anim.scale,
              }}
              className="absolute inset-0 flex items-center pointer-events-none"
            >
              <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 xl:px-20 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-12 xl:gap-20">
                {/* Text Side */}
                <div className="flex-1 w-full max-w-md lg:max-w-lg relative">
                  {/* Watermark step number */}
                  <span
                    className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 text-[100px] lg:text-[140px] font-heading font-black text-foreground/2 select-none pointer-events-none leading-none"
                    aria-hidden="true"
                  >
                    {data.num}
                  </span>

                  <span className="text-[11px] text-primary/40 font-mono tracking-[0.2em] uppercase mb-4 block relative z-10">
                    {data.num}
                  </span>
                  <h3 className="font-heading text-2xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-foreground leading-[1.08] mb-1 relative z-10">
                    {data.title}
                  </h3>
                  <h3 className="font-heading text-2xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-primary leading-[1.08] mb-3 sm:mb-5 relative z-10">
                    {data.subtitle}
                  </h3>
                  <p className="text-sm sm:text-[17px] text-muted-foreground font-sans leading-relaxed max-w-sm relative z-10 line-clamp-3 sm:line-clamp-none">
                    {data.description}
                  </p>
                </div>

                {/* Panel Side */}
                <div className="flex-1 w-full flex justify-center lg:justify-end items-center pointer-events-auto">
                  <data.Panel />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
