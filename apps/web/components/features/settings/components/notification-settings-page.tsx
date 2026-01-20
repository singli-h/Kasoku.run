/*
<ai_context>
This component provides notification preferences that integrate with Clerk's UserProfile overlay.
Styled to exactly match Clerk's native UI structure and classes.
Includes PWA push notification support for workout reminders.
</ai_context>
*/

"use client"

import { Bell, Clock, Loader2 } from "lucide-react"
import { useState, useEffect, useTransition } from "react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import {
  getReminderPreferencesAction,
  updateReminderPreferencesAction,
  type ReminderPreferences
} from "@/actions/notifications"
import { toast } from "sonner"

export function NotificationSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Push notification state from hook
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    permission,
    error: pushError,
    subscribe,
    unsubscribe
  } = usePushNotifications()

  // Reminder preferences state
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    workout_reminders_enabled: true,
    preferred_time: '09:00'
  })
  const [prefsLoading, setPrefsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    // Load preferences from server
    getReminderPreferencesAction().then((result) => {
      if (result.isSuccess && result.data) {
        setPreferences({
          workout_reminders_enabled: result.data.workout_reminders_enabled,
          // Convert HH:MM:SS to HH:MM for input
          preferred_time: result.data.preferred_time.slice(0, 5)
        })
      }
      setPrefsLoading(false)
    })
  }, [])

  if (!mounted) return null

  // Handle push notification toggle
  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe()
      if (success) {
        toast.success("Notifications disabled")
      } else {
        toast.error("Failed to disable notifications")
      }
    } else {
      const success = await subscribe()
      if (success) {
        toast.success("Notifications enabled")
      } else if (permission === 'denied') {
        toast.error("Please enable notifications in your browser settings")
      } else {
        toast.error("Failed to enable notifications")
      }
    }
  }

  // Handle reminder enabled toggle
  const handleReminderToggle = () => {
    const newValue = !preferences.workout_reminders_enabled

    setPreferences(prev => ({ ...prev, workout_reminders_enabled: newValue }))

    startTransition(async () => {
      const result = await updateReminderPreferencesAction({
        workout_reminders_enabled: newValue
      })

      if (!result.isSuccess) {
        // Revert on error
        setPreferences(prev => ({ ...prev, workout_reminders_enabled: !newValue }))
        toast.error("Failed to update preference")
      }
    })
  }

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setPreferences(prev => ({ ...prev, preferred_time: newTime }))

    startTransition(async () => {
      const result = await updateReminderPreferencesAction({
        preferred_time: newTime
      })

      if (!result.isSuccess) {
        toast.error("Failed to update reminder time")
      } else {
        toast.success("Reminder time updated")
      }
    })
  }

  const isLoading = isPushLoading || prefsLoading || isPending

  return (
    <div className="cl-pageScrollBox cl-internal-1una0r3">
      <div className="cl-page cl-internal-1jipkho">
        <div className="cl-profilePage cl-profilePage__notifications cl-internal-1ugvctd">
          {/* Header */}
          <div className="cl-header cl-internal-qo3qk7">
            <div className="cl-internal-1pr5xvn">
              <h1 className="cl-headerTitle cl-internal-190cjq9">
                Notification Settings
              </h1>
            </div>
          </div>

          {/* Workout Reminders Section */}
          <div className="cl-profileSection cl-profileSection__notifications cl-internal-1q1j6io">
            <div className="cl-profileSectionContent cl-profileSectionContent__notifications cl-internal-3baomg">
              <div style={{ position: "relative" }}>
                <div className="cl-profileSectionItemList cl-profileSectionItemList__notifications cl-internal-1ud02r1" style={{ position: "relative" }}>
                  {/* Push Notifications Toggle */}
                  <div className="cl-profileSectionItem cl-profileSectionItem__notifications cl-internal-bhdl4g">
                    <div className="cl-internal-145rg42 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 rounded-md p-2 -m-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <p className="cl-internal-bolkfx font-medium text-gray-900 dark:text-gray-100">
                            Enable push notifications
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {!isSupported
                              ? "Push notifications are not supported in this browser"
                              : permission === 'denied'
                                ? "Notifications blocked. Enable in browser settings."
                                : "Receive reminders about your scheduled workouts"}
                          </p>
                          {pushError && (
                            <p className="text-sm text-red-500 mt-1">{pushError}</p>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          {isSubscribed && (
                            <span className="cl-badge cl-internal-zpbffa" data-color="primary">
                              Enabled
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={!isSupported || permission === 'denied' || isPushLoading}
                            className={`
                              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                              ${!isSupported || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
                              ${isSubscribed
                                ? 'bg-blue-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                              }
                            `}
                            onClick={handlePushToggle}
                            aria-label="Toggle push notifications"
                          >
                            {isPushLoading ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                              </span>
                            ) : (
                              <span
                                className={`
                                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                  ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
                                `}
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workout Reminders Toggle */}
                  <div className="cl-profileSectionItem cl-profileSectionItem__notifications cl-internal-bhdl4g">
                    <div className="cl-internal-145rg42 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 rounded-md p-2 -m-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <p className="cl-internal-bolkfx font-medium text-gray-900 dark:text-gray-100">
                            Daily workout reminders
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Get notified when you have a training session scheduled
                          </p>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          {preferences.workout_reminders_enabled && (
                            <span className="cl-badge cl-internal-zpbffa" data-color="primary">
                              Enabled
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={!isSubscribed || isLoading}
                            className={`
                              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                              ${!isSubscribed ? 'opacity-50 cursor-not-allowed' : ''}
                              ${preferences.workout_reminders_enabled
                                ? 'bg-blue-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                              }
                            `}
                            onClick={handleReminderToggle}
                            aria-label="Toggle workout reminders"
                          >
                            <span
                              className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                ${preferences.workout_reminders_enabled ? 'translate-x-5' : 'translate-x-0'}
                              `}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reminder Time Picker */}
                  <div className="cl-profileSectionItem cl-profileSectionItem__notifications cl-internal-bhdl4g">
                    <div className="cl-internal-145rg42 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 rounded-md p-2 -m-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <p className="cl-internal-bolkfx font-medium text-gray-900 dark:text-gray-100">
                            Reminder time
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            When should we remind you about your workouts?
                          </p>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                              type="time"
                              value={preferences.preferred_time}
                              onChange={handleTimeChange}
                              disabled={!isSubscribed || !preferences.workout_reminders_enabled || isLoading}
                              className={`
                                pl-10 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                                ${(!isSubscribed || !preferences.workout_reminders_enabled) ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div className="cl-profileSectionHeader cl-profileSectionHeader__notifications cl-internal-1ki0jhb">
              <div className="cl-profileSectionTitle cl-profileSectionTitle__notifications cl-internal-1aock5z">
                <div className="flex items-center space-x-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <p className="cl-profileSectionTitleText cl-profileSectionTitleText__notifications cl-internal-1y71s3o text-gray-900 dark:text-gray-100">
                    Workout Reminders
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner for non-subscribed users */}
          {isSupported && !isSubscribed && permission !== 'denied' && (
            <div className="mx-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Enable push notifications to receive daily reminders about your scheduled workouts.
                You&apos;ll only be notified on days when you have training planned.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
