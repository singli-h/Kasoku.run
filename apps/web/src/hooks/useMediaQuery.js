"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    // Default to true on SSR
    if (typeof window === 'undefined') {
      setMatches(true)
      return
    }
    
    const media = window.matchMedia(query)
    
    const listener = () => {
      setMatches(media.matches)
    }
    
    // Set initial value
    setMatches(media.matches)
    
    // Add listener
    media.addEventListener('change', listener)
    
    // Clean up listener on unmount
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
} 