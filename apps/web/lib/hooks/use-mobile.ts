"use client"

import { useState, useEffect } from 'react'

export interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  isPWA: boolean
  isIOS: boolean
  isAndroid: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: {
    width: number
    height: number
  }
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isPWA: false,
    isIOS: false,
    isAndroid: false,
    orientation: 'landscape',
    screenSize: { width: 1920, height: 1080 },
    breakpoint: 'xl'
  })

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Breakpoint detection (Tailwind CSS breakpoints)
      let breakpoint: MobileDetection['breakpoint'] = 'xs'
      if (width >= 1536) breakpoint = '2xl'
      else if (width >= 1280) breakpoint = 'xl'
      else if (width >= 1024) breakpoint = 'lg'
      else if (width >= 768) breakpoint = 'md'
      else if (width >= 640) breakpoint = 'sm'
      
      // Device type detection
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      
      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           (navigator as any).msMaxTouchPoints > 0
      
      // PWA detection
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true ||
                   document.referrer.includes('android-app://')
      
      // Platform detection
      const isIOS = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream
      const isAndroid = /android/.test(userAgent)
      
      // Orientation detection
      const orientation = height > width ? 'portrait' : 'landscape'
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isPWA,
        isIOS,
        isAndroid,
        orientation,
        screenSize: { width, height },
        breakpoint
      })
    }

    // Initial detection
    updateDetection()
    
    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDetection)
    window.addEventListener('orientationchange', updateDetection)
    
    // PWA install detection
    const handleBeforeInstallPrompt = () => {
      updateDetection()
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('resize', updateDetection)
      window.removeEventListener('orientationchange', updateDetection)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleBeforeInstallPrompt)
    }
  }, [])

  return detection
}

// Simplified mobile hook for basic usage
export function useIsMobile(): boolean {
  const { isMobile } = useMobile()
  return isMobile
}

// Touch-friendly hook
export function useTouch(): boolean {
  const { isTouchDevice } = useMobile()
  return isTouchDevice
}

// PWA hook
export function usePWA(): boolean {
  const { isPWA } = useMobile()
  return isPWA
} 