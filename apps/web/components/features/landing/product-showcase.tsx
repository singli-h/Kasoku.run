"use client"

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import {
  Bot, Brain, Dumbbell,
  Sparkles, Zap, TrendingUp,
  Send, ArrowRightLeft, Trophy,
  Calendar, Activity,
  ShieldAlert, Settings, BookOpen, ClipboardList
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
  const isLast = step === total - 1

  const opacity = useTransform(
    progress,
    isLast ? [start, fadeIn, 1] : [start, fadeIn, fadeOut, end],
    isLast ? [0, 1, 1] : [0, 1, 1, 0]
  )
  const y = useTransform(
    progress,
    isLast ? [start, fadeIn, 1] : [start, fadeIn, fadeOut, end],
    isLast ? [60, 0, 0] : [60, 0, 0, -40]
  )
  const scale = useTransform(
    progress,
    isLast ? [start, fadeIn, 1] : [start, fadeIn, fadeOut, end],
    isLast ? [0.96, 1, 1] : [0.96, 1, 1, 0.97]
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
    <div className="w-full max-w-lg rounded-2xl border border-border/30 bg-[#0a0a0b] overflow-hidden shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/20 flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Kasoku AI</span>
        <span className="ml-auto text-[10px] text-primary/50 uppercase tracking-[0.15em] font-medium">
          Plan Generator
        </span>
      </div>

      {/* Chat */}
      <div className="p-5 flex flex-col gap-4">
        <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-surface border border-border/40 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">
            Build a 12-week sprint program for my U18 group, peaking for nationals in March.
          </p>
        </div>

        <div className="self-start max-w-[90%] rounded-2xl rounded-bl-sm bg-primary/[0.06] border border-primary/15 px-4 py-3">
          <p className="text-sm text-foreground/90 leading-relaxed">
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

      {/* Plan Approval Bar */}
      <div className="px-5 py-3.5 border-t border-primary/20 bg-primary/[0.03] flex items-center gap-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">12</span> weeks
          </span>
          <span className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">4</span>/wk
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">48</span> exercises
          </span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/30">
          Apply Plan
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
    <div className="w-full max-w-xl rounded-2xl border border-border/30 bg-[#0a0a0b] overflow-hidden shadow-2xl shadow-black/40">
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
        <div className="flex h-7 rounded-lg overflow-hidden gap-px">
          {phases.map((p) => (
            <div
              key={p.name}
              className={`${p.color} flex-1 flex items-center justify-center first:rounded-l-lg last:rounded-r-lg`}
            >
              <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">
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

      {/* Inline Proposal */}
      <div className="mx-5 mb-4 rounded-lg border border-primary/25 bg-primary/[0.04] px-4 py-2.5 flex items-center gap-3">
        <Bot className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs text-foreground/70 flex-1">
          <span className="text-primary font-semibold">3 changes</span>{" "}
          <span className="text-muted-foreground">·</span> +2 exercises, 1 update
        </span>
        <div className="px-3 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
          Apply
        </div>
      </div>

      {/* AI Context Scope */}
      <div className="px-5 pb-4 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          <BookOpen className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-semibold">Block scope</span>
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
    <div className="w-full max-w-lg rounded-2xl border border-border/30 bg-[#0a0a0b] overflow-hidden shadow-2xl shadow-black/40">
      {/* Exercise Header */}
      <div className="px-5 py-3.5 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-[15px]">Back Squat</span>
        </div>
        <span className="text-xs text-muted-foreground/50">3/4 sets</span>
      </div>

      {/* Set Table */}
      <div className="px-5 py-3">
        {/* Header */}
        <div className="flex items-center text-[10px] text-muted-foreground/50 uppercase tracking-wider px-2 pb-2">
          <span className="w-10">Set</span>
          <span className="flex-1">Reps</span>
          <span className="flex-1">Weight</span>
          <span className="w-14 text-right">RPE</span>
        </div>

        {/* Completed Sets */}
        {sets.map((s) => (
          <div
            key={s.num}
            className={`flex items-center text-sm px-2 py-2 rounded-md ${
              s.highlight ? "bg-primary/[0.04]" : ""
            }`}
          >
            <span className="w-10 text-muted-foreground/50 text-xs">{s.num}</span>
            <span className="flex-1 text-foreground/90">{s.reps}</span>
            <span className="flex-1 text-foreground/90">{s.weight}</span>
            <span className="w-14 text-right text-primary font-semibold">{s.rpe}</span>
          </div>
        ))}

        {/* Ghost Set Row — AI Suggested */}
        <div className="flex items-center text-sm px-2 py-2 mt-1 rounded-md border border-dashed border-emerald-500/30 bg-emerald-500/[0.03]">
          <span className="w-10">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="flex-1 text-emerald-400/80">5</span>
          <span className="flex-1 text-emerald-400/80">130kg</span>
          <span className="w-14 text-right text-emerald-400 font-semibold">7</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 mt-1.5 mb-1">
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
            AI Suggested
          </span>
          <span className="text-[10px] text-emerald-400/40">· Based on RPE trend</span>
        </div>
      </div>

      {/* Chat Overlay */}
      <div className="px-5 pb-4 pt-1 flex flex-col gap-2.5">
        <div className="h-px bg-border/15" />

        <div className="self-end max-w-[75%] rounded-2xl rounded-br-sm bg-surface border border-border/30 px-3.5 py-2">
          <p className="text-xs text-foreground/90">Squat rack is taken. What should I do?</p>
        </div>

        <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-primary/[0.06] border border-primary/15 px-3.5 py-2">
          <p className="text-xs text-foreground/85 leading-relaxed">
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
    "bg-border/15",
    "bg-emerald-900/50",
    "bg-emerald-700/50",
    "bg-emerald-500/60",
    "bg-emerald-400/80",
  ]

  const stats = [
    { label: "Best 100m", value: "11.2s", Icon: Zap, accent: "text-amber-400" },
    { label: "Volume", value: "+12%", Icon: TrendingUp, accent: "text-emerald-400" },
    { label: "PRs", value: "3", Icon: Trophy, accent: "text-primary" },
  ]

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      {/* Heatmap */}
      <div className="rounded-2xl border border-border/30 bg-[#0a0a0b] p-5 shadow-2xl shadow-black/40">
        <div className="text-sm font-semibold text-foreground mb-3">Training Consistency</div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] flex-1">
              {week.map((intensity, di) => (
                <div
                  key={di}
                  className={`aspect-square rounded-[3px] ${intensityColors[intensity]}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2.5">
          <span className="text-[9px] text-muted-foreground/40 mr-1">Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${color}`} />
          ))}
          <span className="text-[9px] text-muted-foreground/40 ml-1">More</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/25 bg-[#0a0a0b] p-3.5 shadow-lg shadow-black/20"
          >
            <stat.Icon className={`w-4 h-4 ${stat.accent} mb-2`} />
            <div className="text-lg font-bold text-foreground leading-none">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* New Memory Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 flex items-start gap-3 shadow-lg shadow-primary/[0.08]">
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
   Main Component
   ──────────────────────────────────────────────────────── */

export default function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

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

  // Ambient glow
  const glowOpacity = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [0, 0.12, 0.12, 0])

  return (
    <section
      ref={containerRef}
      className="relative bg-background w-full z-20"
      style={{ minHeight: `${TOTAL_STEPS * 120}vh` }}
      aria-label="Product showcase — How Kasoku AI works"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {/* Ambient glow behind panels */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute right-[15%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Section overline — persistent */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30" aria-hidden="true">
          <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em] font-mono">
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
              <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 xl:px-20 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                {/* Text Side */}
                <div className="flex-1 w-full max-w-md lg:max-w-lg relative">
                  {/* Watermark step number */}
                  <span
                    className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 text-[100px] lg:text-[140px] font-heading font-black text-foreground/[0.02] select-none pointer-events-none leading-none"
                    aria-hidden="true"
                  >
                    {data.num}
                  </span>

                  <span className="text-[11px] text-primary/40 font-mono tracking-[0.2em] uppercase mb-4 block relative z-10">
                    {data.num}
                  </span>
                  <h3 className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-foreground leading-[1.08] mb-1 relative z-10">
                    {data.title}
                  </h3>
                  <h3 className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-primary leading-[1.08] mb-5 relative z-10">
                    {data.subtitle}
                  </h3>
                  <p className="text-base sm:text-[17px] text-muted-foreground font-sans leading-relaxed max-w-sm relative z-10">
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
