# Design Tokens Reference

> **Last Updated**: 2026-03-15
> **Status**: Active
> **Tailwind Version**: v4.x (CSS-first configuration)

This document defines all design tokens used in the Kasoku.run application. Design tokens are the single source of truth for visual design decisions.

---

## Token Architecture

```
tokens/
├── Color System        → Brand, semantic, and functional colors
├── Typography          → Font families, sizes, weights, line heights
├── Spacing             → Consistent spacing scale
├── Border Radius       → Rounded corner values
├── Shadows             → Elevation and depth
├── Z-Index             → Stacking order
└── Animation           → Timing and easing functions
```

---

## Color System

### Semantic Colors

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--background` | `hsl(0 0% 100%)` | `hsl(0 0% 6%)` | Page background |
| `--foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` | Primary text |
| `--card` | `hsl(0 0% 100%)` | `hsl(0 0% 8%)` | Card surfaces |
| `--card-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` | Card text |
| `--popover` | `hsl(0 0% 100%)` | `hsl(0 0% 8%)` | Popover surfaces |
| `--popover-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` | Popover text |
| `--muted` | `hsl(0 0% 96.1%)` | `hsl(0 0% 10%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(0 0% 45.1%)` | `hsl(0 0% 75%)` | Secondary text |
| `--accent` | `hsl(0 0% 96.1%)` | `hsl(0 0% 12%)` | Accent backgrounds |
| `--accent-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 98%)` | Accent text |

### Action Colors

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--primary` | `hsl(239 84% 67%)` | `hsl(239 84% 67%)` | Primary actions — Electric Indigo |
| `--primary-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | Text on primary (white) |
| `--secondary` | `hsl(0 0% 96.1%)` | `hsl(0 0% 12%)` | Secondary actions |
| `--secondary-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 95%)` | Text on secondary |
| `--destructive` | `hsl(0 84.2% 60.2%)` | `hsl(0 75% 55%)` | Destructive actions |
| `--destructive-foreground` | `hsl(0 0% 98%)` | `hsl(0 0% 100%)` | Text on destructive |

### UI Colors

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--border` | `hsl(0 0% 89.8%)` | `hsl(0 0% 15%)` | Borders and dividers |
| `--input` | `hsl(0 0% 89.8%)` | `hsl(0 0% 10%)` | Input backgrounds |
| `--ring` | `hsl(239 84% 67%)` | `hsl(239 84% 67%)` | Focus rings |

### Chart Colors

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--chart-1` | `hsl(12 76% 61%)` | `hsl(220 70% 65%)` | Chart color 1 |
| `--chart-2` | `hsl(173 58% 39%)` | `hsl(160 60% 55%)` | Chart color 2 |
| `--chart-3` | `hsl(197 37% 24%)` | `hsl(30 80% 65%)` | Chart color 3 |
| `--chart-4` | `hsl(43 74% 66%)` | `hsl(280 65% 70%)` | Chart color 4 |
| `--chart-5` | `hsl(27 87% 67%)` | `hsl(340 75% 65%)` | Chart color 5 |

### Sidebar Colors

| Token | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| `--sidebar-background` | `hsl(0 0% 98%)` | `hsl(0 0% 4%)` | Sidebar background |
| `--sidebar-foreground` | `hsl(240 5.3% 26.1%)` | `hsl(0 0% 95%)` | Sidebar text |
| `--sidebar-primary` | `hsl(240 5.9% 10%)` | `hsl(217 91% 60%)` | Active items |
| `--sidebar-primary-foreground` | `hsl(0 0% 98%)` | `hsl(0 0% 100%)` | Active item text |
| `--sidebar-accent` | `hsl(240 4.8% 95.9%)` | `hsl(0 0% 8%)` | Hover state |
| `--sidebar-accent-foreground` | `hsl(240 5.9% 10%)` | `hsl(0 0% 95%)` | Hover text |
| `--sidebar-border` | `hsl(220 13% 91%)` | `hsl(0 0% 12%)` | Sidebar dividers |
| `--sidebar-ring` | `hsl(217.2 91.2% 59.8%)` | `hsl(217 91% 60%)` | Sidebar focus |

---

## Typography

### Font Stack

```css
--font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
```

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 0.75rem (12px) | 1rem | Captions, labels |
| `text-sm` | 0.875rem (14px) | 1.25rem | Secondary text |
| `text-base` | 1rem (16px) | 1.5rem | Body text |
| `text-lg` | 1.125rem (18px) | 1.75rem | Subheadings |
| `text-xl` | 1.25rem (20px) | 1.75rem | Section titles |
| `text-2xl` | 1.5rem (24px) | 2rem | Page titles (mobile) |
| `text-3xl` | 1.875rem (30px) | 2.25rem | Page titles |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis, buttons |
| `font-semibold` | 600 | Headings, labels |
| `font-bold` | 700 | Strong emphasis |

---

## Spacing Scale

Based on a 4px base unit for consistency.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `spacing-0` | 0 | 0px | No spacing |
| `spacing-0.5` | 0.125rem | 2px | Micro gaps |
| `spacing-1` | 0.25rem | 4px | Tight spacing |
| `spacing-1.5` | 0.375rem | 6px | |
| `spacing-2` | 0.5rem | 8px | Small gaps |
| `spacing-3` | 0.75rem | 12px | |
| `spacing-4` | 1rem | 16px | Default spacing |
| `spacing-5` | 1.25rem | 20px | |
| `spacing-6` | 1.5rem | 24px | Section spacing |
| `spacing-8` | 2rem | 32px | Large gaps |
| `spacing-10` | 2.5rem | 40px | |
| `spacing-12` | 3rem | 48px | Section dividers |
| `spacing-16` | 4rem | 64px | Page sections |

### Mobile-Safe Spacing

| Utility | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| `.mobile-safe-x` | px-4 | px-6 | px-8 |
| `.mobile-safe-y` | py-4 | py-6 | py-8 |
| `.mobile-safe` | p-4 | p-6 | p-8 |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 0.5rem (8px) | Base radius value |
| `rounded-sm` | calc(var(--radius) - 4px) | Small elements |
| `rounded-md` | calc(var(--radius) - 2px) | Medium elements |
| `rounded-lg` | var(--radius) | Cards, modals |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Default elevation |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Cards |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Prominent elements |

---

## Z-Index Scale

Centralized stacking order to prevent z-index conflicts.

| Token | Value | Usage |
|-------|-------|-------|
| `z-sidebar` | 10 | Sidebar navigation |
| `z-header` | 20 | Fixed header |
| `z-dropdown` | 30 | Dropdown menus |
| `z-tooltip` | 40 | Tooltips |
| `z-modal` | 50 | Modal dialogs |
| `z-toast` | 60 | Toast notifications |

---

## Animation Tokens

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-75` | 75ms | Instant feedback |
| `duration-100` | 100ms | Quick transitions |
| `duration-150` | 150ms | Default hover |
| `duration-200` | 200ms | Default transition |
| `duration-300` | 300ms | Modal/drawer open |
| `duration-500` | 500ms | Complex animations |

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerating |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerating |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Smooth |

### Named Animations

| Name | Duration | Usage |
|------|----------|-------|
| `accordion-down` | 200ms ease-out | Accordion expand |
| `accordion-up` | 200ms ease-out | Accordion collapse |
| `gradient` | 8s linear infinite | Gradient animation |

---

## Breakpoints

| Token | Min Width | Target |
|-------|-----------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Container Sizes

| Breakpoint | Max Width |
|------------|-----------|
| Default | 100% |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px |

---

## Accessibility Requirements

### Contrast Ratios (WCAG AA)

| Element Type | Minimum Ratio |
|--------------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+ bold, 24px+ regular) | 3:1 |
| UI components | 3:1 |

### Touch Targets

| Utility | Size | Standard |
|---------|------|----------|
| `.touch-target` | 44x44px | Apple HIG |
| `.touch-target-sm` | 40x40px | Material Design |
| `.touch-target-lg` | 48x48px | Enhanced |

### Focus Indicators

All interactive elements must have visible focus indicators:
```css
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

---

## Usage Guidelines

### 1. Always Use Semantic Tokens

```jsx
// Good
<div className="bg-background text-foreground">

// Avoid
<div className="bg-white text-black">
```

### 2. Use Spacing Scale

```jsx
// Good - uses spacing scale
<div className="p-4 gap-2">

// Avoid - arbitrary values
<div className="p-[17px] gap-[7px]">
```

### 3. Respect Z-Index Hierarchy

```jsx
// Good - uses z-index tokens
<div className="z-modal">

// Avoid - arbitrary z-index
<div className="z-[9999]">
```

### 4. Mobile-First Approach

```jsx
// Good - mobile-first responsive
<div className="p-4 sm:p-6 lg:p-8">

// Avoid - desktop-first
<div className="p-8 max-lg:p-6 max-sm:p-4">
```

---

---

## Domain Components

### Event Group Tags

Event group tags (SS, MS, LS, etc.) appear across many surfaces. Use the shared `EventGroupBadge` component for ALL event group rendering — never create ad-hoc badges.

**Component**: `@/components/features/athletes/components/event-group-badge.tsx`

| Prop | Options | Purpose |
|------|---------|---------|
| `size` | `xs`, `sm`, `md` | `xs` = inline on cards, `sm` = default display, `md` = filter pills |
| `variant` | `default`, `filter`, `muted` | `default` = solid primary bg, `filter` = toggle pill, `muted` = subtle |
| `active` | boolean | Selected state (filter variant only) |
| `interactive` | boolean | Renders as `<button>` vs `<span>` |

**Visual spec**:
- Font: inherits app font (Inter), `font-medium` weight — NOT mono, NOT bold
- Default variant: `bg-primary/80 text-primary-foreground` (light purple bg, white text)
- Filter active: `bg-primary text-primary-foreground shadow-sm` (solid primary)
- Filter inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Empty state: dashed border, muted text, shows `emptyLabel` (default "+group")
- Border radius: `rounded` (base)
- Min heights: xs=20px, sm=22px, md=30px

**Where used**:
- Session cards (weekday panel + inline badges)
- Exercise cards (subgroup chip with popover)
- Plan filter bar (toggle pills)
- Athlete roster table and cards
- Coach dashboard compliance bars
- MicrocycleEditor week grid

**Rules**:
1. Always use `EventGroupBadge` — never style event groups inline
2. Use `abbreviateEventGroup()` from `@/lib/training-utils` to normalize display values
3. Tags should be visually consistent across light and dark mode
4. Minimum touch target: match `size` prop (xs for read-only, md for interactive)

---

*This document should be updated when design tokens change.*
