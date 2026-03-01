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
        if (d[(y * iw + x) * 4 + 3] > 128) pts.push({ x, y })
      }
    }

    textPixelsRef.current = pts
  }, [])

  const spawnArcs = useCallback(() => {
    const pixels = textPixelsRef.current
    if (pixels.length < 20) return

    const count = 2 + Math.floor(Math.random() * 4)
    const now = performance.now()

    for (let n = 0; n < count; n++) {
      const a = pixels[Math.floor(Math.random() * pixels.length)]
      const b = pixels[Math.floor(Math.random() * pixels.length)]
      const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
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

    const textEl = parent.querySelector('[data-electric-text]') as HTMLElement | null
    let cw = 0
    let ch = 0

    const measure = () => {
      const dpr = window.devicePixelRatio || 1
      cw = parent.clientWidth
      ch = parent.clientHeight
      canvas.width = cw * dpr
      canvas.height = ch * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (textEl) {
        const s = getComputedStyle(textEl)
        calcTextPixels(cw, ch, `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`)
      }
    }

    // Ensure web fonts are loaded before sampling text pixels
    document.fonts.ready.then(() => {
      dimKeyRef.current = ''
      measure()
    })

    const ro = new ResizeObserver(() => measure())
    ro.observe(parent)

    let nextSpawn = performance.now() + 200

    const draw = () => {
      const now = performance.now()

      if (!cw || !ch || !fontRef.current) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, cw, ch)

      const isDark = document.documentElement.classList.contains('dark')
      const textColor = isDark ? '#c7d2fe' : '#4338ca'

      // Spawn arcs
      if (now > nextSpawn && textPixelsRef.current.length > 0) {
        spawnArcs()
        nextSpawn = now + 60 + Math.random() * 180
      }

      // Subtle flicker
      const flicker = 1 - 0.08 * Math.sin(now / 500) * Math.sin(now / 313)
      ctx.globalAlpha = Math.max(0.88, flicker)

      // 1) Draw base text with glow — this IS the visible "Accelerate"
      ctx.font = fontRef.current
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = textColor

      if (isDark) {
        ctx.save()
        ctx.shadowColor = 'rgba(99, 102, 241, 0.9)'
        ctx.shadowBlur = 4
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.shadowColor = 'rgba(99, 102, 241, 0.6)'
        ctx.shadowBlur = 12
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.shadowColor = 'rgba(99, 102, 241, 0.4)'
        ctx.shadowBlur = 30
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.shadowColor = 'rgba(99, 102, 241, 0.2)'
        ctx.shadowBlur = 60
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.restore()
      } else {
        ctx.save()
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)'
        ctx.shadowBlur = 4
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.shadowColor = 'rgba(99, 102, 241, 0.3)'
        ctx.shadowBlur = 12
        ctx.fillText('Accelerate', cw / 2, ch / 2)
        ctx.restore()
      }

      // Crisp text on top
      ctx.shadowBlur = 0
      ctx.fillText('Accelerate', cw / 2, ch / 2)

      ctx.globalAlpha = 1

      // 2) Draw arcs — source-atop: only renders where text pixels exist
      ctx.globalCompositeOperation = 'source-atop'

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

        // Indigo glow stroke
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.strokeStyle = `rgba(129, 140, 248, ${alpha * 0.6})`
        ctx.lineWidth = arc.width * 3
        ctx.stroke()

        // White-hot core
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.strokeStyle = `rgba(224, 231, 255, ${alpha * 0.9})`
        ctx.lineWidth = arc.width
        ctx.stroke()

        return true
      })

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
