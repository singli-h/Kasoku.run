# Antigravity Re-Prompt: Landing Page Asset Generation & Integration

**Context:** This prompt is for Google Antigravity IDE to regenerate and ARTISTICALLY INTEGRATE visual assets into the Kasoku.run landing page. The codebase has been updated with the correct design system (Electric Indigo, spring animations, monochrome base). The current hero image (`/images/marketing/hero-abstract.png`) is trash — it's a generic 3D render that was pasted in without any artistic integration.

**Key principle:** Assets should not be "pasted into" the page. They must be WOVEN into the layout like a world-class UI/UX designer would do — creating atmosphere, reinforcing the brand message, and elevating the user experience. Think about how Apple, Linear, and Stripe use visual elements: they're part of the composition, not decorations dropped on top.

---

## Project Context

- **Framework:** Next.js 14+ with App Router, React, TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Animation:** Framer Motion v12 + Lenis smooth scroll
- **Fonts:** Syne (headlines), Inter (body), Outfit (UI/nav)
- **Brand color:** Electric Indigo `#6366F1` / `hsl(239, 84%, 67%)`
- **CTA color:** Rose `#F43F5E`
- **Dark mode first** — near-black background `hsl(0, 0%, 6%)`

### File locations:
- Landing page: `apps/web/app/(marketing)/page.tsx`
- Hero component: `apps/web/components/features/landing/hero.tsx`
- Features component: `apps/web/components/features/landing/features.tsx`
- CTA component: `apps/web/components/features/landing/cta.tsx`
- Social proof: `apps/web/components/features/landing/social-proof.tsx`
- Global styles: `apps/web/app/globals.css`
- Public assets: `apps/web/public/images/marketing/`

---

## Task 1: Hero Visual Element

### What's wrong now
The hero currently has a placeholder `<div className="mt-20 flex-1" aria-hidden="true" />` where the visual element should go. The previous image was a 640x640 PNG of a glossy 3D highway — generic AI art that looked pasted in.

### What to create
**NOT a standalone image dropped into a container.** Instead, create a visual composition that is PART of the hero section's layout:

**Option A — SVG Track Lines (Preferred)**
Create an inline SVG or code-generated visual element that renders abstract track/lane curves. Specifications:
- 3-5 thin curved lines (1-2px stroke) suggesting running track lanes curving into perspective
- Lines start from bottom-left, curve upward and to the right, fading into nothing
- Colors: most lines in `hsl(0 0% 25%)` (subtle gray), ONE line in Electric Indigo `#6366F1`
- The lines should extend BEHIND the hero text, creating depth — use `position: absolute` with low z-index
- Lines should animate: draw-in on page load using SVG `stroke-dasharray`/`stroke-dashoffset` with Framer Motion
- The indigo line should glow subtly: `filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))`
- 80%+ of the hero area remains empty dark space — the lines are accents, not fills

**Integration approach:**
```tsx
// Inside the hero section, positioned absolutely behind the text content
<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
  <svg className="absolute bottom-0 left-0 w-full h-full opacity-40" viewBox="0 0 1920 1080" fill="none">
    {/* Animated track lines here */}
  </svg>
</div>
```

The lines create a sense of DIRECTION and MOMENTUM without competing with the headline. They're ambient, not focal.

**Option B — Gradient Orb**
If SVG lines prove too complex, create a single large radial gradient orb:
- Positioned bottom-right of the hero section, partially off-screen
- Color: Electric Indigo at 5-8% opacity, fading to transparent
- Size: ~800px diameter
- Animates: slowly drifts/pulses with `useMotionValue` and a subtle scale oscillation
- This creates ambient light/atmosphere without any "object" being visible

**DO NOT:**
- Generate a raster PNG/JPG image and drop it in an `<Image>` tag
- Create a 3D render, particle system, or anything that screams "AI-generated"
- Use `mix-blend-screen` or `mix-blend-mode` hacks
- Add any element that takes visual attention away from the headline

---

## Task 2: CTA Section Atmosphere

### What's wrong now
The CTA section has a minimal radial gradient glow at 3% opacity. It works but it's boring.

### What to create
Add a subtle visual element that makes the CTA section feel like a "destination" — the culmination of the scroll journey.

**Approach: Converging Lines**
- Reuse the track line concept from the hero, but INVERTED — lines converge TOWARD the CTA button from the edges
- Same thin strokes, same color treatment (gray + one indigo)
- Much subtler than the hero — these are almost invisible, just enough to create a sense of "arriving"
- Animate on scroll-into-view: lines draw inward

**Integration:** Absolute positioned SVG behind the CTA content, same pattern as hero but mirrored/convergent.

---

## Task 3: Feature Card Icons

### What's wrong now
Feature cards use plain Lucide icons in `text-primary` (indigo). They're functional but have no personality.

### What to enhance
Don't generate custom images for icons. Instead, give each icon an ambient glow container:

```tsx
<div className="mb-6 relative w-12 h-12 flex items-center justify-center">
  {/* Ambient glow behind icon */}
  <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl" />
  <div className="relative rounded-xl bg-surface p-2.5 border border-border">
    <Icon className="w-5 h-5 text-primary" />
  </div>
</div>
```

This creates a subtle "lit from behind" effect that makes icons feel integrated into the dark UI rather than flat.

---

## Task 4: Audience Split Section Illustrations (Athletes / Coaches)

### What's wrong now
The "I'm an Athlete" / "I'm a Coach" panels are text-only. They need a visual element.

### What to create
For each panel, generate a SMALL (200x200 or 300x200) abstract illustration:

**Athlete panel:**
Generate using Nano Banana:
> "Minimal abstract line drawing of a runner in mid-stride. 3-5 continuous lines only. White lines on transparent background. One line in electric blue-violet #6366F1. Geometric, architectural style. Inspired by Otl Aicher's Munich 1972 Olympics pictograms but MORE abstract — almost unrecognizable as a human, more like the IDEA of motion. No fill, stroke only. SVG-compatible clean edges."

**Coach panel:**
Generate using Nano Banana:
> "Minimal abstract line drawing representing a training plan or schedule. 4-6 horizontal lines at varying lengths suggesting a timeline/gantt chart, with small accent marks. White lines on transparent background. One accent element in electric blue-violet #6366F1. Geometric, data-visualization aesthetic. Should feel like looking at a strategic plan from above. No fill, stroke only."

**Integration approach:**
- Position the illustration at the TOP-RIGHT corner of each panel
- Set opacity to 20-30% so it's a background texture, not a focal element
- It bleeds off the edge of the card slightly (use `overflow-hidden` on the card)
- On hover, opacity animates to 40%

```tsx
<div className="flex-1 p-10 relative overflow-hidden group">
  {/* Background illustration */}
  <div className="absolute -top-4 -right-4 w-48 h-48 opacity-20 group-hover:opacity-40 transition-opacity duration-500" aria-hidden="true">
    <Image src="/images/marketing/athlete-abstract.svg" alt="" fill className="object-contain" />
  </div>
  {/* Content */}
  <h3>I'm an Athlete</h3>
  ...
</div>
```

---

## Task 5: Product Showcase Section (NEW — Currently Missing)

### What to create
This is the MOST important missing section. It goes BETWEEN SocialProof and Features in the page.

Create a new component at `apps/web/components/features/landing/product-showcase.tsx`.

**Concept: Scroll-linked device mockup**

A laptop/phone mockup centered on screen, with the screen showing different app views as the user scrolls. This is the "see the product" moment.

**If you have real app screenshots:** Use them inside the device frame.
**If you don't:** Generate realistic dark-UI app mockups using Nano Banana:
> "High-fidelity mobile app screenshot. Dark theme UI (#0F0F0F background, #18181B card surfaces). Athletic training dashboard showing: weekly volume chart with indigo (#6366F1) bars, upcoming sessions list with exercise names, and a personal best notification banner. Clean sans-serif typography. Modern, data-rich, professional. No lorem ipsum — use realistic athletic data like '100m Sprint: 11.2s', 'Squat: 140kg x 5'."

**Device mockup approach:**
- Don't use a heavy library for the device frame. Use CSS:
```tsx
<div className="relative mx-auto w-[320px] sm:w-[375px] rounded-[2.5rem] border-[8px] border-zinc-800 bg-zinc-900 shadow-2xl shadow-primary/10">
  <div className="rounded-[2rem] overflow-hidden aspect-[9/19.5]">
    {/* Screen content transitions here */}
  </div>
</div>
```

- Use `position: sticky` so the device stays centered while scroll-linked content changes
- Use `useScroll` from Framer Motion to track scroll progress within the section
- Screen content cross-fades between 3-4 views based on scroll progress
- Text labels appear/disappear alongside the device describing each feature view

**Structure:**
```
<section className="relative min-h-[300vh]"> {/* Tall section for scroll room */}
  <div className="sticky top-[20vh] ...">
    <DeviceMockup>
      {/* Content that changes with scroll */}
    </DeviceMockup>
    <AnimatedLabel /> {/* Text that fades in/out */}
  </div>
</section>
```

After creating, add it to `page.tsx` between `<SocialProof />` and `<Features />`.

---

## Design Principles for ALL Visual Work

1. **Subtlety over spectacle.** Every visual element should be at 20-40% opacity. If you notice it immediately, it's too loud.

2. **Integration over decoration.** Visuals are positioned absolutely, bleed off edges, layer behind content. They're PART of the composition, not items placed on top.

3. **Monochrome + one color.** All visual elements use white/gray tones with a SINGLE indigo accent element. Never more than one colored element per visual.

4. **Motion reveals meaning.** Visual elements animate in ways that reinforce the brand story (acceleration, direction, precision). Lines draw in suggesting speed. Glows pulse suggesting energy.

5. **Empty space is design.** 70%+ of any composition should be empty. The breathing room IS the premium feel. Resist the urge to fill space.

6. **No AI slop indicators:** Avoid glossy surfaces, particle effects, lens flares, neon glows, smooth gradients that scream "Midjourney". If it could be mistaken for a stock 3D render, delete it and start over.

7. **Test at both extremes:** Every visual must look good at 375px mobile AND 1440px desktop. If it only works at one size, rethink the approach.

---

## Verification Checklist

After completing all tasks, verify:
- [ ] Hero has an ambient visual element (SVG lines or gradient orb) that's BEHIND the text
- [ ] No raster images are used for abstract elements (SVG or CSS only)
- [ ] Feature card icons have ambient glow treatment
- [ ] Audience split panels have subtle background illustrations
- [ ] Product showcase section exists and is scroll-linked
- [ ] CTA section has converging visual element
- [ ] All visual elements respect `prefers-reduced-motion`
- [ ] All visual elements have `aria-hidden="true"` (they're decorative)
- [ ] Page still loads fast — no heavy assets blocking LCP
- [ ] Dark mode looks premium, light mode looks clean
- [ ] `npm run build:web` compiles without errors
