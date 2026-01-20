/*
<ai_context>
Service Worker for PWA Push Notifications.
Handles push events from the Web Push API and displays notifications.
Also handles notification clicks to open the app.
</ai_context>
*/

// Service Worker version for cache management
const SW_VERSION = '1.0.0'

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing, version:', SW_VERSION)
  self.skipWaiting()
})

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating')
  event.waitUntil(clients.claim())
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  // Default notification data
  let data = {
    title: 'Kasoku Training',
    body: 'You have a workout scheduled today!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'workout-reminder',
    data: { url: '/dashboard' }
  }

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
      // Try as text
      try {
        data.body = event.data.text()
      } catch (textError) {
        console.error('[SW] Error reading push text:', textError)
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'workout-reminder',
    data: data.data || { url: '/dashboard' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    renotify: true,
    actions: [
      { action: 'open', title: 'Start Workout' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  // Close the notification
  event.notification.close()

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/dashboard'

  // If user clicked dismiss, do nothing else
  if (event.action === 'dismiss') {
    return
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate existing window and focus it
            return client.navigate(urlToOpen).then(() => client.focus())
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})
