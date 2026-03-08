/*
<ai_context>
React hook for managing PWA installation prompts.
Handles:
- Capturing the beforeinstallprompt event (Android/Chrome/Edge)
- Detecting iOS devices for manual install instructions
- Detecting if app is already installed (standalone mode)
- Triggering the native install prompt
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallState {
  /** Whether the app can be installed (prompt available or iOS) */
  canInstall: boolean
  /** Whether the app is already installed (running in standalone mode) */
  isInstalled: boolean
  /** Whether this is an iOS device (needs manual install instructions) */
  isIOS: boolean
  /** Whether this is an Android device */
  isAndroid: boolean
  /** Whether the install prompt is available (Android/Chrome) */
  hasPrompt: boolean
  /** Whether an install operation is in progress */
  isInstalling: boolean
}

interface UsePWAInstallReturn extends PWAInstallState {
  /** Trigger the native install prompt (Android/Chrome/Edge) */
  promptInstall: () => Promise<boolean>
}

/**
 * Hook for managing PWA installation
 *
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall()
 *
 *   if (isInstalled) return <p>App is installed!</p>
 *   if (!canInstall) return null
 *
 *   if (isIOS) {
 *     return <IOSInstallInstructions />
 *   }
 *
 *   return <button onClick={promptInstall}>Install App</button>
 * }
 * ```
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    hasPrompt: false,
    isInstalling: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad Pro detection
    const isAndroid = /android/.test(userAgent)

    // Check if already installed (running as standalone PWA)
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isInstalled,
      // iOS can always show install instructions (unless already installed)
      canInstall: isIOS && !isInstalled
    }))

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState(prev => ({
        ...prev,
        hasPrompt: true,
        canInstall: !prev.isInstalled
      }))
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        hasPrompt: false
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Also check display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setState(prev => ({
          ...prev,
          isInstalled: true,
          canInstall: false
        }))
      }
    }
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false
    }

    setState(prev => ({ ...prev, isInstalling: true }))

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setState(prev => ({
          ...prev,
          isInstalling: false,
          hasPrompt: false
        }))
        return true
      }

      setState(prev => ({ ...prev, isInstalling: false }))
      return false
    } catch (error) {
      console.error('[usePWAInstall] Error prompting install:', error)
      setState(prev => ({ ...prev, isInstalling: false }))
      return false
    }
  }, [deferredPrompt])

  return { ...state, promptInstall }
}

/**
 * Check if the current browser supports PWA installation
 */
export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'serviceWorker' in navigator &&
    'BeforeInstallPromptEvent' in window
  )
}
