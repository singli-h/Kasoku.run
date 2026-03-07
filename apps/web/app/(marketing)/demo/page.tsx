"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react"

const spring = { type: "spring" as const, stiffness: 170, damping: 26 }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { margin: "-40px" as const },
  transition: { ...spring, delay },
})

/* ─── page ─── */

export default function DemoPage() {
  return (
    <div className="bg-background">

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[85vh] flex flex-col items-center justify-center pt-20 pb-12 px-4 text-center">
        {/* ambient */}
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
            Coach Demo · Kasoku
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="relative z-10 mt-12 flex flex-col items-center gap-1 text-muted-foreground/50"
        >
          <span className="text-[11px] font-mono tracking-widest uppercase">scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          AI CHAT DEMO
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
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

          {/* ── Chat window ── */}
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

                  {/* Generated session card */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-heading font-bold text-foreground">
                          Tuesday — Short Sprinters (SS)
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          SPP Phase · High Intensity · ~90 min
                        </p>
                      </div>
                      <span className="text-[11px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        AI Draft
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Warm-up */}
                      <SessionBlock
                        label="WARM-UP"
                        items={[
                          { name: "Tempo Run", prescription: "10 × 100m" },
                          { name: "A-Skip", prescription: "3 × 20m" },
                          { name: "B-Skip", prescription: "3 × 30m" },
                          { name: "Strides zero step", prescription: "3 × 30m" },
                        ]}
                      />
                      {/* Main set */}
                      <SessionBlock
                        label="ACCELERATION BLOCK"
                        accent
                        items={[
                          { name: "Block Starts", prescription: "6 × 30m @95% [full rec]" },
                          { name: "Flying 20s", prescription: "4 × 20m @100% [8 min]" },
                          { name: "CSD", prescription: "2×40m, 2×60m @90% [10 min]" },
                        ]}
                      />
                      {/* AI note */}
                      <div className="rounded-lg bg-surface border border-border/60 px-3 py-2 flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                          High CNS demand — volume reduced 15% vs last week given recent fatigue trend. Monitor closely.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-primary/10 flex items-center gap-2">
                      <button type="button" className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button type="button" className="h-8 px-3 rounded-lg bg-surface border border-border text-xs font-sans text-muted-foreground">
                        Edit
                      </button>
                      <button type="button" className="h-8 px-3 rounded-lg bg-surface border border-border text-xs font-sans text-muted-foreground">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* input bar */}
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
          AI MEMORY
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
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

          {/* Memory chain */}
          <div className="mt-8 space-y-3">
            {[
              {
                delay: 0.05,
                label: "Season Context",
                tag: "Set once",
                content: "Peak for HK Open Feb 2025. SS group: 4 athletes targeting sub-10.8. Philosophy: max velocity focus in SPP.",
                color: "border-indigo-500/30 bg-indigo-500/5",
                dot: "bg-indigo-400",
              },
              {
                delay: 0.12,
                label: "Phase Goals",
                tag: "Per mesocycle",
                content: "SPP Phase 2 · Acceleration & max-V. Volume: 7/10. Intensity: 9/10. Key sessions: block starts + flying 20s.",
                color: "border-primary/30 bg-primary/5",
                dot: "bg-primary",
              },
              {
                delay: 0.19,
                label: "Last 3 Weeks",
                tag: "Auto-generated insights",
                content: "Avg completion 88%. Fatigue trending up wk 6→7→8. Wong Ka Wai flagged hamstring tightness. Volume slightly high.",
                color: "border-amber-500/30 bg-amber-500/5",
                dot: "bg-amber-400",
              },
              {
                delay: 0.26,
                label: "AI Suggestion",
                tag: "Today",
                content: "Volume reduced 15%. Block starts prioritised over volume runs. CNS recovery note auto-added.",
                color: "border-emerald-500/30 bg-emerald-500/5",
                dot: "bg-emerald-400",
              },
            ].map((m) => (
              <motion.div
                key={m.label}
                {...fadeUp(m.delay)}
                className={`rounded-xl border p-4 ${m.color}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span className="text-xs font-heading font-semibold text-foreground">
                    {m.label}
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                    {m.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed pl-4">
                  {m.content}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...fadeUp(0.3)}
            className="mt-4 text-xs text-center text-muted-foreground/60 font-mono"
          >
            This chain feeds into every AI response automatically
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          KNOWLEDGE BASE
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">

          <motion.div {...fadeUp()}>
            <SectionLabel icon={BookOpen} label="Knowledge Base" />
            <h2 className="mt-4 font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Your coaching library.
              <br />
              On their phone.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans">
              Write once. Your athletes access drill guides, race strategies,
              and mindset notes anytime. The AI reads it too — so your philosophy
              shapes every generated session.
            </p>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-4">

            {/* Coach side */}
            <motion.div {...fadeUp(0.08)} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
                <span className="text-xs font-heading font-semibold text-foreground">
                  Coach — Knowledge Base
                </span>
                <button className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  + New Article
                </button>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { title: "Block Start Progressions", tag: "Drills", reads: "12 reads" },
                  { title: "Race-Day Mental Prep", tag: "Mindset", reads: "8 reads" },
                  { title: "SPP Phase Philosophy", tag: "Training", reads: "15 reads" },
                ].map((article) => (
                  <div
                    key={article.title}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-heading font-semibold text-foreground truncate">
                        {article.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {article.tag} · {article.reads}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground -rotate-90" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI uses it */}
            <motion.div
              {...fadeUp(0.13)}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
            >
              <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-heading font-semibold text-foreground mb-1">
                  AI reads your articles too
                </p>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  When generating sessions, the AI references your coaching
                  philosophy and drill library — so output aligns with how you
                  actually coach, not a generic template.
                </p>
              </div>
            </motion.div>

            {/* Athlete side */}
            <motion.div {...fadeUp(0.18)} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface">
                <span className="text-xs font-heading font-semibold text-foreground">
                  Athlete — Resources Tab
                </span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { title: "Block Start Progressions", tag: "Drill Guide", new: true },
                  { title: "Race-Day Mental Prep", tag: "Mindset" },
                ].map((article) => (
                  <div
                    key={article.title}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                  >
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-heading font-semibold text-foreground truncate">
                          {article.title}
                        </p>
                        {article.new && (
                          <span className="text-[9px] font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {article.tag} · From Coach
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
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

          <div className="mt-8 space-y-3">
            {(
              [
                {
                  delay: 0.06,
                  name: "Athlete A",
                  group: "SS · Week 8",
                  completion: 92,
                  rpe: "8.2",
                  note: "All sets completed. Felt strong off the blocks.",
                  status: "on-track" as const,
                },
                {
                  delay: 0.12,
                  name: "Athlete B",
                  group: "SS · Week 8",
                  completion: 67,
                  rpe: "9.1",
                  note: "Skipped flying 20s — hamstring tightness mid-session.",
                  status: "flag" as const,
                },
                {
                  delay: 0.18,
                  name: "Athlete C",
                  group: "SS · Week 8",
                  completion: 100,
                  rpe: "7.8",
                  note: "PB on flying 20m split. Ready for next progression.",
                  status: "pb" as const,
                },
              ] satisfies {
                delay: number
                name: string
                group: string
                completion: number
                rpe: string
                note: string
                status: "on-track" | "flag" | "pb"
              }[]
            ).map((athlete) => (
              <motion.div
                key={athlete.name}
                {...fadeUp(athlete.delay)}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground">
                      {athlete.name}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {athlete.group}
                    </p>
                  </div>
                  <StatusBadge status={athlete.status} />
                </div>

                {/* Completion bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${athlete.completion}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {athlete.completion}% done
                  </span>
                </div>

                <div className="mt-2.5 flex items-start gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                    RPE {athlete.rpe}
                  </span>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {athlete.note}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Weekly insights callout */}
          <motion.div
            {...fadeUp(0.25)}
            className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
          >
            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-heading font-semibold text-foreground mb-1">
                AI Weekly Insights — auto-generated every Sunday
              </p>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Completion rates, flagged athletes, suggested adjustments for next week.
                The AI writes the weekly brief so you don't have to.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA
      ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20 bg-surface/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-sm text-center">
          <motion.div {...fadeUp()}>
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
          </motion.div>
        </div>
      </section>

      <div className="h-10" />
    </div>
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
      <p className={`text-[11px] font-heading font-bold tracking-wide mb-2 ${accent ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </p>
      <div className="space-y-1.5">
        {items.map(({ name, prescription }) => (
          <div key={name} className="flex items-start justify-between gap-2">
            <span className="text-xs text-foreground/80 font-sans">
              {name}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono shrink-0 text-right">
              {prescription}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "on-track" | "flag" | "pb" }) {
  const map: Record<string, { label: string; cls: string }> = {
    "on-track": { label: "On Track", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    flag: { label: "Flagged", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    pb: { label: "New PB", cls: "bg-primary/10 text-primary border-primary/20" },
  }
  const { label, cls } = map[status] ?? map["on-track"]
  return (
    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${cls} shrink-0`}>
      {label}
    </span>
  )
}
