"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  Repeat2,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

const spring = { type: "spring" as const, stiffness: 170, damping: 26 }

/* ─── data ─── */

const painPoints = [
  {
    icon: FileSpreadsheet,
    label: "Spreadsheet chaos",
    detail: "Copy-pasting sessions across weeks, managing multiple tabs for athlete groups (LS/SS/MS/SH), version confusion",
  },
  {
    icon: Repeat2,
    label: "Duplication for every group",
    detail: "Same warm-up block repeated across columns — one typo means inconsistent prescriptions",
  },
  {
    icon: Clock,
    label: "No execution tracking",
    detail: "The plan says 2x60m @90% — did the athlete actually hit it? No way to know from a CSV",
  },
  {
    icon: Users,
    label: "No individual adaptation",
    detail: "When an athlete misses a session or needs modification, the spreadsheet doesn't adjust",
  },
]

const transformSteps = [
  {
    phase: "Before",
    icon: FileSpreadsheet,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    items: [
      "One giant CSV per season",
      "Copy-paste warm-ups across 5 columns",
      "Group prescriptions buried in free text",
      "No record of what actually happened",
      "Manual adjustments scattered in notes",
    ],
  },
  {
    phase: "After",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    items: [
      "Structured season → phase → week → session",
      "Shared warm-up blocks, group-specific main sets",
      "Per-athlete prescription with RPE, tempo, effort",
      "Every rep logged with completion tracking",
      "AI suggests adjustments based on actual data",
    ],
  },
]

const planningHierarchy = [
  {
    level: "Macrocycle",
    desc: "Full season plan anchored to competition dates",
    detail: "Nov 2023 → Aug 2024 season with race targets",
    icon: Calendar,
  },
  {
    level: "Mesocycle",
    desc: "Training phases with distinct focus",
    detail: "GPP → SPP → Pre-Comp → Competition → Taper",
    icon: Layers,
  },
  {
    level: "Microcycle",
    desc: "Weekly plan with volume & intensity controls",
    detail: "Volume: 7/10, Intensity: 6/10 — adjustable per week",
    icon: TrendingUp,
  },
  {
    level: "Session",
    desc: "Daily workout with full exercise prescription",
    detail: "Warm-up + Drills + Sprint Work + Cool Down",
    icon: Timer,
  },
]

const aiFeatures = [
  {
    icon: Brain,
    title: "Season Setup Interview",
    desc: "AI asks about your philosophy, competition calendar, athlete profiles — builds the season structure for you",
    tag: "Coach flow",
  },
  {
    icon: Sparkles,
    title: "Microcycle Generation",
    desc: "Generate a full week of sessions from phase goals, volume/intensity targets, and athlete group needs",
    tag: "AI generates",
  },
  {
    icon: MessageSquare,
    title: "Session Assistant",
    desc: "\"Add 3x60m @90% with 8min rest for short sprinters\" — AI proposes changes, you review and approve",
    tag: "Chat interface",
  },
  {
    icon: Shield,
    title: "Human in the Loop",
    desc: "Every AI change is a proposal. Nothing hits the database until the coach clicks approve.",
    tag: "You stay in control",
  },
]

const coachWorkflow = [
  { step: "1", title: "Tell AI your season goals", desc: "Competition dates, athlete groups, training philosophy" },
  { step: "2", title: "AI builds your season structure", desc: "Macrocycle with phases, volume/intensity curves" },
  { step: "3", title: "Generate weekly sessions", desc: "AI creates sessions per group — you review & tweak" },
  { step: "4", title: "Assign to athletes", desc: "Push plans to athlete groups, they see sessions on their phone" },
  { step: "5", title: "Athletes log workouts", desc: "Every rep tracked — RPE, tempo, completion status" },
  { step: "6", title: "AI weekly insights", desc: "Completion rates, suggested adjustments, red flags" },
]

/* ─── page ─── */

export default function DemoPage() {
  return (
    <div className="relative bg-background">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary blur-[120px] opacity-[0.07] -top-40 -right-20" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600 blur-[100px] opacity-[0.05] bottom-0 -left-20" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-sm font-medium text-muted-foreground font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                Coach Demo
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.2 }}
              className="mt-8 font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
            >
              From Spreadsheet
              <br />
              <span className="text-primary">to System</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.4 }}
              className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans"
            >
              Your training plans deserve more than a CSV.
              <br />
              Kasoku gives sprint coaches AI-powered periodization with full
              athlete tracking — without losing control.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="We know the spreadsheet struggle"
            subtitle="These problems compound across a full season"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            {painPoints.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-60px" }}
                transition={{ ...spring, delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-red-500/10 p-2.5 border border-red-500/20 shrink-0">
                    <p.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground">
                      {p.label}
                    </h3>
                    <p className="mt-2 text-muted-foreground text-sm leading-relaxed font-sans">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="The transformation"
            subtitle="Same coaching intent, dramatically better tooling"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
            {transformSteps.map((col, ci) => (
              <motion.div
                key={col.phase}
                initial={{ opacity: 0, x: ci === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-60px" }}
                transition={{ ...spring, delay: ci * 0.12 }}
                className={`rounded-2xl border p-8 ${col.bg}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <col.icon className={`w-6 h-6 ${col.color}`} />
                  <h3 className={`text-2xl font-heading font-bold ${col.color}`}>
                    {col.phase}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-foreground/80 font-sans">
                      <span className={`mt-1 ${col.color}`}>
                        {col.phase === "Before" ? (
                          <span className="block w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANNING HIERARCHY ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Structured like you think"
            subtitle="Season → Phase → Week → Session — the periodization hierarchy coaches already use"
          />
          <div className="mt-14 max-w-3xl mx-auto space-y-4">
            {planningHierarchy.map((item, i) => (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-40px" }}
                transition={{ ...spring, delay: i * 0.1 }}
                className="relative"
              >
                <div
                  className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                  style={{ marginLeft: `${i * 28}px` }}
                >
                  <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/20 shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        {item.level}
                      </h3>
                      <span className="text-sm text-muted-foreground font-sans">
                        {item.desc}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground/70 font-mono">
                      {item.detail}
                    </p>
                  </div>
                </div>
                {i < planningHierarchy.length - 1 && (
                  <div
                    className="absolute w-px h-4 bg-border/50"
                    style={{ left: `${(i + 1) * 28 + 32}px`, bottom: "-16px" }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="AI that respects your expertise"
            subtitle="The AI proposes. You decide. Nothing happens without your approval."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            {aiFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-60px" }}
                transition={{ ...spring, delay: i * 0.08 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/20">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-surface px-2 py-1 rounded-md border border-border/50">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-sans">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACH WORKFLOW ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Your workflow in Kasoku"
            subtitle="From season planning to weekly insights — end to end"
          />
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40" />

              <div className="space-y-8">
                {coachWorkflow.map((s, i) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ margin: "-40px" }}
                    transition={{ ...spring, delay: i * 0.08 }}
                    className="relative flex items-start gap-5 pl-0"
                  >
                    <div className="relative z-10 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-heading font-bold text-primary">
                        {s.step}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground font-sans">
                        {s.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPEAKING HIS LANGUAGE ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Built for sprint coaches"
            subtitle="Not a generic fitness app — built for track & field periodization"
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Event group differentiation", detail: "LS / SS / MS / SH — prescribe per group within one session" },
              { label: "Sprint-specific metrics", detail: "Splits, reaction time, velocity curves, wind-legal PB detection" },
              { label: "Intensity prescriptions", detail: "Percentage-based effort (@80%, @90%), RPE, tempo notation" },
              { label: "Rest protocols", detail: "Walk-back recovery, timed rest, HR-based recovery thresholds" },
              { label: "Drill library", detail: "A-skips, B-skips, wickets, block starts — all in the exercise database" },
              { label: "Competition anchoring", detail: "Season plan built backwards from target race dates" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ margin: "-40px" }}
                transition={{ ...spring, delay: i * 0.06 }}
                className="p-5 rounded-xl border border-border bg-card"
              >
                <h4 className="text-sm font-heading font-semibold text-foreground mb-1">
                  {item.label}
                </h4>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CSV COMPARISON ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Your CSV, reimagined"
            subtitle="Here's what one of your sessions looks like in Kasoku"
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* CSV side */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-60px" }}
              transition={spring}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-4 h-4 text-red-400" />
                <span className="text-sm font-mono text-red-400">
                  Training Plan 2023-24.csv
                </span>
              </div>
              <pre className="text-xs text-foreground/60 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
{`WU
10 x 100m tempo run
5x4 x long arm swing
3x20m steps zero step
3 x 20m Normal A-skip
3 x 30m normal B-Skips
2 x 30m one leg 1-2-3-cycle
3 x 30m dribbling
3x20m ankling

Static Stretching 15'
Dynamic Stretching 15'

SS/MS: CSD @80% 2x20m, 2x30m,
  2x40m [wk back]
  rest 10'
  2x50m, 2x60m, 2x80m @80%

SH: CSD 2x1h, 2x3h, 2x5h,
  2x7h+30m

LS: 15 x 200m M:36", F:39"
  [90 jog]`}
              </pre>
            </motion.div>

            {/* Kasoku side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-60px" }}
              transition={spring}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-primary">
                  Kasoku Session View
                </span>
              </div>
              <div className="space-y-3">
                {/* Warm-up section */}
                <div className="rounded-lg bg-card border border-border p-3">
                  <div className="text-xs font-heading font-semibold text-primary mb-2">
                    WARM-UP
                  </div>
                  <div className="space-y-1 text-xs text-foreground/70 font-sans">
                    <div className="flex justify-between">
                      <span>Tempo Run</span>
                      <span className="text-muted-foreground">10 x 100m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Long Arm Swing</span>
                      <span className="text-muted-foreground">5 x 4 reps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A-Skip</span>
                      <span className="text-muted-foreground">3 x 20m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>B-Skip</span>
                      <span className="text-muted-foreground">3 x 30m</span>
                    </div>
                  </div>
                </div>
                {/* Main set — SS/MS */}
                <div className="rounded-lg bg-card border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-heading font-semibold text-primary">
                      MAIN SET
                    </div>
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      SS / MS
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-foreground/70 font-sans">
                    <div className="flex justify-between">
                      <span>Crouching Start Drive</span>
                      <span className="text-muted-foreground">2x20m, 2x30m, 2x40m @80%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed Work</span>
                      <span className="text-muted-foreground">2x50m, 2x60m, 2x80m @80%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1">
                      Rest: walk-back + 10min between blocks
                    </div>
                  </div>
                </div>
                {/* Tracking indicator */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-500 font-sans">
                    Every set logged with completion, RPE, actual times
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── QUESTIONS TO DISCUSS ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SectionHeader
              title="What we'd love your feedback on"
              subtitle="We're building this for coaches like you — your input shapes the product"
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-60px" }}
              transition={spring}
              className="mt-14 space-y-4"
            >
              {[
                "Does the Season → Phase → Week → Session hierarchy match how you think about planning?",
                "When you differentiate LS/SS/MS/SH groups — what does that workflow actually look like day-to-day?",
                "What's the single most painful thing about managing training plans in spreadsheets?",
                "Would you trust AI to draft a week's sessions if you could review and edit everything before it goes live?",
                "How do you currently track what athletes actually did vs. what was prescribed?",
              ].map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
                >
                  <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center shrink-0">
                    <span className="text-xs font-heading font-bold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-foreground font-sans pt-1">{q}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-60px" }}
            transition={spring}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              Ready to try it with
              <br />
              <span className="text-primary">one training block?</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground font-sans">
              Import your next mesocycle. See how it feels. No commitment.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground font-body font-medium text-base hover:opacity-90 transition-opacity"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* bottom spacing */}
      <div className="h-16" />
    </div>
  )
}

/* ─── shared section header ─── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={spring}
        className="font-heading text-4xl sm:text-5xl font-semibold text-foreground tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.08 }}
        className="mt-5 text-xl text-muted-foreground font-sans"
      >
        {subtitle}
      </motion.p>
    </div>
  )
}
