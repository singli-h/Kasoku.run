# Kasoku.run Landing Page Redesign — Design Document

**Date:** 2026-02-28
**Direction:** Kinetic Minimalism with Electric Indigo
**Implementation tool:** Google Antigravity IDE
**Status:** Approved for implementation

---

## 1. Brand Foundation

**Brand name:** Kasoku (加速) — Japanese for "acceleration"
**Core concept:** Acceleration is not speed. It's the *change* in speed. The buildup. The transition from potential to kinetic. Every design decision should evoke this tension and release.

**Brand personality:** Precise. Confident. Forward-moving. A coach who speaks quietly but commands the room.

**Target audience:**
- Athletes (track & field primarily, expanding to general sport) tracking performance and progression
- Coaches building periodized training plans and managing athletes

**Positioning:** The premium training platform that treats periodization as both science and craft.

---

## 2. Color System — Electric Indigo

### Philosophy

Monochrome base with Electric Indigo as the singular accent. Color is a scalpel, not a paintbrush. The less you use it, the more it means.

**Why indigo:** Zero competitors in sports tech use it. Conveys both energy (violet = highest frequency visible light) and trust (blue family). In physics, objects accelerating toward you appear blue/violet-shifted — a direct metaphor for the brand name.

### Palette

#### Core Tokens

| Role | Dark Mode | Light Mode | Usage |
|------|-----------|------------|-------|
| `--bg` | `#09090B` (near-black) | `#FAFAFA` (off-white) | Page canvas |
| `--surface` | `#18181B` | `#FFFFFF` | Cards, elevated elements |
| `--surface-hover` | `#27272A` | `#F4F4F5` | Card hover states |
| `--text-primary` | `#FAFAFA` | `#09090B` | Headlines, body text |
| `--text-secondary` | `#A1A1AA` | `#71717A` | Captions, metadata |
| `--text-tertiary` | `#52525B` | `#A1A1AA` | Placeholder, disabled |
| `--border` | `#27272A` | `#E4E4E7` | Dividers, card edges |
| `--border-hover` | `#3F3F46` | `#D4D4D8` | Interactive borders |

#### Brand Accent — Electric Indigo

Explore the indigo spectrum between these bounds. Pick the shade that feels most alive on the dark background:

| Shade | Hex | Character |
|-------|-----|-----------|
| Vibrant (lighter) | `#818CF8` | Glowing, electric, attention-grabbing |
| Core | `#6366F1` | Balanced energy and professionalism |
| Deep (darker) | `#4F46E5` | Authoritative, premium, Linear-esque |

**Indigo usage rules:**
- Max 10-15% of any screen surface
- Primary use: interactive elements (links, active states, focus rings, key highlights)
- Secondary use: subtle glows, border accents on hover, badges
- NEVER as a background fill for large sections
- NEVER as body text color

#### CTA Accent — Warm Rose/Coral

| Shade | Hex | Usage |
|-------|-----|-------|
| Rose | `#F43F5E` | Primary action buttons (Sign Up, Get Started) |
| Rose hover | `#E11D48` | Button hover state |

**Why rose:** Creates warm/cool tension with indigo. The contrast draws the eye to CTAs immediately. Rose = urgency, energy, action — complementary to indigo's cool precision.

**Rose usage rules:**
- ONLY on primary CTA buttons and their immediate hover/active states
- Never on non-CTA elements
- Maximum 2-3 rose-colored elements visible at any time

#### Color Rules (Hard Constraints)

1. No gradients on section backgrounds
2. No orange anywhere (old brand — kill it completely)
3. No blue-purple gradient backgrounds (AI slop signature)
4. Dark mode is the hero experience. Design dark-first, adapt to light.
5. Borders are always subtle — 1px, low opacity
6. Glows (if used) are always indigo, always subtle (`box-shadow` with 0.1-0.2 opacity)

---

## 3. Typography

### Fonts (already loaded in the project)

| Role | Font | Weight Range | Usage |
|------|------|-------------|-------|
| **Headlines** | Syne | 600-800 | H1, H2, section titles, hero text |
| **Body** | Inter | 400-600 | Paragraphs, descriptions, UI text |
| **Navigation/UI** | Outfit | 400-600 | Nav links, badges, metadata, buttons |

### Type Scale (Landing Page)

| Element | Size | Font | Weight | Tracking | Line Height |
|---------|------|------|--------|----------|-------------|
| Hero headline | 72-96px (clamp responsive) | Syne | 700-800 | -0.02em | 1.0-1.1 |
| Section headline | 48-56px | Syne | 600-700 | -0.01em | 1.1-1.2 |
| Section subhead | 20-24px | Inter | 400 | 0 | 1.5 |
| Body text | 18-20px | Inter | 400 | 0 | 1.6-1.7 |
| Card title | 20-24px | Syne | 600 | -0.01em | 1.3 |
| Card description | 16px | Inter | 400 | 0 | 1.6 |
| Button text | 16px | Outfit | 500-600 | 0.01em | 1.0 |
| Badge/tag | 13-14px | Outfit | 500 | 0.02em | 1.0 |
| Caption/meta | 14px | Inter | 400 | 0 | 1.4 |

### Typography Rules

1. Hero headline should be **large enough to be the primary visual element**. Typography IS the design.
2. Generous whitespace around all text blocks — min 64px vertical spacing between sections
3. Max line width for body text: 680px (optimal readability)
4. No decorative fonts, no script fonts, no novelty typefaces
5. Capitalize only the first word of headlines (sentence case), never ALL CAPS except for small badges/tags

---

## 4. Animation Strategy

### Library Stack

| Library | Purpose | Notes |
|---------|---------|-------|
| **Framer Motion v12** | Component animations, gestures, layout | Already installed |
| **Lenis** | Smooth scroll | Install: `npm install lenis` |
| **CSS scroll-timeline** | Scroll-linked animations (progressive enhancement) | Native CSS, no library needed |

### Animation Philosophy

**Motion tells the story of acceleration.** Things start slow, build momentum, then settle with a slight overshoot (spring physics). Every animation should feel physical, not mathematical.

**Spring physics over easing curves.** Use `type: "spring"` with `stiffness` and `damping` instead of `ease-in-out`. Linear easing is banned. `ease-in-out` is banned. Everything bounces, settles, has weight.

### Animation Specifications

#### Page Load Sequence (Hero)

```
t=0ms     Background subtle fade in
t=200ms   Badge slides down from y:-20, opacity 0→1 (spring)
t=400ms   Headline word 1 animates in (y:24→0, opacity, spring stiffness:100 damping:15)
t=500ms   Headline word 2 animates in (stagger 100ms)
t=600ms   Headline word 3 animates in (stagger 100ms)
t=800ms   Subtitle fades in (opacity + slight blur 4px→0)
t=1000ms  CTA buttons slide up (y:16→0, opacity, spring)
t=1200ms  Trust strip / social proof fades in
```

#### Scroll-Linked Animations

| Element | Behavior | Implementation |
|---------|----------|----------------|
| Hero content | Parallax — moves up at 0.5x scroll speed, opacity fades to 0 | `useScroll` + `useTransform` |
| Section entries | Scale 0.96→1.0 + opacity as they enter viewport | `whileInView` with spring |
| Product mockup | Transforms/rotates subtly with scroll progress | `useScroll` on container + 3D transforms |
| Feature cards | Stagger in from bottom, 80ms delay between each | `whileInView` with stagger |
| Stats/numbers | Count up from 0 to target value with spring easing | Custom spring counter on `whileInView` |

#### Micro-Interactions

| Element | Behavior |
|---------|----------|
| CTA buttons | Magnetic pull effect — button subtly moves toward cursor within 100px radius. Scale 1.02 on hover. |
| Cards | Subtle tilt toward cursor (3D perspective transform, max 3deg). Border color transitions to indigo on hover. |
| Navigation links | Underline slides in from left on hover (width animation, not text-decoration) |
| FAQ accordion | Height animates with spring physics. Chevron rotates 180deg with spring. |
| Logo | Subtle scale pulse on page load (1.0 → 1.05 → 1.0, once) |

#### Animation Rules (Hard Constraints)

1. **`viewport: { once: true }` is BANNED** except for stat counters. Sections should re-animate when scrolled back into view — the page should feel alive.
2. **No animation duration > 1.5s** for any single element
3. **All animations must be interruptible** — if user scrolls past, animation completes quickly, doesn't block
4. **Respect `prefers-reduced-motion`** — provide a `useReducedMotion()` check that disables all spring/parallax animations, keeps only opacity fades
5. **60fps or nothing** — use `transform` and `opacity` only. No animating `width`, `height`, `margin`, `padding`, or `top/left`
6. **Stagger delays max 80ms between items** — longer feels sluggish

---

## 5. Page Structure

### Layout Architecture

The page is a vertical scroll of full-width sections. Each section has generous vertical padding (120-160px on desktop, 80px on mobile). Content is centered with max-width 1200px.

### Section-by-Section Specification

---

#### 5.1 HEADER (Sticky Navigation)

**Behavior:** Fixed at top. Starts transparent over hero. After 50px scroll: background becomes `--surface` with backdrop-blur-xl and subtle bottom border.

**Layout:**
```
[Logo: Syne "Kasoku" + subtle icon]  ·····  [Features] [Pricing] [FAQ]  ·····  [Sign In] [Get Started →]
```

- Logo: "Kasoku" in Syne Bold, no icon or a very minimal abstract mark
- Nav links: Outfit 500, text-secondary color, indigo on hover
- "Get Started" button: Rose/coral filled, small, rounded
- Mobile: Hamburger → slide-down menu with spring animation

---

#### 5.2 HERO (100vh)

**This is the most important section. It must be distinctive, not template-y.**

**Layout:**
```
                    [small badge with subtle glow]
                    "Beta · Track & Field"

                    Accelerate
                    Your Training          ← 80-96px Syne Bold, center-aligned

                    Periodization that adapts to your athletes.
                    Built for coaches who demand precision.    ← 20px Inter, text-secondary

                    [Get Started Free]  [See How It Works]
                      ↑ rose filled       ↑ ghost/outline

              ─── visual element zone (see below) ───
```

**Visual element (CREATIVE FREEDOM — use Nano Banana Pro):**

Generate an abstract, minimal illustration for the hero background or below the CTAs. Guidelines:
- **Theme:** Abstract representation of acceleration, motion, forward momentum
- **Style:** Clean lines, geometric, minimal. Think abstract track lanes curving into the distance, or motion trails dissolving into particles, or a minimal silhouette of a runner mid-stride breaking into geometric fragments
- **Colors:** Monochrome (white/gray on dark) with subtle indigo accent on 1-2 elements
- **Density:** Sparse. This is NOT a busy illustration. 70%+ of the space should be empty/dark
- **Format:** SVG preferred (scalable, animatable). PNG acceptable for complex imagery.
- **DO NOT generate:** Realistic photography, stock-photo-style athletes, detailed human faces, anything that looks like a stock illustration, anything with bright multi-color palettes

The illustration should feel like it belongs on a Dieter Rams product, not a Dribbble shot.

**Background:** Pure `--bg` color. No dot grids, no gradient overlays, no particles. The visual element provides the interest.

---

#### 5.3 SOCIAL PROOF / TRUST STRIP

**Layout:** Horizontal strip below hero. Centered. Minimal.

```
"Trusted by 500+ athletes and coaches"    or    [stat] [stat] [stat] [stat]
```

If using stats:
```
500+          12K+           98%            4.8★
Athletes      Sessions       Completion     Rating
              Tracked        Rate
```

- Numbers animate (count up with spring) on first view
- Text-secondary color, small type (14px Outfit)
- Separated by subtle vertical dividers or generous spacing

---

#### 5.4 PRODUCT SHOWCASE (Scroll-Linked)

**This section shows the actual product. Critical for credibility.**

**Layout concept:** A device mockup (laptop or phone, or both) centered on screen. As the user scrolls, the screen content within the mockup transitions between 3-4 key features:

```
Scroll 0-25%:   Dashboard overview (athlete's view)
Scroll 25-50%:  Training plan builder (coach's view)
Scroll 50-75%:  Workout tracking (athlete's view)
Scroll 75-100%: Progress analytics (shared view)
```

Each transition: the device stays fixed (sticky positioning), the inner screen content cross-fades or slides, and a text label beside or below the device fades to describe the current feature.

**Visual:**
- Device frame: minimal, dark, rounded corners. Not a detailed photorealistic mockup.
- Screen content: actual app screenshots OR high-fidelity mockups generated via Nano Banana
- Subtle shadow beneath device (indigo-tinted, very low opacity)
- Device has a subtle 3D rotation on scroll (rotateY -5deg → 0deg → 5deg)

**If screenshots aren't ready:** Generate realistic app UI mockups with Nano Banana that match the actual product's data domain (training plans, workout logs, athlete stats). Dark UI with indigo accents.

---

#### 5.5 FEATURES (Grid)

**Layout:** Section header (left-aligned or centered) + 3-column grid of 6 feature cards.

**Section header:**
```
What makes Kasoku different      ← 48px Syne Semibold
A training platform built by coaches,     ← 18px Inter, text-secondary
for coaches and their athletes.
```

**Feature cards:**
- Dark surface background (`--surface`) with subtle 1px border
- Icon at top (Lucide icon, 24px, indigo color)
- Title (20px Syne 600)
- Description (16px Inter 400, text-secondary)
- On hover: border transitions to indigo, subtle scale 1.01, card lifts with shadow

**Suggested features (adapt from existing content):**
1. AI-Powered Periodization
2. Real-Time Workout Tracking
3. Coach-Athlete Sync
4. Progress Analytics
5. Session Planning
6. Personal Best Tracking

**Animation:** Cards stagger in (80ms delay each) with scale 0.96→1 + opacity on scroll.

---

#### 5.6 AUDIENCE SPLIT — "For Athletes" / "For Coaches"

**Purpose:** Speak directly to each audience segment. Show them this product understands their specific needs.

**Layout concept:** Two panels side by side on desktop, stacked on mobile. User can toggle or both are visible.

**Option A — Side by Side:**
```
┌─────────────────────┐ ┌─────────────────────┐
│   For Athletes      │ │   For Coaches       │
│                     │ │                     │
│ · Track every rep   │ │ · Build periodized  │
│ · See your progress │ │   plans visually    │
│ · Beat your PBs    │ │ · Monitor all your  │
│ · AI suggestions    │ │   athletes at once  │
│                     │ │ · Data-driven       │
│ [illustration]      │ │   decisions         │
│                     │ │ [illustration]      │
└─────────────────────┘ └─────────────────────┘
```

**Option B — Tab Switch:**
Tabs at the top ("I'm an Athlete" / "I'm a Coach"), content cross-fades below. More engaging, less content visible at once.

**Illustrations (CREATIVE FREEDOM — Nano Banana):**
- For Athletes: Abstract figure in motion, geometric/minimal, monochrome + indigo accent
- For Coaches: Abstract visualization of a training plan/calendar/graph, geometric/minimal

---

#### 5.7 PRICING (Optional — include if ready)

**Layout:** 2-3 tier cards, centered. Clean, no gradient backgrounds on cards.

- Free tier: ghost/outline card
- Pro tier: solid surface card with indigo border (highlighted)
- Enterprise/Elite: ghost/outline card

Use existing pricing data from the codebase. Update styling to match new design system.

---

#### 5.8 FAQ

**Layout:** Centered, max-width 768px. Simple accordion.

- Question: 18px Syne 600
- Answer: 16px Inter 400, text-secondary
- Chevron icon rotates on open (spring animation)
- Answer height animates with spring physics (no CSS `max-height` hack)
- Subtle divider between items

---

#### 5.9 FINAL CTA

**Layout:** Full-width section with inverted colors (light text on dark, or dark text on very subtle indigo-tinted background).

```
                    Ready to accelerate?         ← 48-56px Syne Bold

                    Start building smarter training plans today.  ← 20px Inter

                    [Get Started Free]            ← Rose CTA, large
```

**Background (CREATIVE FREEDOM):**
- Option A: Pure `--bg` with a subtle abstract element (reuse hero illustration, smaller)
- Option B: Very subtle radial gradient with faint indigo tint at center (2-3% opacity difference)
- Option C: Nano Banana generated abstract — minimal, dark, atmospheric

---

#### 5.10 FOOTER

**Layout:** Minimal. Two rows.

```
Row 1: [Logo "Kasoku"]  ·····  [Features] [Pricing] [FAQ] [Blog] [Changelog]
Row 2: © 2026 Kasoku.run  ····  [Privacy] [Terms]  ····  [Twitter] [GitHub]
```

- Small type (14px Outfit), text-tertiary color
- No elaborate footer. This is a focused product, not a media company.

---

## 6. Visual Asset Generation Guide (For Nano Banana Pro)

### Asset 1: Hero Illustration

**Prompt direction:**
"Abstract minimal illustration representing acceleration and forward momentum. Clean geometric lines suggesting track lanes curving into perspective or a minimal figure in motion dissolving into particles. Monochrome palette (white and light gray on transparent/dark background) with one accent element in electric indigo (#6366F1). Extremely sparse composition — 70%+ empty space. SVG-style clean edges. No realistic photography. No stock illustration style. Inspired by Dieter Rams, Apple product marketing, and Japanese minimalist design."

### Asset 2: Athlete Section Illustration

**Prompt direction:**
"Abstract geometric representation of an athlete in motion. Minimal lines suggesting a runner's form — not a detailed figure, more like 5-10 lines capturing the essence of a stride. Monochrome with subtle indigo accent. Clean, architectural quality. Think Otl Aicher's Munich 1972 Olympics pictograms but more abstract and fewer lines."

### Asset 3: Coach Section Illustration

**Prompt direction:**
"Abstract geometric representation of a training plan or data visualization. Minimal lines suggesting a timeline, progress chart, or periodization blocks arranged rhythmically. Monochrome with subtle indigo accent. Should feel analytical and strategic, like looking at a battle plan from above."

### Asset 4: App UI Mockups (if real screenshots unavailable)

**Prompt direction:**
"High-fidelity mobile app screenshot mockup showing a sports training dashboard. Dark UI theme (#09090B background, #18181B cards). Data displays showing: weekly training volume chart, upcoming sessions list, personal best records. Electric indigo (#6366F1) accent on active elements and charts. Clean sans-serif typography. Modern, professional, data-rich. No dummy lorem ipsum text — use realistic athletic training data (sprint times, distances, sets/reps)."

### Asset Rules

1. All generated assets must be reviewed for "AI slop" before use. If it looks generated, regenerate with tighter constraints.
2. Prefer SVG over raster for any line-art/geometric assets
3. All assets must work on both dark and light backgrounds (or generate separate versions)
4. No watermarks, signatures, or embedded text in illustrations
5. Test every asset at both mobile (375px) and desktop (1440px) scales

---

## 7. Responsive Behavior

| Breakpoint | Hero Text | Columns | Spacing |
|------------|-----------|---------|---------|
| Desktop (1200px+) | 80-96px | 3-col features | 120-160px section padding |
| Tablet (768-1199px) | 56-72px | 2-col features | 80-100px section padding |
| Mobile (< 768px) | 40-56px | 1-col stacked | 64-80px section padding |

- Navigation collapses to hamburger at 768px
- Product showcase device mockup: laptop on desktop, phone on mobile
- Audience split: side-by-side on desktop, stacked on mobile
- All animations work on mobile but with reduced intensity (smaller Y offsets, shorter durations)

---

## 8. Technical Constraints

### Framework
- Next.js 14+ with App Router
- React Server Components by default, Client Components only where needed (animations, interactivity)
- TypeScript strict mode

### CSS
- Tailwind CSS v4 (CSS-first config, no tailwind.config.js)
- All color tokens defined in `globals.css` via `@theme` directive
- No inline styles except for dynamic animation values

### Animation
- Framer Motion v12 for all component animations
- Lenis for smooth scroll (install if not present)
- `will-change` and `transform` for GPU-accelerated animations only
- `prefers-reduced-motion` media query respected

### Performance
- Largest Contentful Paint (LCP) < 2.5s
- No layout shift from animations (Cumulative Layout Shift < 0.1)
- Images: WebP/AVIF with `next/image`, lazy loaded below fold
- Hero content (text + badge + CTAs) must be visible without JavaScript (SSR)
- Font loading: `font-display: swap` with appropriate preloading

### Accessibility
- All interactive elements keyboard accessible
- Focus rings visible (indigo color)
- Color contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Animations respect `prefers-reduced-motion`
- Semantic HTML: proper heading hierarchy, landmark regions, alt text on images

---

## 9. What NOT to Do (Anti-Patterns)

These are the things that make landing pages feel like "AI slop." Avoid all of them:

1. **No dot grids or particle backgrounds** — overused, instantly dates the design
2. **No gradient mesh backgrounds** — beautiful but every AI tool generates them
3. **No glassmorphism cards** — the frosted glass effect is 2022
4. **No "bento grid" layouts** — Apple did it, then everyone copied it, now it's dead
5. **No 3D floating objects** — iPhone-style floating UI elements are template garbage
6. **No neon glows on dark backgrounds** — Cyberpunk aesthetic is over
7. **No stock photography of people running** — either use abstract art or real product shots
8. **No "trusted by [fake logos]"** — only show real social proof or omit the section
9. **No animated gradient text** — looks like a CSS demo, not a product
10. **No parallax that makes the user sick** — subtle depth only, max 30% speed differential between layers

---

## 10. Reference & Inspiration

**Study these for execution quality (not to copy):**

| Site | What to learn |
|------|---------------|
| framer.com | Smooth scroll, typography scale, section transitions |
| linear.app | Indigo usage, dark mode, restrained color, product-focused |
| vercel.com | Type-driven hero, monochrome + one accent, animation quality |
| apple.com | Whitespace, scroll-linked storytelling, product showcase |
| stripe.com | Attention to micro-interactions, button hover effects |

**Study these for what NOT to do:**
| Site | What to avoid |
|------|---------------|
| Generic "SaaS landing page" templates | Everything — the layout, the colors, the copy pattern |
| Dribbble "dark dashboard" mockups | Over-designed, too many colors, not real |

---

## Summary

Kasoku's landing page should feel like opening a precision instrument — clean, intentional, every element earning its place. The design communicates acceleration not through busyness but through purposeful motion, generous space, and the quiet confidence of a product that knows its audience.

**Color:** Monochrome base + Electric Indigo accent + Rose CTAs
**Type:** Syne headlines (big, bold) + Inter body (clean, readable)
**Motion:** Spring physics, scroll-linked, alive — never frozen
**Visuals:** Abstract, geometric, minimal — generated or code-drawn
**Tone:** Professional but energetic. For people who take training seriously.
