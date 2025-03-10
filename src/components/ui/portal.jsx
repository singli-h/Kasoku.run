"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function Portal({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Only render on client
  if (!mounted) return null

  return createPortal(
    <div className="portal-root z-[100]">
      {children}
    </div>,
    document.body
  )
} 