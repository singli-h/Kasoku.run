"use client"

import { SplitTimeChart } from "@/components/features/performance/components/sprint/SplitTimeChart"
import { BenchmarkReferenceCard } from "@/components/features/performance/components/sprint/BenchmarkReferenceCard"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Layers,
  RefreshCw,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  Zap,
  Activity,
} from "lucide-react"

const spring = { type: "spring" as const, stiffness: 170, damping: 26 }

const DEMO_SPRINT_SESSIONS = [
  {
    id: "s1",
    date: "2026-01-11T12:00:00Z",
    totalDistance: 40,
    totalTime: 5.50,
    isPB: true,
    splits: [
      { distance: 20, time: 3.31, cumulativeTime: 3.31 },
      { distance: 40, time: 2.19, cumulativeTime: 5.50 },
    ],
  },
  {
    id: "s2",
    date: "2025-12-30T12:00:00Z",
    totalDistance: 40,
    totalTime: 5.61,
    isPB: false,
    splits: [
      { distance: 20, time: 3.38, cumulativeTime: 3.38 },
      { distance: 40, time: 2.23, cumulativeTime: 5.61 },
    ],
  },
]

const DEMO_COMPETITION_PBS = [
  {
    eventId: 24,
    eventName: "60m",
    distance: 60,
    value: 7.17,
    date: "2025-08-13",
    isWindLegal: true,
    isIndoor: false,
    wind: 0.3,
  },
]

const DEMO_ATHLETE_METRICS = {
  time60m: 7.17,
  reactionTime: 0.171,
  topSpeed: 9.13,
  strideLengthMaxV: 1.98,
  strideFrequencyMaxV: 4.62,
  bestTime: 5.50,
  bestDistance: 40,
}

/* ─── page ─── */

export default function DemoPage() {
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = (delay = 0) => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { margin: "-40px" as const },
        transition: { duration: 0 },
      }
    }
    return {
      initial: { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { margin: "-40px" as const },
      transition: { ...spring, delay },
    }
  }

  return (
    <div className="bg-background">

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center pt-28 pb-16 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary blur-[130px] opacity-[0.08] -top-40 left-1/2 -translate-x-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-muted-foreground font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            Track & Field · Sprint Coach
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="relative z-10 mt-6 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.06]"
        >
          The AI that thinks
          <br />
          <span className="text-primary">like a sprint coach.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="relative z-10 mt-5 text-base sm:text-lg text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed"
        >
          Plan seasons. Track athletes. Brief your squad.
          All in one place — with AI that actually knows your athletes.
        </motion.p>
      </section>

      {/* ════════════════════════════════════════
          SEASON BUILDER
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Calendar} label="Season Structure" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Your whole season.
              <br />
              Structured in minutes.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Build from macrocycle down to daily sessions. AI fills each phase
              with sessions based on your goals — you stay in full control.
            </p>
          </motion.div>

          {/* Macrocycle timeline */}
          <motion.div
            {...fadeUp(0.1)}
            className="mt-8 rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-heading font-semibold text-foreground">
                  2025/26 Season · Macrocycle
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">Oct → Aug</span>
            </div>

            <div className="p-4 space-y-4">
              {/* Phase blocks */}
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-2">Training Phases</p>
                <div className="relative overflow-hidden">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {[
                      { label: "GPP", weeks: "8w", color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" },
                      { label: "SPP 1", weeks: "10w", color: "bg-primary/20 border-primary/30 text-primary" },
                      { label: "SPP 2", weeks: "10w", color: "bg-primary/30 border-primary/40 text-primary", active: true },
                      { label: "Pre-Comp", weeks: "6w", color: "bg-amber-500/20 border-amber-500/30 text-amber-400" },
                      { label: "Comp", weeks: "8w", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" },
                      { label: "Taper", weeks: "4w", color: "bg-rose-500/20 border-rose-500/30 text-rose-400" },
                    ].map((phase) => (
                      <div
                        key={phase.label}
                        className={`rounded-lg border px-2.5 py-2 shrink-0 ${phase.color} ${phase.active ? "ring-1 ring-primary/50" : ""}`}
                      >
                        <p className="text-xs font-heading font-bold whitespace-nowrap">{phase.label}</p>
                        <p className="text-[11px] font-mono opacity-70">{phase.weeks}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none" aria-hidden="true" />
                </div>
                <PhaseLabel />
              </div>

              {/* Current week grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-mono text-muted-foreground">Week 23 · SPP Phase 2</p>
                  <span className="text-[11px] font-mono text-primary">5/6 sessions planned</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    { day: "MON", type: "Speed", color: "bg-primary/10 border-primary/20 text-primary", done: true },
                    { day: "TUE", type: "Max-V", color: "bg-primary/10 border-primary/20 text-primary", done: true, active: true },
                    { day: "WED", type: "Off", color: "bg-border/30 border-border/40 text-muted-foreground/50", done: false },
                    { day: "THU", type: "Gym", color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", done: false },
                    { day: "FRI", type: "Speed", color: "bg-primary/10 border-primary/20 text-primary", done: false },
                    { day: "SAT", type: "Test", color: "bg-amber-500/10 border-amber-500/20 text-amber-400", done: false },
                  ].map((s) => (
                    <div
                      key={s.day}
                      className={`rounded-lg border p-1.5 text-center ${s.color} ${s.active ? "ring-1 ring-primary" : ""}`}
                    >
                      <p className="text-[11px] font-mono text-muted-foreground">{s.day}</p>
                      <p className="text-[11px] font-heading font-semibold leading-tight mt-0.5">{s.type}</p>
                      {s.done && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          AI CHAT DEMO
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Bot} label="AI Planning Assistant" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Type what you want.
              <br />
              Get a real session.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Tell the AI your group, phase, and goal. It speaks your language.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.1)}
            className="mt-8 rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/5"
          >
            {/* titlebar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                AI Plan Assistant · SS Group · SPP Phase
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Coach message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm font-sans leading-relaxed">
                    Generate Tuesday's session for the SS group. SPP phase, high intensity. Focus on acceleration mechanics.
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>

              {/* AI response */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-xs text-muted-foreground font-sans">
                    Based on your SPP phase goals and last 3 weeks of SS data (avg 88% completion, fatigue trending up slightly):
                  </p>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-heading font-bold text-foreground">
                          Tuesday — Short Sprinters (SS)
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          SPP Phase · High Intensity · ~90 min
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        AI Draft
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      <SessionBlock
                        label="WARM-UP"
                        items={[
                          { name: "Run-Throughs", prescription: "5 × 60m @55%" },
                          { name: "A-Skip", prescription: "3 × 20m" },
                          { name: "B-Skip", prescription: "3 × 30m" },
                          { name: "Strides zero step", prescription: "3 × 30m" },
                        ]}
                      />
                      <SessionBlock
                        label="ACCELERATION BLOCK"
                        accent
                        items={[
                          { name: "Block Starts", prescription: "6 × 30m @95% [full rec]" },
                          { name: "Flying 20s", prescription: "4 × 20m @100% [8 min]" },
                          { name: "CSD", prescription: "2×40m, 2×60m @90% [10 min]" },
                        ]}
                      />
                      <div className="rounded-lg bg-surface border border-border/60 px-3 py-2 flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                          High CNS demand — volume reduced 15% vs last week given recent fatigue trend. Monitor closely.
                        </p>
                      </div>
                    </div>

                    {/* ApprovalBanner — matches real app UI */}
                    <div className="mx-3 mb-3 mt-1 px-3 py-2 rounded-lg bg-muted/80 border border-border shadow-[inset_0_1px_0_hsl(var(--border)/0.5)] flex items-center gap-2">
                      {/* Bot icon square */}
                      <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-heading font-bold text-foreground">3</span>
                      <span className="text-xs text-muted-foreground font-sans">changes</span>
                      <span className="text-muted-foreground/40 text-xs">|</span>
                      <span className="text-xs font-mono text-muted-foreground flex-1">+2 sets, 1 update</span>
                      {/* Change + Apply */}
                      <button type="button" className="flex items-center gap-1 h-7 px-2 rounded-md text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        Change
                      </button>
                      <button type="button" className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-white text-xs font-heading font-semibold">
                        <Check className="w-3 h-3" />
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border bg-surface flex items-center gap-2">
              <div className="flex-1 h-9 rounded-xl bg-card border border-border px-3 flex items-center">
                <span className="text-xs text-muted-foreground/50 font-sans">
                  Ask anything about your plan...
                </span>
              </div>
              <button type="button" aria-label="Send message" className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          AI-GENERATED WEEK VIEW
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Sparkles} label="AI Week Generation" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              One prompt.
              <br />
              A full week of sessions.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Ask AI to generate the whole week for your group. Every session
              lands ready to review — edit any detail before approving.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.1)}
            className="mt-8 rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-heading font-semibold text-foreground">
                  AI Generated Week · SS Group · SPP Phase 2
                </span>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                Pending Review
              </span>
            </div>

            <div className="p-3 space-y-2">
              {[
                {
                  day: "MON",
                  label: "Speed Endurance",
                  tag: "Speed",
                  tagColor: "bg-primary/10 text-primary",
                  duration: "90 min",
                  exercises: ["6 × 200m @80%", "3 × 300m @75%"],
                },
                {
                  day: "TUE",
                  label: "Max Velocity",
                  tag: "Max-V",
                  tagColor: "bg-primary/10 text-primary",
                  duration: "90 min",
                  exercises: ["Flying 40s 4 × 40m @100%", "Flying 60s 3 × 60m @98%"],
                  highlight: true,
                },
                {
                  day: "WED",
                  label: "Active Recovery",
                  tag: "Recovery",
                  tagColor: "bg-emerald-500/10 text-emerald-500",
                  duration: "45 min",
                  exercises: ["Easy jog 20 min", "Mobility + static stretch"],
                },
                {
                  day: "THU",
                  label: "Gym — Power",
                  tag: "Strength",
                  tagColor: "bg-indigo-500/10 text-indigo-400",
                  duration: "60 min",
                  exercises: ["Power clean 4×3", "Nordic curls 3×6", "Sled push 4×20m"],
                },
                {
                  day: "FRI",
                  label: "Flying Sprints",
                  tag: "Speed",
                  tagColor: "bg-primary/10 text-primary",
                  duration: "75 min",
                  exercises: ["4 × 20m flying @100%", "CSD 2×40m, 2×60m @90%"],
                },
                {
                  day: "SAT",
                  label: "Time Trial",
                  tag: "Test",
                  tagColor: "bg-amber-500/10 text-amber-400",
                  duration: "60 min",
                  exercises: ["60m time trial", "Block start practice"],
                },
              ].map((session, i) => (
                <motion.div
                  key={session.day}
                  {...fadeUp(i * 0.05)}
                  className={`rounded-xl border p-3 flex items-start gap-3 ${session.highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-[11px] font-mono text-muted-foreground">{session.day}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-heading font-semibold text-foreground">
                        {session.label}
                      </p>
                      <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${session.tagColor}`}>
                        {session.tag}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                        {session.duration}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {session.exercises.map((ex) => (
                        <p key={ex} className="text-xs text-muted-foreground font-sans">
                          · {ex}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-border bg-surface flex items-center gap-2">
              <button type="button" className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve All & Push to Athletes
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ATHLETE PHONE VIEW
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Smartphone} label="Athlete Experience" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              What your athletes
              <br />
              see on their phone.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Coach approves the plan → athletes get it instantly. They log every
              set live during the session. You see the data as it comes in.
            </p>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            {...fadeUp(0.1)}
            className="mt-8 mx-auto max-w-xs"
          >
            {/* Phone frame */}
            <div className="rounded-4xl border-2 border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
              {/* Status bar */}
              <div className="bg-surface px-5 pt-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 rounded-full bg-border" />
                </div>
              </div>

              {/* App header */}
              <div className="bg-surface border-b border-border px-4 py-3">
                <p className="text-[11px] font-mono text-muted-foreground">Tuesday · SPP Phase 2</p>
                <p className="text-sm font-heading font-bold text-foreground mt-0.5">
                  Acceleration Block
                </p>
              </div>

              {/* Green progress bar — matches real WorkoutView */}
              <div className="h-[2px] bg-border">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: "38%" }} />
              </div>

              <div className="bg-background">
                {/* Section divider — matches real SectionDivider */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Warm-Up</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* ExerciseCard — collapsed, all done */}
                <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-sans flex-1 text-muted-foreground line-through">Tempo Run</span>
                  <span className="text-[10px] font-mono text-muted-foreground">3/3</span>
                  {/* Completion circle — green = done */}
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Section divider */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wide">Acceleration Block</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* ExerciseCard — expanded, in progress */}
                <div className="border-b border-border/30">
                  {/* Card header row */}
                  <div className="px-3 py-2 flex items-center gap-2">
                    <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-heading font-semibold flex-1 text-foreground">Block Starts</span>
                    <span className="text-[10px] font-mono text-muted-foreground">2/6</span>
                    {/* Completion circle — number, not done yet */}
                    <div className="w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-foreground">1</span>
                    </div>
                  </div>
                  {/* 2px exercise progress bar */}
                  <div className="h-[2px] bg-border mx-3 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "33%" }} />
                  </div>

                  {/* SetRows — matches real layout */}
                  <div className="px-3 py-2 space-y-2">
                    {/* Set 1 — done */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="h-8 w-14 rounded border border-border bg-card flex items-center justify-center">
                          <span className="text-[11px] font-mono text-muted-foreground/50 line-through">30m</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">@95%</span>
                        <div className="h-8 w-10 rounded border border-border bg-card flex items-center justify-center ml-auto">
                          <span className="text-[11px] font-mono text-muted-foreground/50">8</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">RPE</span>
                      </div>
                    </div>
                    {/* Set 2 — active */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-mono font-bold text-primary">2</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="h-8 w-14 rounded border border-primary/40 bg-primary/5 ring-1 ring-primary/30 flex items-center justify-center">
                          <span className="text-[11px] font-mono text-foreground">30m</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">@95%</span>
                        <div className="h-8 w-10 rounded border border-border bg-card flex items-center justify-center ml-auto">
                          <span className="text-[11px] font-mono text-muted-foreground/30">—</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">RPE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next exercise — collapsed */}
                <div className="px-3 py-2 flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-sans flex-1 text-foreground">Flying 20s</span>
                  <span className="text-[10px] font-mono text-muted-foreground">0/4</span>
                  <div className="w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">2</span>
                  </div>
                </div>

                <p className="text-[10px] text-center text-muted-foreground/50 font-sans py-2 border-t border-border/30">
                  Tap circle to complete set · Data syncs to coach
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ATHLETE TRACKING
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={TrendingUp} label="Athlete Tracking" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              See what
              <br />
              actually happened.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Planning tools tell you what was prescribed. Kasoku tells you
              what was done — rep by rep, with RPE and athlete notes.
            </p>
          </motion.div>

          {/* Real coach dashboard UI — matches CoachDashboardView */}
          <motion.div {...fadeUp(0.06)} className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">

            {/* Stats row */}
            <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs font-sans text-muted-foreground">
                  <span className="text-foreground font-semibold">8</span> athletes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-sans text-muted-foreground">
                  <span className="text-foreground font-semibold">2</span> active plans
                </span>
              </div>
            </div>

            {/* Athletes section */}
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Athletes</p>
            </div>
            <div className="divide-y divide-border">
              {([
                { name: "Marcus O.", active: true, ago: "2 hours ago", status: "on-track" as const },
                { name: "Jaylen T.", active: true, ago: "1 hour ago", status: "on-track" as const },
                { name: "Kai W.", active: false, ago: "2 days ago", status: "flag" as const },
                { name: "Devon A.", active: true, ago: "3 hours ago", status: "pb" as const },
              ]).map((a) => (
                <div key={a.name} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    <span className="text-sm font-sans text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground font-sans">{a.ago}</span>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="px-4 pt-3 pb-1 border-t border-border mt-1">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Recent Activity</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Marcus O.", session: "Acceleration Block", dot: "bg-emerald-500", ago: "2h ago" },
                { name: "Devon A.", session: "Acceleration Block", dot: "bg-blue-500", ago: "1h ago" },
                { name: "Jaylen T.", session: "Flying 20s", dot: "bg-emerald-500", ago: "3h ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${a.dot}`} />
                    <div>
                      <span className="text-xs font-sans text-foreground">{a.name}</span>
                      <p className="text-xs text-muted-foreground font-sans">{a.session}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-sans shrink-0">{a.ago}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.2)}
            className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-heading font-semibold text-foreground">
                AI Weekly Insight — Week 23
              </p>
              <span className="ml-auto text-[11px] font-mono text-muted-foreground">Auto-generated</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed italic border-l-2 border-primary/30 pl-3">
              &quot;Kai W. shows recurring hamstring tightness — reduce acceleration volume 20% next week. Devon A. hit a new PB on Flying 30s (3.41s). Overall completion 88%. Recommend adding 1 extra recovery day before Saturday&apos;s time trial.&quot;
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SPRINT PERFORMANCE
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Activity} label="Sprint Performance" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              See exactly where
              <br />
              time is lost.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Freelap split data mapped against elite benchmarks. Know your acceleration phase,
              max velocity, and where you stack up — session by session.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="mt-10 space-y-4">
            <SplitTimeChart
              sessions={DEMO_SPRINT_SESSIONS}
              showBenchmarks={['10.00', '11.00']}
              competitionPBs={DEMO_COMPETITION_PBS}
              showCompetitionPBs={true}
            />
            <BenchmarkReferenceCard
              athleteMetrics={DEMO_ATHLETE_METRICS}
              competitionPBs={DEMO_COMPETITION_PBS}
              gender="male"
              targetStandard="11.00"
            />
          </motion.div>

        </div>
      </section>

      {/* ════════════════════════════════════════
          AI MEMORY
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={Cpu} label="Contextual Memory" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              AI that remembers
              <br />
              your entire season.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Every suggestion is informed by your season goals, phase focus,
              and what your athletes actually did last week. Not generic — yours.
            </p>
          </motion.div>

          <div className="mt-8 space-y-0">
            {[
              {
                delay: 0.05,
                stepNum: 1,
                label: "Season Goal",
                tag: "Written once",
                content: "Peak for HK Open Feb 2025. SS group: 4 athletes targeting sub-10.8. Philosophy: max velocity focus in SPP.",
                color: "border-indigo-500/30 bg-indigo-500/5",
                dot: "bg-indigo-400",
              },
              {
                delay: 0.12,
                stepNum: 2,
                label: "Phase Focus",
                tag: "Updated each block",
                content: "SPP Phase 2 · Acceleration & max-V. Volume: 7/10. Intensity: 9/10. Key sessions: block starts + flying 20s.",
                color: "border-primary/30 bg-primary/5",
                dot: "bg-primary",
              },
              {
                delay: 0.19,
                stepNum: 3,
                label: "Last 3 Weeks",
                tag: "Auto-tracked",
                content: "Avg completion 88%. Fatigue trending up wk 6→7→8. Athlete B flagged hamstring tightness. Volume slightly high.",
                color: "border-amber-500/30 bg-amber-500/5",
                dot: "bg-amber-400",
              },
              {
                delay: 0.26,
                stepNum: 4,
                label: "AI Output",
                tag: "Informed by 1→2→3",
                content: "Volume reduced 15%. Block starts prioritised over volume runs. CNS recovery note auto-added to session.",
                color: "border-emerald-500/30 bg-emerald-500/5",
                dot: "bg-emerald-400",
              },
            ].map((m, idx, arr) => (
              <div key={m.label}>
                <motion.div
                  {...fadeUp(m.delay)}
                  className={`rounded-xl border p-4 ${m.color}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">{m.stepNum}</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                    <span className="text-xs font-heading font-semibold text-foreground">
                      {m.label}
                    </span>
                    <span className="ml-auto text-xs font-mono text-muted-foreground shrink-0">
                      {m.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed pl-4">
                    {m.content}
                  </p>
                </motion.div>
                {idx < arr.length - 1 && (
                  <div className="flex justify-center text-muted-foreground/40 text-sm">↓</div>
                )}
              </div>
            ))}
          </div>

          <motion.p
            {...fadeUp(0.3)}
            className="mt-4 text-xs text-center text-muted-foreground font-sans"
          >
            This chain feeds into every AI response automatically
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-md text-center">
          <motion.div {...fadeUp()}>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60 font-mono mb-6">
              <span>Season planning</span>
              <span className="text-border">·</span>
              <span>AI session generation</span>
              <span className="text-border">·</span>
              <span>Live athlete tracking</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Try it with one
              <br />
              <span className="text-primary">training block.</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              No commitment. Set up your season in 10 minutes.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center justify-center gap-2 w-full h-12 sm:h-14 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-5 text-xs text-muted-foreground font-sans">
              Want a walkthrough?{" "}
              <a href="mailto:hello@kasoku.run" className="text-primary underline underline-offset-2">
                Book a 15-min call
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <div className="h-10" />
    </div>
  )
}

/* ─── helpers ─── */

/** Tiny label showing which phase is currently active */
function PhaseLabel() {
  return (
    <p className="mt-1.5 text-[11px] font-mono text-primary">
      ↑ Currently in SPP Phase 2
    </p>
  )
}

/* ─── sub-components ─── */

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-muted-foreground font-body">
      <Icon className="w-3.5 h-3.5 text-primary" />
      {label}
    </div>
  )
}

function SessionBlock({
  label,
  items,
  accent,
}: {
  label: string
  items: { name: string; prescription: string }[]
  accent?: boolean
}) {
  return (
    <div className={`rounded-lg p-3 ${accent ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
      <p className={`text-xs font-heading font-bold tracking-wide mb-2 ${accent ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </p>
      <div className="space-y-1.5">
        {items.map(({ name, prescription }) => (
          <div key={name} className="flex items-start justify-between gap-2">
            <span className="text-xs text-foreground/80 font-sans">
              {name}
            </span>
            <span className="text-xs text-muted-foreground font-mono shrink-0 text-right">
              {prescription}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "on-track" | "flag" | "pb" }) {
  const map: Record<"on-track" | "flag" | "pb", { label: string; cls: string }> = {
    "on-track": { label: "On Track", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    flag: { label: "Flagged", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    pb: { label: "New PB", cls: "bg-primary/10 text-primary border-primary/20" },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${cls} shrink-0`}>
      {label}
    </span>
  )
}
