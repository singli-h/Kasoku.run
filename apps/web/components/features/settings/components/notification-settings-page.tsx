/*
<ai_context>
This component provides notification preferences that integrate with Clerk's UserProfile overlay.
Styled to exactly match Clerk's native UI structure and classes.
Now with improved theme-aware text colors.
</ai_context>
*/

"use client"

import { Bell, Mail, MessageSquare, Check } from "lucide-react"
import { useState, useEffect } from "react"

interface NotificationSettings {
  browserNotifications: boolean
  emailDigest: boolean
  taskUpdates: boolean
  aiCopilotActivity: boolean
  weeklyReport: boolean
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: true,
    emailDigest: true,
    taskUpdates: true,
    aiCopilotActivity: true,
    weeklyReport: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // TODO: Persist to backend
  }

  const notificationGroups = [
    {
      title: "Browser Notifications",
      description: "Get instant notifications in your browser",
      icon: Bell,
      settings: [
        {
          key: "browserNotifications" as const,
          label: "Enable browser notifications",
          description: "Receive real-time alerts for important updates"
        }
      ]
    },
    {
      title: "Email Notifications", 
      description: "Stay updated via email",
      icon: Mail,
      settings: [
        {
          key: "emailDigest" as const,
          label: "Daily email digest",
          description: "Get a summary of your tasks and activities"
        },
        {
          key: "weeklyReport" as const,
          label: "Weekly progress report",
          description: "Receive weekly insights and productivity metrics"
        }
      ]
    },
    {
      title: "Activity Notifications",
      description: "Get notified about specific activities",
      icon: MessageSquare,
      settings: [
        {
          key: "taskUpdates" as const,
          label: "Task status changes",
          description: "When tasks are completed or updated"
        },
        {
          key: "aiCopilotActivity" as const,
          label: "AI Copilot interactions",
          description: "When AI provides suggestions or completes analysis"
        }
      ]
    }
  ]

  return (
    <div className="cl-pageScrollBox 🔒️ cl-internal-1una0r3">
      <div className="cl-page 🔒️ cl-internal-1jipkho">
        <div className="cl-profilePage cl-profilePage__notifications 🔒️ cl-internal-1ugvctd">
          {/* Header */}
          <div className="cl-header 🔒️ cl-internal-qo3qk7">
            <div className="cl-internal-1pr5xvn">
              <h1 className="cl-headerTitle 🔒️ cl-internal-190cjq9">
                Notification Settings
              </h1>
            </div>
          </div>

          {/* Notification Groups */}
          {notificationGroups.map((group) => {
            const IconComponent = group.icon
            return (
              <div key={group.title} className="cl-profileSection cl-profileSection__notifications 🔒️ cl-internal-1q1j6io">
                <div className="cl-profileSectionContent cl-profileSectionContent__notifications 🔒️ cl-internal-3baomg">
                  <div style={{ position: "relative" }}>
                    <div className="cl-profileSectionItemList cl-profileSectionItemList__notifications 🔒️ cl-internal-1ud02r1" style={{ position: "relative" }}>
                      {group.settings.map((setting) => (
                        <div
                          key={setting.key}
                          className="cl-profileSectionItem cl-profileSectionItem__notifications 🔒️ cl-internal-bhdl4g"
                        >
                          <div className="cl-internal-145rg42 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 rounded-md p-2 -m-2">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1">
                                <p className="cl-internal-bolkfx font-medium text-gray-900 dark:text-gray-100">
                                  {setting.label}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {setting.description}
                                </p>
                              </div>
                              <div className="ml-4 flex items-center space-x-3">
                                {settings[setting.key] && (
                                  <span className="cl-badge 🔒️ cl-internal-zpbffa" data-color="primary">
                                    Enabled
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={`
                                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                    ${settings[setting.key] 
                                      ? 'bg-blue-600' 
                                      : 'bg-gray-200 dark:bg-gray-700'
                                    }
                                  `}
                                  onClick={() => updateSetting(setting.key, !settings[setting.key])}
                                  aria-label={`Toggle ${setting.label}`}
                                >
                                  <span
                                    className={`
                                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                      ${settings[setting.key] ? 'translate-x-5' : 'translate-x-0'}
                                    `}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Section Header */}
                <div className="cl-profileSectionHeader cl-profileSectionHeader__notifications 🔒️ cl-internal-1ki0jhb">
                  <div className="cl-profileSectionTitle cl-profileSectionTitle__notifications 🔒️ cl-internal-1aock5z">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-5 w-5 items-center justify-center">
                        <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <p className="cl-profileSectionTitleText cl-profileSectionTitleText__notifications 🔒️ cl-internal-1y71s3o text-gray-900 dark:text-gray-100">
                        {group.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 