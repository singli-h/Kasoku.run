# Remotion — Programmatic Video Generation

**Status**: Research / Future Integration
**Website**: https://remotion.dev
**GitHub**: https://github.com/remotion-dev/remotion (36K+ stars)
**Latest Version**: v4.0.421 (Feb 2026)
**License**: Free for teams ≤3, paid for 4+ employees (remotion.pro)

## What It Is

React framework for creating videos with code. Write React components, render them frame-by-frame into MP4/WebM/GIF.

## Why It Fits Kasoku.run

- Same stack: React, TypeScript, Tailwind CSS, Next.js
- Data-driven: Pass athlete data as props → unique videos per user
- Our Recharts data structures feed directly into Remotion compositions
- Framer Motion knowledge transfers (springs, interpolation)

## Use Cases for Kasoku

| Use Case | Priority | Duration | Description |
|----------|----------|----------|-------------|
| PR Celebration Videos | High | 5-10s | Auto-generated when athlete hits a personal best. Shareable on social. |
| Training Block Summaries | High | 15-30s | Animated recap after completing a mesocycle (volume progression, PRs, phases). |
| Sprint Session Breakdowns | Medium | 10-20s | Animated split times, velocity curves, phase analysis. |
| Coach Promo Videos | Medium | 30-60s | Coaches generate ads showing athlete improvements. |
| Season Year-in-Review | Low | 30-60s | GitHub Unwrapped-style annual recap. |

## Key Packages

```
remotion                  # Core library
@remotion/player          # Embed preview player in Next.js
@remotion/renderer        # Node.js rendering
@remotion/lambda          # AWS Lambda cloud rendering
@remotion/cloudrun        # Google Cloud Run rendering
@remotion/cli             # Command-line tools
@remotion/paths           # SVG path animations (line charts)
@remotion/transitions     # Scene transitions
@remotion/google-fonts    # Font loading
@remotion/tailwind-v4     # Tailwind v4 support
@remotion/captions        # Subtitle primitives
@remotion/lottie          # After Effects animations
```

## Architecture Overview

```
Composition (React Component)
├── useCurrentFrame()     → drives ALL animations
├── useVideoConfig()      → fps, width, height, duration
├── <Sequence>            → timeline segments
├── interpolate()         → map frame → value
├── spring()              → natural motion
└── Props (Zod schema)    → parametrized data input
```

## Critical Rules

- ALL animations driven by `useCurrentFrame()` — never CSS transitions or Tailwind `animate-*`
- Use `interpolate()` and `spring()` for values
- `<Sequence>` for timeline management
- `delayRender()` / `continueRender()` for async data loading
- Disable all third-party library animations (causes flickering)

## Cost Estimates

| Method | Cost | Speed |
|--------|------|-------|
| Local rendering | Free | Slow (2-5min per 30s video), blocks machine |
| AWS Lambda | ~$0.10/video | Fast (distributed), needs infra setup |
| Google Cloud Run | Similar | Alternative to Lambda |

At 100 videos/day = ~$300/month on Lambda.

## Implementation Approach (When Ready)

1. Add `packages/video` to monorepo for compositions
2. Build first composition (PR Celebration — simplest)
3. Use `@remotion/player` for in-app preview
4. API route at `/api/video/render` for rendering
5. Store rendered videos in Supabase Storage
6. Scale with Lambda when needed

## AI Skills for Claude Code

Remotion provides AI-ready skill files at:
https://github.com/remotion-dev/skills/tree/main/skills/remotion

37 rule files covering charts, animations, tailwind, transitions, text, audio, maps, voiceover, etc. Can be added to `.claude/skills/remotion/` for Claude Code to use when writing compositions.

## References

- Docs: https://remotion.dev/docs
- Next.js Template: https://github.com/remotion-dev/template-next-app-dir
- GitHub Unwrapped (real-world example): https://github.com/remotion-dev/github-unwrapped-2023
- AI Kickstart: https://github.com/thecmdrunner/claude-remotion-kickstart
- Skills for AI: https://github.com/remotion-dev/skills/tree/main/skills/remotion
