"use client"

import { useEffect, useRef } from 'react'

/**
 * SVG filter — electric text effect.
 * Text is clean and glowing 90% of the time.
 * Short zaps (50-80ms) every 1.5-4s create momentary edge crackle.
 * Apply via: style={{ filter: 'url(#electric-crackle)' }}
 */
export default function ElectricArcs({ disabled }: { disabled?: boolean }) {
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (disabled) return
    const displacement = displacementRef.current
    const turb = turbRef.current
    if (!displacement || !turb) return

    let nextZap = performance.now() + 1500 + Math.random() * 2000
    let zapEnd = 0
    let seed = 0

    const animate = () => {
      const now = performance.now()

      if (now > nextZap && now > zapEnd) {
        // Zap — brief edge crackle
        displacement.setAttribute('scale', String(2 + Math.random() * 2))
        zapEnd = now + 50 + Math.random() * 60
        nextZap = now + 1500 + Math.random() * 2500
      } else if (now > zapEnd) {
        // Clean — no displacement
        displacement.setAttribute('scale', '0')
      }

      // Only cycle seed during zaps (frozen otherwise = no shaking)
      if (now < zapEnd) {
        seed = (seed + 1) % 100
        turb.setAttribute('seed', String(seed))
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [disabled])

  return (
    <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
      <defs>
        <filter id="electric-crackle" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            ref={turbRef}
            type="turbulence"
            baseFrequency="0.035"
            numOctaves="2"
            seed="0"
            result="noise"
          />

          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="noise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          {/* Subtle indigo glow halo */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="glow" />
          <feColorMatrix
            in="glow"
            type="matrix"
            values="0 0 0 0 0.388
                    0 0 0 0 0.4
                    0 0 0 0 0.945
                    0 0 0 0.5 0"
            result="coloredGlow"
          />

          <feMerge>
            <feMergeNode in="coloredGlow" />
            <feMergeNode in="displaced" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
