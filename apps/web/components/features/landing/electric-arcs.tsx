"use client"

import { useEffect, useRef, useCallback } from 'react'

interface Arc {
  points: { x: number; y: number }[]
  birth: number
  life: number
  opacity: number
  width: number
}

function jitterLine(
  x1: number, y1: number, x2: number, y2: number,
  displacement: number, depth: number
): { x: number; y: number }[] {
  if (depth === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * displacement
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * displacement
  const left = jitterLine(x1, y1, mx, my, displacement * 0.55, depth - 1)
  const right = jitterLine(mx, my, x2, y2, displacement * 0.55, depth - 1)
  return [...left.slice(0, -1), ...right]
}

export default function ElectricArcs({ disabled }: { disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const arcsRef = useRef<Arc[]>([])
  const textPixelsRef = useRef<{ x: number; y: number }[]>([])
  const fontRef = useRef('')
  const dimKeyRef = useRef('')
  const rafRef = useRef<number>(0)

  /* Sample all filled text pixels (the entire letter body) */
  const calcTextPixels = useCallback((w: number, h: number, font: string) => {
    const key = `${w}x${h}:${font}`
    if (key === dimKeyRef.current) return
    dimKeyRef.current = key
    fontRef.current = font

    const off = document.createElement('canvas')
    const iw = Math.round(w)
    const ih = Math.round(h)
    off.width = iw
    off.height = ih
    const octx = off.getContext('2d')!
    octx.font = font
    octx.textAlign = 'center'
    octx.textBaseline = 'middle'
    octx.fillStyle = '#fff'
    octx.fillText('Accelerate', iw / 2, ih / 2)

    const img = octx.getImageData(0, 0, iw, ih)
    const d = img.data
    const pts: { x: number; y: number }[] = []

    for (let y = 0; y < ih; y += 3) {
      for (let x = 0; x < iw; x += 3) {
        if (d[(y * iw + x) * 4 + 3] > 128) {
          pts.push({ x, y })
        }
      }
    }

    textPixelsRef.current = pts
  }, [])

  /* Spawn arcs between random points INSIDE the text body */
  const spawnArcs = useCallback(() => {
    const pixels = textPixelsRef.current
    if (pixels.length < 20) return

    const count = 2 + Math.floor(Math.random() * 4)
    const now = performance.now()

    for (let n = 0; n < count; n++) {
      const a = pixels[Math.floor(Math.random() * pixels.length)]
      const b = pixels[Math.floor(Math.random() * pixels.length)]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy)

      if (len < 15 || len > 90) continue

      arcsRef.current.push({
        points: jitterLine(a.x, a.y, b.x, b.y, len * 0.25, 3),
        birth: now + Math.random() * 30,
        life: 60 + Math.random() * 120,
        opacity: 0.6 + Math.random() * 0.4,
        width: 0.4 + Math.random() * 1,
      })
    }
  }, [])

  useEffect(() => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement
    if (!parent) return

    const textEl = parent.querySelector('.hero-electric-text') as HTMLElement | null

    const ro = new ResizeObserver(([e]) => {
      const dpr = window.devicePixelRatio || 1
      const w = e.contentRect.width
      const h = e.contentRect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (textEl) {
        const s = getComputedStyle(textEl)
        calcTextPixels(Math.round(w), Math.round(h), `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`)
      }
    })
    ro.observe(parent)

    let nextSpawn = performance.now() + 200

    const draw = () => {
      const now = performance.now()
      const w = parent.clientWidth
      const h = parent.clientHeight

      ctx.clearRect(0, 0, w, h)

      if (now > nextSpawn && textPixelsRef.current.length > 0) {
        spawnArcs()
        nextSpawn = now + 60 + Math.random() * 180
      }

      // 1) Draw all arcs normally
      ctx.globalCompositeOperation = 'source-over'

      arcsRef.current = arcsRef.current.filter(arc => {
        const age = now - arc.birth
        if (age > arc.life) return false

        const progress = age / arc.life
        const fade = progress < 0.1
          ? progress / 0.1
          : 1 - ((progress - 0.1) / 0.9) ** 2

        const alpha = arc.opacity * fade
        if (alpha < 0.01) return true

        const pts = arc.points

        // Outer glow
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.5})`
        ctx.lineWidth = arc.width * 4
        ctx.shadowColor = 'rgba(99, 102, 241, 0.6)'
        ctx.shadowBlur = 12
        ctx.stroke()

        // Core — white hot
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.strokeStyle = `rgba(220, 225, 255, ${alpha * 0.9})`
        ctx.lineWidth = arc.width
        ctx.shadowColor = 'rgba(180, 190, 255, 0.8)'
        ctx.shadowBlur = 4
        ctx.stroke()

        ctx.shadowBlur = 0
        return true
      })

      // 2) MASK — clip everything to text shape
      // 'destination-in' keeps only existing pixels where the new fill has alpha
      ctx.globalCompositeOperation = 'destination-in'
      ctx.font = fontRef.current
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText('Accelerate', w / 2, h / 2)
      ctx.globalCompositeOperation = 'source-over'

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [disabled, calcTextPixels, spawnArcs])

  if (disabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    />
  )
}
