/*
<ai_context>
React hook for managing PWA push notification subscriptions.
Handles:
- Checking browser support
- Registering service worker
- Requesting notification permission
- Subscribing/unsubscribing to push notifications
- Syncing subscription state with server
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback } from 'react'

interface PushSubscriptionState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean
  /** Whether the user is currently subscribed to push notifications */
  isSubscribed: boolean
  /** Whether an operation is in progress */
  isLoading: boolean
  /** Current notification permission status */
  permission: NotificationPermission | null
  /** Error message if an operation failed */
  error: string | null
}

interface UsePushNotificationsReturn extends PushSubscriptionState {
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
}

/**
 * Hook for managing PWA push notification subscriptions
 *
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, error } = usePushNotifications()
 *
 *   if (!isSupported) return <p>Push notifications not supported</p>
 *
 *   return (
 *     <button
 *       onClick={isSubscribed ? unsubscribe : subscribe}
 *       disabled={isLoading}
 *     >
 *       {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
 *     </button>
 *   )
 * }
 * ```
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: null,
    error: null
  })

  // Check support and existing subscription on mount
  useEffect(() => {
    const checkSupport = async () => {
      // Check if all required APIs are available
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      if (!supported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          permission: null
        }))
        return
      }

      try {
        // Get current permission status
        const permission = Notification.permission

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // Check existing subscription
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
          permission,
          error: null
        })
      } catch (err) {
        console.error('[usePushNotifications] Error initializing:', err)
        setState(prev => ({
          ...prev,
          isSupported: true, // APIs exist, just failed to initialize
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to initialize push notifications'
        }))
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      setState(prev => ({ ...prev, permission }))

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Notification permission denied. Please enable notifications in your browser settings.'
        }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured')
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Extract keys from subscription
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys')
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhKey),
            auth: arrayBufferToBase64(authKey)
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save subscription')
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        error: null
      }))

      return true
    } catch (err) {
      console.error('[usePushNotifications] Subscribe error:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Subscription failed'
      }))
      return false
    }
  }, [])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null
      }))

      return true
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe error:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unsubscribe failed'
      }))
      return false
    }
  }, [])

  return { ...state, subscribe, unsubscribe }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a URL-safe base64 string to a Uint8Array
 * Used for VAPID public key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  // Create ArrayBuffer first to ensure proper typing
  const arrayBuffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(arrayBuffer)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Convert an ArrayBuffer to a base64 string
 * Used for encoding subscription keys
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return window.btoa(binary)
}
