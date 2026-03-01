"use client"

import { useEffect, useRef, useCallback } from 'react'

// --- Types ---

interface Point {
  x: number
  y: number
}

interface BoltSegment {
  points: Point[]
  opacity: number
  thickness: number
  branchDepth: number
}

interface LightningBolt {
  segments: BoltSegment[]
  life: number      // 0..1, starts at 1, decays to 0
  maxLife: number   // total lifespan in ms
  birthTime: number
}

interface LightningCanvasProps {
  /** Whether to disable animations (reduced motion) */
  disabled?: boolean
}

// --- Algorithm: Midpoint displacement ---

function midpointDisplace(
  start: Point,
  end: Point,
  displacement: number,
  iterations: number,
): Point[] {
  let points = [start, end]

  for (let i = 0; i < iterations; i++) {
    const newPoints: Point[] = []
    for (let j = 0; j < points.length - 1; j++) {
      const a = points[j]
      const b = points[j + 1]

      // Midpoint
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2

      // Perpendicular direction
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const nx = -dy / (len || 1)
      const ny = dx / (len || 1)

      // Random offset along perpendicular
      const offset = (Math.random() - 0.5) * displacement
      const mid: Point = {
        x: mx + nx * offset,
        y: my + ny * offset,
      }

      newPoints.push(a, mid)
    }
    newPoints.push(points[points.length - 1])
    points = newPoints
    displacement *= 0.52 // Roughness decay
  }

  return points
}

// --- Generate a bolt with optional branches ---

function generateBolt(
  start: Point,
  end: Point,
  branchDepth: number = 0,
): BoltSegment[] {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  const displacement = dist * 0.25
  const iterations = 5
  const points = midpointDisplace(start, end, displacement, iterations)

  const segments: BoltSegment[] = [
    {
      points,
      opacity: branchDepth === 0 ? 1 : 0.5,
      thickness: branchDepth === 0 ? 2 : 1,
      branchDepth,
    },
  ]

  // Branching — only up to depth 2
  if (branchDepth < 2) {
    const branchCount = branchDepth === 0 ? 2 + Math.floor(Math.random() * 2) : Math.random() < 0.4 ? 1 : 0
    for (let b = 0; b < branchCount; b++) {
      // Pick a random point along the main bolt (20%-80% of the way)
      const idx = Math.floor(points.length * (0.2 + Math.random() * 0.6))
      const branchStart = points[idx]

      // Branch direction: deviate 25-55 degrees from main direction
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2 + (Math.random() < 0.5 ? 0.5 : -0.5)
      const branchLen = dist * (0.2 + Math.random() * 0.25) / (branchDepth + 1)
      const branchEnd: Point = {
        x: branchStart.x + Math.cos(angle) * branchLen,
        y: branchStart.y + Math.sin(angle) * branchLen,
      }

      segments.push(...generateBolt(branchStart, branchEnd, branchDepth + 1))
    }
  }

  return segments
}

// --- Render a bolt with multi-pass glow ---

function drawBolt(ctx: CanvasRenderingContext2D, bolt: LightningBolt, dpr: number) {
  const alpha = bolt.life

  if (alpha <= 0) return

  for (const segment of bolt.segments) {
    if (segment.points.length < 2) continue

    const segAlpha = alpha * segment.opacity

    // Pass 1: Outer glow (wide, dim, large blur)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(140, 160, 255, ${segAlpha * 0.25})`
    ctx.lineWidth = (segment.thickness * 5) * dpr
    ctx.shadowColor = 'rgba(120, 140, 255, 0.6)'
    ctx.shadowBlur = 25 * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(segment.points[0].x * dpr, segment.points[0].y * dpr)
    for (let i = 1; i < segment.points.length; i++) {
      ctx.lineTo(segment.points[i].x * dpr, segment.points[i].y * dpr)
    }
    ctx.stroke()
    ctx.restore()

    // Pass 2: Mid glow
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(180, 200, 255, ${segAlpha * 0.5})`
    ctx.lineWidth = (segment.thickness * 2.5) * dpr
    ctx.shadowColor = 'rgba(160, 180, 255, 0.5)'
    ctx.shadowBlur = 10 * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(segment.points[0].x * dpr, segment.points[0].y * dpr)
    for (let i = 1; i < segment.points.length; i++) {
      ctx.lineTo(segment.points[i].x * dpr, segment.points[i].y * dpr)
    }
    ctx.stroke()
    ctx.restore()

    // Pass 3: Bright core (thin, white)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha * 0.9})`
    ctx.lineWidth = segment.thickness * dpr
    ctx.shadowColor = 'rgba(200, 220, 255, 0.8)'
    ctx.shadowBlur = 4 * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(segment.points[0].x * dpr, segment.points[0].y * dpr)
    for (let i = 1; i < segment.points.length; i++) {
      ctx.lineTo(segment.points[i].x * dpr, segment.points[i].y * dpr)
    }
    ctx.stroke()
    ctx.restore()
  }
}

// --- Component ---

export default function LightningCanvas({ disabled = false }: LightningCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const boltsRef = useRef<LightningBolt[]>([])
  const nextFireRef = useRef<number>(0)
  const flashRef = useRef<number>(0)

  const spawnBolts = useCallback((width: number, height: number) => {
    const now = performance.now()
    const count = 1 + Math.floor(Math.random() * 2) // 1-2 bolts per cluster

    for (let i = 0; i < count; i++) {
      // Bolts originate from edges of the text area
      // The canvas is positioned over the text, so we spawn from edges
      const side = Math.random()
      let start: Point
      let end: Point

      if (side < 0.25) {
        // Left edge → outward left
        start = { x: width * (0.05 + Math.random() * 0.15), y: height * (0.15 + Math.random() * 0.7) }
        end = { x: -width * (0.05 + Math.random() * 0.2), y: start.y + (Math.random() - 0.5) * height * 0.6 }
      } else if (side < 0.5) {
        // Right edge → outward right
        start = { x: width * (0.85 + Math.random() * 0.1), y: height * (0.15 + Math.random() * 0.7) }
        end = { x: width * (1.05 + Math.random() * 0.2), y: start.y + (Math.random() - 0.5) * height * 0.6 }
      } else if (side < 0.7) {
        // Top edge → upward
        start = { x: width * (0.1 + Math.random() * 0.8), y: height * 0.1 }
        end = { x: start.x + (Math.random() - 0.5) * width * 0.3, y: -height * (0.1 + Math.random() * 0.15) }
      } else {
        // Across the text — short arc
        const startX = width * (0.1 + Math.random() * 0.3)
        const endX = width * (0.6 + Math.random() * 0.3)
        start = { x: startX, y: height * (0.3 + Math.random() * 0.4) }
        end = { x: endX, y: height * (0.3 + Math.random() * 0.4) }
      }

      const maxLife = 150 + Math.random() * 200 // 150-350ms
      boltsRef.current.push({
        segments: generateBolt(start, end),
        life: 1,
        maxLife,
        birthTime: now + i * 40, // slight stagger between bolts in cluster
      })
    }

    flashRef.current = 1 // trigger text flash
  }, [])

  useEffect(() => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let mounted = true

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    // Schedule first bolt
    nextFireRef.current = performance.now() + 1500 + Math.random() * 2000

    const animate = (timestamp: number) => {
      if (!mounted) return

      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) {
        animFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const dpr = window.devicePixelRatio || 1
      const w = rect.width
      const h = rect.height

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn new bolts if it's time
      if (timestamp >= nextFireRef.current) {
        spawnBolts(w, h)
        // Next fire: 3-7 seconds from now (irregular)
        nextFireRef.current = timestamp + 3000 + Math.random() * 4000
      }

      // Update and draw bolts
      const activeBolts: LightningBolt[] = []
      for (const bolt of boltsRef.current) {
        const elapsed = timestamp - bolt.birthTime
        if (elapsed < 0) {
          // Not born yet (stagger)
          activeBolts.push(bolt)
          continue
        }

        bolt.life = Math.max(0, 1 - elapsed / bolt.maxLife)

        if (bolt.life > 0) {
          drawBolt(ctx, bolt, dpr)
          activeBolts.push(bolt)
        }
      }
      boltsRef.current = activeBolts

      // Decay flash
      if (flashRef.current > 0) {
        flashRef.current = Math.max(0, flashRef.current - 0.06)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      mounted = false
      cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
    }
  }, [disabled, spawnBolts])

  if (disabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
