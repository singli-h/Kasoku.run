/*
<ai_context>
This component provides theme toggle settings that integrate with Clerk's UserProfile overlay.
Styled to exactly match Clerk's native UI structure and classes.
Now with improved theme-aware text colors.
</ai_context>
*/

"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, Check } from "lucide-react"
import { useState, useEffect } from "react"

export function ThemeSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Clean, bright interface for daytime use"
    },
    {
      value: "dark", 
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes for low-light environments"
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Automatically match your device settings"
    }
  ]

  return (
    <div className="cl-pageScrollBox 🔒️ cl-internal-1una0r3">
      <div className="cl-page 🔒️ cl-internal-1jipkho">
        <div className="cl-profilePage cl-profilePage__theme 🔒️ cl-internal-1ugvctd">
          {/* Header */}
          <div className="cl-header 🔒️ cl-internal-qo3qk7">
            <div className="cl-internal-1pr5xvn">
              <h1 className="cl-headerTitle 🔒️ cl-internal-190cjq9">
                Theme Settings
              </h1>
            </div>
          </div>

          {/* Theme Selection Section */}
          <div className="cl-profileSection cl-profileSection__theme 🔒️ cl-internal-1q1j6io">
            <div className="cl-profileSectionContent cl-profileSectionContent__theme 🔒️ cl-internal-3baomg">
              <div style={{ position: "relative" }}>
                <div className="cl-profileSectionItemList cl-profileSectionItemList__theme 🔒️ cl-internal-1ud02r1" style={{ position: "relative" }}>
                  {themes.map((themeOption) => {
                    const IconComponent = themeOption.icon
                    const isSelected = theme === themeOption.value
                    
                    return (
                      <div
                        key={themeOption.value}
                        className="cl-profileSectionItem cl-profileSectionItem__theme 🔒️ cl-internal-bhdl4g"
                      >
                        <button
                          onClick={() => setTheme(themeOption.value)}
                          className={`
                            w-full text-left p-4 rounded-lg border transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`
                                flex h-10 w-10 items-center justify-center rounded-full
                                ${isSelected 
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }
                              `}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="cl-internal-bolkfx font-medium text-gray-900 dark:text-gray-100">
                                    {themeOption.label}
                                  </p>
                                  {isSelected && (
                                    <span className="cl-badge 🔒️ cl-internal-zpbffa" data-color="primary">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {themeOption.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Section Header */}
            <div className="cl-profileSectionHeader cl-profileSectionHeader__theme 🔒️ cl-internal-1ki0jhb">
              <div className="cl-profileSectionTitle cl-profileSectionTitle__theme 🔒️ cl-internal-1aock5z">
                <p className="cl-profileSectionTitleText cl-profileSectionTitleText__theme 🔒️ cl-internal-1y71s3o text-gray-900 dark:text-gray-100">
                  Appearance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 