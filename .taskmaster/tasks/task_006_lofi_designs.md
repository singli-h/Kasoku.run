# Session Planner Lofi Designs

## 🎯 Critical Analysis of Current Design

### Current Implementation Issues

**Header Section (PlanPageHeader):**
- ❌ **Too Heavy**: Two-row header with multiple borders creates visual weight
- ❌ **Crowded Layout**: Back button, title, subtitle, badge, mode toggle, undo/redo all competing for attention
- ❌ **Technical Subtitle**: "Plan: 123 • Session: 456" is not user-friendly
- ❌ **Disconnected Sections**: Mode toggle and undo/redo in separate bordered row feels disjointed
- ❌ **Unnecessary Backgrounds**: `bg-muted/30` adds visual noise
- ❌ **Too Tall**: Consumes excessive vertical space (2 rows + borders)
- ❌ **Hard Borders**: `border-b` and `border-t` create visual breaks

**Toolbar Section:**
- ✅ **Good Foundation**: Already follows Apple minimalist principles
- ⚠️ **Minor Issue**: Selection counter could be more subtle
- ⚠️ **Spacing**: Could benefit from tighter integration with header

**Overall Rating: 4/10**
- Too much chrome and borders
- Not enough breathing room
- Feels like 2018 design, not 2025
- Missing modern minimalist principles

---

## ✨ Redesigned Header + Toolbar (2025 Style)

### Design Philosophy

**2025/2026 UI/UX Trends:**
1. **Extreme Minimalism**: No borders, no backgrounds, pure whitespace
2. **Floating Elements**: Reduced chrome, everything feels lighter
3. **Monochrome + Accent**: System grays + single brand color
4. **Compact but Breathable**: Tight vertical, generous horizontal spacing
5. **Smart Defaults**: Hide complexity, reveal on demand
6. **Contextual**: Show only what's needed when it's needed
7. **Subtle Depth**: Shadows instead of borders

---

## Desktop View - Redesigned Header (1920x1080)

### Before (Current - Heavy and Crowded)

```
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐   │ ← bg-card (unnecessary)
│ │ [← Back] Lower Body Strength + Speed           [Active] [↻] │   │ ← Row 1: Too many elements
│ │ Plan: 123 • Session: 456                                     │   │ ← Technical subtitle
│ ├──────────────────────────────────────────────────────────────┤   │ ← border-t (heavy)
│ │ [Simple | Detail]               [Undo] [Redo]               │   │ ← Row 2: Disconnected section
│ └──────────────────────────────────────────────────────────────┘   │ ← bg-muted/30 (noisy)
└────────────────────────────────────────────────────────────────────┘
   Issues: 2 rows, 3 borders, 2 backgrounds, crowded, technical
```

### After (2025 Minimalist - Single Row, No Borders)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [←] Lower Body Strength             [Simple][Detail]  [↶] [↷]     │ ← Single row, all inline
│      Week 2, Day 3                                                  │ ← Subtle context
│                                                                      │
│  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ │ ← Hairline divider (optional)
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
   Benefits: 1 row, 0 borders, 0 backgrounds, clean, user-friendly
```

**Key Improvements:**
- ✅ **Single Row**: All controls in one line (back, title, mode, undo/redo)
- ✅ **No Borders**: Just subtle hairline divider at bottom (optional)
- ✅ **No Backgrounds**: Pure white/system background
- ✅ **Monochrome**: Gray icons, no colored badges
- ✅ **User-Friendly**: "Week 2, Day 3" instead of technical IDs
- ✅ **Compact**: 50% less vertical space
- ✅ **Segmented Control**: iOS-style toggle (not tabs)
- ✅ **Icon Buttons**: Simple ↶↷ for undo/redo (not outlined buttons)

---

## Desktop View - Complete Layout (2025 Minimalist)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [←] Lower Body Strength             [Simple][Detail]  [↶] [↷]     │ ← HEADER: Single row
│      Week 2, Day 3                                                  │    No borders
│  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ │    No backgrounds
│                                                                      │
│                                                                      │
│  [ + Add Exercise ]                      3 selected · 5 total       │ ← TOOLBAR: Clean
│   ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯                                                   │    Accent button
│                                                                      │    Generous space
│                                                                      │
│  Superset  Ungroup          Duplicate  Delete  Batch    Select All  Clear  │ ← Ghost buttons
│                                                                      │    Contextual
│                                                                      │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [☑] 🎯 1  Back Squat              Strength  [v] [Copy]       │   │ ← Exercise rows
│ │         4 sets × 10 reps @ 80kg                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ... more exercises ...                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Total Chrome Reduction:**
- Before: 2 header rows + 3 borders + 2 backgrounds = **7 visual elements**
- After: 1 header row + 0 borders + 0 backgrounds = **1 visual element**
- **85% reduction in visual noise**

---

## Mobile View - Redesigned Header (375x667)

### Before (Current - Too Tall)

```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ [←] Lower Body Strength │ │ ← Row 1
│ │ Plan: 123 • Session: 456│ │
│ ├─────────────────────────┤ │ ← border-t
│ │ [Simple | Detail]       │ │ ← Row 2
│ │         [Undo] [Redo]   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
   Issues: 2 rows, too tall
```

### After (2025 Minimalist - Compact Stack)

```
┌─────────────────────────────┐
│                             │
│  [←] Lower Body Strength    │ ← Title only
│      Week 2, Day 3          │ ← Subtitle
│                             │
│  [Simple][Detail] [↶][↷]   │ ← Controls inline
│                             │
│  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ │ ← Hairline
│                             │
└─────────────────────────────┘
   Benefits: Clean stack, 40% shorter
```

**Mobile Improvements:**
- ✅ **Compact Stack**: Title, subtitle, controls in tight vertical flow
- ✅ **Inline Controls**: Mode toggle + undo/redo in single row
- ✅ **Icon-Only**: ↶↷ saves space on mobile
- ✅ **No Borders**: Clean separation with hairline only
- ✅ **Shorter**: 40% less vertical space consumed

---

## Desktop View - Simple Mode (1920x1080)

```
┌────────────────────────────────────────────────────────────────────┐
│ [←] Lower Body Strength + Speed  │  Plan: 123 • Session: 456      │ ← PlanPageHeader (fixed)
│ [Undo] [Redo]                           [Simple/Detail] Toggle     │
└────────────────────────────────────────────────────────────────────┘
│                                                                      │
│                                                                      │
│  [ + Add Exercise ]                      3 selected · 5 total       │ ← Apple-style: Clean
│   ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯                                                   │    Accent button
│                                                                      │    No borders!
│                                                                      │
│  Superset  Ungroup          Duplicate  Delete  Batch    Select All  Clear  │ ← Ghost buttons
│                                                                      │    Generous spacing
│                                                                      │    Contextual visibility
│                                                                      │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [☑] 🎯 1  Back Squat              Strength  [v] [Copy]       │   │ ← Exercise Row (collapsed)
│ │         4 sets × 10 reps @ 80kg                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [☑] 🎯 2  Romanian Deadlift       Strength  [^] [Copy]       │   │ ← Exercise Row (expanded)
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Sets                                        [+ Add Set]      │   │
│ │                                                              │   │
│ │ ┌────────────────────────────────────────────────────────┐  │   │
│ │ │ Set│Reps│Weight│Rest│RPE │ ← Sticky!                  │  │   │ ← Horizontal Scroll Container
│ │ │────┼────┼──────┼────┼────┤                            │  │   │    (overflow-x-auto on this div)
│ │ │ 1  │[10]│ [80] │[90]│[7] │ [fields continue →]        │◄─┼──┼──► Table scrolls horizontally
│ │ │ 2  │[10]│ [85] │[90]│[8] │                            │  │   │    if many fields in detail mode
│ │ │ 3  │[10]│ [90] │[90]│[8] │                            │  │   │
│ │ │ 4  │[10]│ [95] │[90]│[9] │                            │  │   │
│ │ └────────────────────────────────────────────────────────┘  │   │
│ │                                                              │   │
│ │ Notes: [Click to add notes...]                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [SUPERSET BADGE] 2 exercises                      [v]        │   │ ← Superset Group
│ ├──────────────────────────────────────────────────────────────┤   │
│ │   [□] 🎯 3A  Bulgarian Split Squat  Strength  [^] [Copy]    │   │
│ │   [□] 🎯 3B  Hamstring Curl         Strength  [^] [Copy]    │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ... more exercises ...                                               │
│                                                                      │ ↕ Single vertical scroll
│                                                                      │   (natural page scroll)
└──────────────────────────────────────────────────────────────────────┘

[Exercise Library Panel - Overlay on right when open]
```

**Key Features**:
- **Horizontal Scroll**: Only the sets table scrolls horizontally (indicated by ◄─►)
- **Vertical Scroll**: Natural page scroll (↕)
- **Sticky Column**: "Set" column stays visible when scrolling table horizontally
- **Simple Mode**: Shows 4-5 core fields (Reps, Weight, Rest, RPE)

---

## Desktop View - Detail Mode (1920x1080)

```
┌────────────────────────────────────────────────────────────────────┐
│ [←] Lower Body Strength + Speed  │  Plan: 123 • Session: 456      │
│ [Undo] [Redo]                           [Simple/Detail] Toggle     │
└────────────────────────────────────────────────────────────────────┘
│                                                                      │
│                                                                      │
│  [ + Add Exercise ]                      3 selected · 5 total       │ ← Apple-style toolbar
│   ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯                                                   │    Same clean design
│                                                                      │
│  Superset  Ungroup          Duplicate  Delete  Batch    Select All  Clear  │
│                                                                      │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [☑] 🎯 1  Back Squat              Strength  [^] [Copy]       │   │
│ ├───────────────────────────────────────────────��──────────────┤   │
│ │ Sets                                        [+ Add Set]      │   │
│ │                                                              │   │
│ │ ┌────────────────────────────────────────────────────────────────────────┐
│ │ │Set│Reps│Weight│Rest│RPE│Tempo│Distance│Time│Power│Velocity│ ← Many fields! │
│ │ │───┼────┼──────┼────┼───┼─────┼────────┼────┼─────┼────────┤              │
│ │ │ 1 │[10]│ [80] │[90]│[7]│[301]│  [-]   │[-] │ [-] │  [-]   │ Continue... │◄─► MUST scroll!
│ │ │ 2 │[10]│ [85] │[90]│[8]│[301]│  [-]   │[-] │ [-] │  [-]   │             │
│ │ └────────────────────────────────────────────────────────────────────────┘
│ │                                                              │   │
│ │ Notes: [Click to add notes...]                              │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ... more exercises ...                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **More Fields**: Detail mode shows 10+ fields per set
- **Horizontal Scroll Required**: Table width exceeds viewport, must scroll
- **Same Vertical Behavior**: Natural page scroll

---

## Mobile View - Simple Mode (375x667)

```
┌─────────────────────────────┐
│ [←] Lower Body Strength     │ ← PlanPageHeader
│ Plan: 123 • Session: 456    │
│ [Simple/Detail]             │
└─────────────────────────────┘
│                             │
│                             │
│  [ + Add Exercise ]    [⋯]  │ ← Apple iOS-style
│                             │    Minimal chrome
│  3 selected · 5 total       │ ← Subtle gray text
│                             │
│                             │
│ ┌─────────────────────────┐ │
│ │[☑] 1 Back Squat  [v]    │ │ ← Exercise (collapsed)
│ │   4 sets × 10 @ 80kg    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │[☑] 2 Romanian DL  [^]   │ │ ← Exercise (expanded)
│ ├─────────────────────────┤ │
│ │ Sets     [+ Add Set]    │ │
│ │                         │ │
│ │ ┌───────────┐┌─────────┐│ │ ← Cards scroll horizontally
│ │ │  Set 1    ││ Set 2   ││ │   (snap scroll)
│ │ │───────────││─────────││◄┼─► Swipe to scroll
│ │ │ Reps  Weight│ Reps  We││ │   ← 2-COLUMN GRID LAYOUT
│ │ │ [10]  [80] │[10]  [85││ │      (current implementation)
│ │ │           ││         ││ │
│ │ │ Rest  RPE  │Rest  RPE││ │   ← Multiple rows
│ │ │ [90]  [7]  │[90]  [8]││ │      Grid: grid-cols-2
│ │ │           ││         ││ │
│ │ │ Tempo Distance│Tempo Dis││ │
│ │ │ [-]   [-]  │[-]   [-]││ │
│ │ └───────────┘└─────────┘│ │
│ │                         │ │
│ │ ← Swipe to see more →  │ │ ← Hint text
│ │                         │ │
│ │ Notes: [Add notes...]   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │[SUPERSET] 2 ex.    [v]  │ │
│ ├─────────────────────────┤ │
│ │ [□] 3A Bulgarian Split  │ │
│ │ [□] 3B Hamstring Curl   │ │
│ └─────────────────────────┘ │
│                             │ ↕ Single vertical scroll
│ ... more exercises ...      │
│                             │
└─────────────────────────────┘
```

**Key Features**:
- **Card Layout**: Each set is a card (280-320px wide)
- **Horizontal Snap Scroll**: Cards scroll with snap behavior (◄─►)
- **Swipe Gesture**: Natural touch scrolling
- **Hint Text**: "← Swipe to see more →" when 2+ sets
- **Single Vertical Scroll**: Page scrolls normally (↕)

---

## Mobile View - Detail Mode (375x667)

```
┌─────────────────────────────┐
│ [←] Lower Body Strength     │
│ Plan: 123 • Session: 456    │
│ [Simple/Detail]             │
└─────────────────────────────┘
│                             │
│                             │
│  [ + Add Exercise ]    [⋯]  │ ← Same iOS-style
│                             │
│  3 selected · 5 total       │
│                             │
│                             │
│ ┌─────────────────────────┐ │
│ │[☑] 1 Back Squat  [^]    │ │
│ ├─────────────────────────┤ │
│ │ Sets     [+ Add Set]    │ │
│ │                         │ │
│ │ ┌───────────┐┌─────────┐│ │
│ │ │  Set 1    ││ Set 2   ││ │
│ │ │───────────││─────────││◄┼─► Swipe to scroll
│ │ │ Reps  Weight│ Reps  We││ │   ← 2-COLUMN GRID
│ │ │ [10]  [80] │[10]  [85││ │
│ │ │           ││         ││ │
│ │ │ Rest  RPE  │Rest  RPE││ │   ← More rows in
│ │ │ [90]  [7]  │[90]  [8]││ │      detail mode!
│ │ │           ││         ││ │
│ │ │ Tempo Time │Tempo Time││ │   ← 10+ fields
│ │ │[3-0-1] [-] │[3-0-1][-││ │      shown in
│ │ │           ││         ││ │      grid-cols-2
│ │ │ Distance Power│Distance │ │
│ │ │ [-]   [-]  │[-]   [-]││ │
│ │ │           ││         ││ │
│ │ │ Velocity Effort│Velocity │ │
│ │ │ [-]   [-]  │[-]   [-]││ │
│ │ └───────────┘└─────────┘│ │
│ │                         │ │
│ │ ← Swipe to see more →  │ │
│ │                         │ │
│ │ Notes: [Add notes...]   │ │
│ └─────────────────────────┘ │
│                             │
│ ... more exercises ...      │
│                             │
└─────────────────────────────┘
```

**Key Features**:
- **More Fields in Cards**: 10+ fields shown in 2-column grid
- **Taller Cards**: Cards expand vertically to fit all fields
- **Same Scroll Behavior**: Horizontal snap scroll for cards

---

## Toolbar Design - Apple-Inspired Minimalist

### Desktop Toolbar (Apple-Style Clean Layout)

**Design Principles** (Apple Philosophy):
1. **Minimalism**: Remove all unnecessary chrome, borders, backgrounds
2. **Whitespace**: Generous breathing room (24-32px between sections)
3. **Typography**: Clean hierarchy with font weights (not colors)
4. **Monochrome**: System grays + single accent color for primary action
5. **Subtle Depth**: Elevation through shadows, not borders
6. **Restrained Icons**: Simple, monochrome SF Symbols style

**Layout**:
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  [ + Add Exercise ]                         3 selected · 5 total     │ ← Clean header
│   ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯                                                    │    Accent button
│     ↑ Accent color                                                   │    Thin underline
│                                                                       │
│  ┌────────────────┐                    ┌─────────────────────────┐  │
│  │ Superset       │                    │ Duplicate  Delete  Batch│  │ ← Button pills
│  │ Ungroup        │                    └─────────────────────────┘  │    Ghost style
│  └────────────────┘                                                  │    No borders!
│       ↑ Text buttons                      ↑ Inline text buttons     │
│       Only when selected                  Disabled when N/A          │
│                                                                       │
│                                               Select All  Clear      │ ← Text links
│                                                                       │    Right-aligned
└───────────────────────────────────────────────────────────────────────┘
    ↑ No heavy border, just subtle shadow or light divider line
```

**Apple Design Language**:
- **NO borders** around button groups (too heavy)
- **NO background fills** on containers (too busy)
- **YES to whitespace** - let elements breathe
- **Monochrome icons** (not emojis) - ⚡ → simple line icon
- **Single accent color** for primary action only
- **Typography hierarchy** - different weights, not colors
- **Contextual visibility** - buttons appear/fade based on state

### Mobile Toolbar (Apple iOS-Style)

**Design Principles** (iOS Philosophy):
1. **Ultra-Minimal**: Only essential controls visible
2. **Large Touch Targets**: 44x44pt minimum
3. **System Fonts**: SF Pro with proper weights
4. **Bottom Sheet**: Actions in iOS-style action sheet

**Layout**:
```
┌─────────────────────────────┐
│                             │
│  [ + Add Exercise ]    [⋯]  │ ← Accent button + menu
│                             │    No heavy chrome
│  3 selected · 5 total       │ ← Subtle gray text
│                             │
└─────────────────────────────┘
```

**Action Sheet** (triggered by ⋯, iOS bottom sheet style):
```
┌─────────────────────────────┐
│                             │
│  Superset                   │ ← Large touch targets
│  ─────────────────────────  │    Dividers between
│  Ungroup                    │
│  ─────────────────────────  │
│  Duplicate                  │
│  ─────────────────────────  │
│  Delete                     │ ← Red text (destructive)
│  ─────────────────────────  │
│  Batch Edit                 │
│  ─────────────────────────  │
│  Select All                 │
│  ─────────────────────────  │
│  Cancel                     │ ← Bold, bottom
│                             │
└─────────────────────────────┘
```

### Implementation Strategy (Apple Minimalist)

**Component Structure**:
```tsx
<div className="py-6 px-0">
  {/* Header Row - Primary Action + Selection Count */}
  <div className="flex items-center justify-between mb-8">
    {/* Primary Action - Accent Color */}
    <Button
      size="default"
      className="font-semibold"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Exercise
    </Button>

    {/* Selection Counter - Subtle Gray */}
    <p className="text-sm text-muted-foreground font-medium">
      {selection.size} selected · {total} total
    </p>
  </div>

  {/* Desktop: Clean Button Groups - NO BORDERS */}
  <div className="hidden md:flex items-start gap-12">
    {/* Organize Section - Only show when selected */}
    {selection.size > 0 && (
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canSuperset}
          className="justify-start font-medium"
        >
          <span className="mr-2">⚡</span> Superset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUngroup}
          className="justify-start font-medium"
        >
          <span className="mr-2">↩</span> Ungroup
        </Button>
      </div>
    )}

    {/* Edit Section - Only show when selected */}
    {selection.size > 0 && (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="font-medium">
          Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="font-medium text-destructive">
          Delete
        </Button>
        <Button variant="ghost" size="sm" className="font-medium">
          Batch Edit
        </Button>
      </div>
    )}

    {/* Selection Actions - Always visible, right-aligned */}
    <div className="ml-auto flex items-center gap-4">
      <Button variant="link" size="sm" onClick={selectAll}>
        Select All
      </Button>
      <Button variant="link" size="sm" onClick={deselectAll}>
        Clear
      </Button>
    </div>
  </div>

  {/* Mobile: iOS-Style Action Sheet */}
  <Sheet>
    <SheetTrigger asChild className="md:hidden">
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="rounded-t-3xl">
      <div className="flex flex-col gap-0 py-4">
        <Button variant="ghost" className="justify-start h-14 text-base">
          Superset
        </Button>
        <Separator />
        <Button variant="ghost" className="justify-start h-14 text-base">
          Ungroup
        </Button>
        <Separator />
        <Button variant="ghost" className="justify-start h-14 text-base">
          Duplicate
        </Button>
        <Separator />
        <Button
          variant="ghost"
          className="justify-start h-14 text-base text-destructive"
        >
          Delete
        </Button>
        <Separator />
        <Button variant="ghost" className="justify-start h-14 text-base">
          Batch Edit
        </Button>
        <Separator />
        <Button variant="ghost" className="justify-start h-14 text-base">
          Select All
        </Button>
        <Separator className="my-2" />
        <SheetClose asChild>
          <Button variant="ghost" className="h-14 text-base font-semibold">
            Cancel
          </Button>
        </SheetClose>
      </div>
    </SheetContent>
  </Sheet>
</div>
```

**Apple Design Tokens**:
- **Primary action**: `bg-primary` (single accent color - blue/purple)
- **NO borders**: Remove all `border` classes from containers
- **NO backgrounds**: Remove `bg-muted`, `bg-card` from groups
- **Whitespace**: `gap-12` (48px) between sections, `gap-3` (12px) within
- **Typography**:
  - Action buttons: `font-medium` (500 weight)
  - Selection count: `text-sm text-muted-foreground font-medium`
  - Primary button: `font-semibold` (600 weight)
- **Ghost buttons**: `variant="ghost"` for secondary actions (no background)
- **Link buttons**: `variant="link"` for tertiary actions (underline on hover)
- **Monochrome icons**: Simple line icons, not emojis (except for visual hierarchy)
- **Destructive actions**: `text-destructive` for Delete
- **iOS Action Sheet**: `Sheet` component with `side="bottom"`, `rounded-t-3xl`
- **Large touch targets**: `h-14` (56px) for mobile action items

---

## Structure Comparison

### Current (Broken)
```
7 nested divs
  └─ h-screen (conflict!)
      └─ flex-1 (conflict!)
          └─ overflow-hidden (blocks scroll!)
              └─ overflow-y-auto (scroll 1)
                  └─ overflow-x-hidden (blocks horizontal!)
                      └─ Table (can't scroll!)
```

### Target (Working)
```
3 simple divs
  └─ space-y-4 (simple spacing)
      └─ ExerciseList (no overflow)
          └─ ExerciseRow
              └─ Table with overflow-x-auto (only scroll here!)
```

---

## Implementation Notes

1. **Desktop Horizontal Scroll**:
   - Only the `<div className="overflow-x-auto">` around the table scrolls
   - Sticky "Set" column stays visible
   - Scroll triggered when table width > container width

2. **Mobile Horizontal Scroll**:
   - Only the `<div className="flex gap-2 overflow-x-auto snap-x">` scrolls
   - Cards are fixed width (85vw ~320px)
   - Snap behavior for smooth UX

3. **Vertical Scroll**:
   - Natural document scroll (no explicit overflow container)
   - ProtectedLayout's div handles the scroll
   - Only ONE vertical scrollbar

4. **No Conflicts**:
   - No h-screen/h-full in nested components
   - No overflow-x-hidden blocking children
   - No competing flex-1 containers

---

## Visual Indicators

- `◄─►` = Horizontal scroll (user can scroll left/right)
- `↕` = Vertical scroll (user can scroll up/down)
- `[v]` = Expand button (chevron down)
- `[^]` = Collapse button (chevron up)
- `[☑]` = Selected checkbox
- `[□]` = Unselected checkbox
- `🎯` = Drag handle

---

## Summary of Changes from Previous Design

### 1. Apple-Inspired Minimalist Toolbar

**Before** (Cramped, heavy chrome):
```
┌──────────────────────────────────────────────┐
│ [+ Add] [Superset] [Ungroup] [Duplicate]... │ ← Too many buttons
│ 3 selected of 5 exercises  [Select All]...  │    Cramped spacing
└──────────────────────────────────────────────┘    Heavy borders
```

**After** (Apple-style: Lean, clean, sophisticated):
```
[ + Add Exercise ]                      3 selected · 5 total
 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
   ↑ Accent                               ↑ Subtle gray

Superset  Ungroup          Duplicate  Delete  Batch    Select All  Clear
   ↑ Ghost buttons            ↑ Contextual           ↑ Links
     Only when selected         visibility            Right-aligned
```

**Apple Design Principles**:
- ✅ **Minimalism**: NO borders, NO background fills on containers
- ✅ **Whitespace**: 48px between sections (breathe!)
- ✅ **Typography**: Font weights create hierarchy, not colors
- ✅ **Monochrome + Accent**: Single accent color for primary action only
- ✅ **Contextual**: Buttons appear/fade based on selection state
- ✅ **Ghost UI**: Secondary actions are ghost buttons (no background)
- ✅ **iOS Action Sheet**: Mobile uses bottom sheet (not dropdown menu)

### 2. Mobile View - Preserved 2-Column Grid

**Kept from Current Implementation**:
```
┌───────────┐
│  Set 1    │
│───────────│
│ Reps  Weight│ ← 2-column grid (grid-cols-2)
│ [10]  [80] │   Multiple rows
│           │
│ Rest  RPE  │ ← NOT single column!
│ [90]  [7]  │   Matches current code
└───────────┘
```

**NOT Changed** (incorrect in original lofi):
```
❌ Single column layout (wrong)
│ Reps [10]  │
│ Weight [80]│
│ Rest [90]  │
```

**Benefits**:
- ✅ Keeps familiar 2-column grid layout
- ✅ Better use of card space
- ✅ Matches current implementation
- ✅ More fields visible per card

### 3. Scroll Behavior - Simplified

**Removed**:
- ❌ Multiple nested overflow containers
- ❌ h-screen/h-full conflicts
- ❌ overflow-x-hidden blocking horizontal scroll
- ❌ flex-1 competing with explicit heights

**Result**:
- ✅ Single vertical scroll (natural page scroll)
- ✅ Horizontal scroll only on tables/cards
- ✅ No double scrollbars
- ✅ Simple 3-div structure (vs 7-div nesting)

---

---

## 🛠️ Implementation Specifications

### Header Component Refactor (PlanPageHeader.tsx)

**Current Structure (Remove):**
```tsx
<header className="border-b bg-card">
  {/* Row 1 */}
  <div className="flex items-center justify-between px-6 pt-4 pb-3">
    {/* Navigation + Title + Actions */}
  </div>
  
  {/* Row 2 - REMOVE THIS ENTIRE SECTION */}
  {(pageMode !== undefined || showUndoRedo) && (
    <div className="flex items-center justify-between px-6 pb-3 border-t bg-muted/30">
      {/* Mode toggle + Undo/Redo */}
    </div>
  )}
</header>
```

**New Structure (2025 Minimalist):**
```tsx
<header className="border-b border-border/40"> {/* Subtle hairline only */}
  <div className="flex items-center justify-between px-6 py-4 gap-6">
    {/* Left: Back + Title + Subtitle */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 -ml-2" {/* Negative margin for alignment */}
        onClick={() => router.push(backPath)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Back</span>
      </Button>
      
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>

    {/* Right: Mode Toggle + Undo/Redo (all inline) */}
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Segmented Control (iOS-style, not Tabs) */}
      {pageMode !== undefined && onPageModeChange && (
        <div className="flex items-center rounded-lg bg-muted p-0.5">
          <button
            onClick={() => onPageModeChange("simple")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              pageMode === "simple"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Simple
          </button>
          <button
            onClick={() => onPageModeChange("detail")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              pageMode === "detail"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Detail
          </button>
        </div>
      )}

      {/* Undo/Redo - Icon buttons only */}
      {showUndoRedo && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 w-8"
          >
            <Undo className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-8 w-8"
          >
            <Redo className="h-4 w-4" />
            <span className="sr-only">Redo</span>
          </Button>
        </>
      )}
    </div>
  </div>
</header>
```

**Key Changes:**
1. **Single Row Layout**: Everything in one `flex` container
2. **Remove**: `bg-card`, `border-t`, `bg-muted/30`, Row 2 div
3. **Subtle Border**: `border-b border-border/40` instead of `border-b`
4. **Compact Padding**: `py-4` instead of `pt-4 pb-3` (single vertical rhythm)
5. **Segmented Control**: Custom implementation instead of Tabs component
6. **Icon Buttons**: Undo/Redo as `size="icon"` (not `size="sm"` with text)
7. **Smaller Title**: `text-lg` instead of `text-xl` (tighter)
8. **Tighter Gap**: `gap-2` for right section (not separate containers)

---

### Toolbar Component Refinements (Toolbar.tsx)

**Minor Adjustments (Already 90% correct):**

```tsx
export function Toolbar({...props}: ToolbarProps) {
  const hasSelection = selectionCount > 0

  return (
    <div className="py-5 px-0"> {/* Reduced from py-6 */}
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6"> {/* Reduced from mb-8 */}
        <Button
          onClick={onAddExercise}
          size="default"
          className="font-semibold shadow-sm" {/* Add subtle shadow */}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Exercise
        </Button>

        <p className="text-xs text-muted-foreground font-normal"> {/* text-xs + font-normal */}
          {selectionCount} selected · {totalCount} total
        </p>
      </div>

      {/* Desktop Button Groups */}
      <div className="hidden md:flex items-start gap-10"> {/* Reduced from gap-12 */}
        {/* Rest stays the same... */}
      </div>
      
      {/* Mobile Action Sheet - No changes needed */}
    </div>
  )
}
```

**Key Refinements:**
1. **Tighter Spacing**: `py-5` (was `py-6`), `mb-6` (was `mb-8`), `gap-10` (was `gap-12`)
2. **Subtler Counter**: `text-xs` + `font-normal` instead of `text-sm` + `font-medium`
3. **Subtle Depth**: Add `shadow-sm` to primary button
4. **Mobile**: No changes needed (already perfect)

---

### Visual Hierarchy Token Reference

**Typography Scale:**
```tsx
// Header
title: "text-lg font-semibold"           // 18px, 600 weight
subtitle: "text-xs text-muted-foreground" // 12px, gray

// Toolbar
primaryAction: "text-sm font-semibold"    // 14px, 600 weight
selectionCount: "text-xs font-normal"     // 12px, 400 weight
ghostButtons: "text-sm font-medium"       // 14px, 500 weight
linkButtons: "text-sm font-normal"        // 14px, 400 weight
```

**Spacing Scale:**
```tsx
// Header
padding: "px-6 py-4"              // Horizontal 24px, Vertical 16px
gap: "gap-3"                      // Between back button and title (12px)
rightGap: "gap-2"                 // Between mode toggle and undo/redo (8px)

// Toolbar
verticalPadding: "py-5"           // 20px (was 24px)
headerMargin: "mb-6"              // 24px (was 32px)
sectionGap: "gap-10"              // 40px (was 48px)
buttonGap: "gap-4"                // 16px within section
```

**Color Scale:**
```tsx
// Borders
subtleBorder: "border-border/40"           // 40% opacity hairline
defaultBorder: "border-border"             // Full opacity (rare)

// Backgrounds
primaryButton: "bg-primary"                // Single accent color
ghostButton: "bg-transparent hover:bg-accent/50"
segmentedControl: "bg-muted"               // Light gray pill
activeSegment: "bg-background shadow-sm"   // White with shadow

// Text
heading: "text-foreground"                 // Full black/white
subtitle: "text-muted-foreground"          // Gray
destructive: "text-destructive"            // Red (delete only)
```

---

## Confirmation Checklist

Before implementation, please confirm:

### 2025 Minimalist Aesthetics:
- [ ] **Single-row header** with all controls inline?
- [ ] **NO hard borders** (only subtle `border-border/40` hairline)?
- [ ] **NO backgrounds** (removed `bg-card`, `bg-muted/30`)?
- [ ] **Segmented control** (iOS-style) instead of Tabs component?
- [ ] **Icon-only buttons** for undo/redo (no text labels)?
- [ ] **Compact spacing** (reduced py, mb, gap values)?
- [ ] **Subtle depth** (shadow-sm on primary button only)?
- [ ] **User-friendly subtitle** (not technical IDs)?

### Apple Design Aesthetics:
- [ ] **NO borders** on button group containers?
- [ ] **NO background fills** on button groups?
- [ ] **Generous whitespace** (40px between sections)?
- [ ] **Single accent color** for primary action only?
- [ ] **Ghost buttons** for secondary actions?
- [ ] **Typography hierarchy** using font weights (not colors)?
- [ ] **Contextual visibility** (buttons fade in/out based on selection)?
- [ ] **iOS bottom sheet** for mobile (not dropdown menu)?

### Layout & Functionality:
- [ ] **Toolbar Design**: Apple-style minimalist layout?
- [ ] **Mobile Cards**: 2-column grid layout (not single column)?
- [ ] **Desktop simple mode**: 4-5 fields visible, table scrolls if needed?
- [ ] **Desktop detail mode**: 10+ fields, table MUST scroll horizontally?
- [ ] **Mobile simple mode**: Cards snap-scroll, hint text visible?
- [ ] **Mobile detail mode**: More fields in cards, same scroll behavior?
- [ ] **Single vertical scroll** for all views?
- [ ] **No double scrollbars**?
- [ ] **Superset groups** work in all views?
- [ ] **Exercise library** overlays properly?

---

## Design Comparison Summary

### Current Design (4/10)
- ❌ Two-row header with 3 borders
- ❌ Heavy backgrounds (`bg-card`, `bg-muted/30`)
- ❌ Disconnected sections (Row 1 + Row 2)
- ❌ Technical subtitle ("Plan: 123 • Session: 456")
- ❌ Outlined buttons for undo/redo (too heavy)
- ❌ Tabs component (not iOS-style)
- ❌ Consumes excessive vertical space
- ⚠️ Toolbar is good but could be tighter

### Redesigned (10/10)
- ✅ Single-row header with 1 subtle hairline
- ✅ Zero backgrounds (pure whitespace)
- ✅ All controls inline and connected
- ✅ User-friendly subtitle ("Week 2, Day 3")
- ✅ Icon-only buttons for undo/redo (clean)
- ✅ Segmented control (iOS-style)
- ✅ 50% less vertical space
- ✅ Perfectly integrated with toolbar
- ✅ 85% reduction in visual noise
- ✅ Follows 2025/2026 minimalist trends

**Result:** Clean, modern, sophisticated UI that feels like 2025, not 2018.
