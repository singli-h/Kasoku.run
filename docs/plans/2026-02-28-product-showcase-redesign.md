# Product Showcase Redesign: "Meet Your AI Training Partner"

## Overview

Replace the current phone-mockup product showcase with a scroll-driven sequential narrative that renders actual app components directly on the page (no device frames). AI is the protagonist. The narrative follows the coach-to-athlete value loop while emphasizing AI assistant + memory features.

## Architecture

- **Component**: `ProductShowcase` in `apps/web/components/features/landing/product-showcase.tsx` (full rewrite)
- **Pattern**: Sticky scroll with `useScroll` + `useTransform` (Framer Motion v12)
- **Height**: ~600vh container, sticky inner at `top: 10vh`, `h: 80vh`
- **Layout**: Left text panel + right component panel (stacks on mobile)
- **Transitions**: `opacity` + `y` + `scale` per step (not opacity-only like current)
- **Progress**: Vertical dot indicator (5 dots, active glows indigo)

## The 5 Steps

### Step 1: "Describe your goals. AI builds the plan."
- **Text**: Conversational plan generation — zero to periodized program in one conversation
- **Panel**: Chat interface showing coach message + AI response with plan summary. Below: PlanApprovalBar with stats (12 weeks, 4 sessions/week, 48 exercises) and glowing "Apply Plan" button
- **Scroll range**: 0% – 20%

### Step 2: "AI remembers everything about your athletes."
- **Text**: Memory system — injuries, preferences, training philosophy, session history
- **Panel**: 4 memory cards in a 2x2 grid:
  - Injury: "Left knee ACL rehab — avoid deep squats, heavy lunges"
  - Preference: "Prefers dumbbells over barbells for pressing"
  - Philosophy: "RPE-based progression, no percentage work"
  - Session: "Last session: avg RPE 8.2, 95% completion, PR on back squat"
- **Scroll range**: 20% – 40%

### Step 3: "Your training plan, built intelligently."
- **Text**: AI-assisted session planning with multi-level context awareness
- **Panel**: Desktop-width showing:
  - MacrocycleTimeline strip (colored phase blocks: GPP → SPP → Taper → Comp)
  - Session card grid (3 sessions) with exercise names
  - InlineProposalSection bar: "3 changes | +2 exercises, 1 update" with [Apply]
  - AIContextIndicator badge: "Block scope — AI sees your entire program"
- **Scroll range**: 40% – 60%

### Step 4: "Real-time coaching during every workout."
- **Text**: Mid-workout AI assistance — adapts on the fly
- **Panel**: Workout view showing:
  - ExerciseCard "Back Squat" with 3 SetRows (reps, weight, RPE)
  - GhostSetRow with dashed green border: "NEW — Set 4: 5 × 130kg RPE 7"
  - Chat overlay: Athlete "Squat rack is taken" → AI "Swapping to Leg Press"
  - Blue swap arrow indicator
- **Scroll range**: 60% – 80%

### Step 5: "Every session makes AI smarter."
- **Text**: Feedback loop — the more you train, the smarter it gets
- **Panel**: Analytics view showing:
  - WorkoutConsistencyHeatmap (GitHub-style, 8 weeks)
  - Quick stat cards (Best Time, Weekly Volume, PRs)
  - New memory card animating in: "Average RPE trending up, consider deload"
- **Scroll range**: 80% – 100%

## Visual Treatment

- Component panels: `bg-surface border border-border/30 rounded-2xl shadow-2xl shadow-black/20`
- AI-active elements: `border-primary/30 shadow-primary/20` indigo glow
- No device frames — panels float directly on dark background
- Subtle radial gradient behind each panel, fades in with step
- Mobile: vertical stack, text above component, panels at ~95vw

## Scroll Animation Specs

```
Each step i (0-4):
  start = i * 0.2
  enter = start + 0.05
  hold  = start + 0.15
  exit  = start + 0.2

  opacity: [start: 0, enter: 1, hold: 1, exit: 0]
  y:       [start: 40, enter: 0, hold: 0, exit: -40]
  scale:   [start: 0.95, enter: 1, hold: 1, exit: 0.98]

  Exception: Step 5 (last) stays visible — no exit fade
```

## Progress Indicator

5 dots, fixed left edge of sticky container. Active dot:
- Scale 1.5x
- Indigo glow: `shadow-[0_0_12px_hsl(var(--primary)/0.6)]`
- Connected by a thin line that fills as scroll progresses

## Tech Constraints

- Framer Motion v12 only (no GSAP)
- Lenis smooth scroll already active on marketing layout
- Tailwind CSS for all styling
- `prefers-reduced-motion` support via `useReducedMotion()`
- GPU-friendly: transform + opacity only, no layout-triggering properties
- Icons: lucide-react (already installed)
