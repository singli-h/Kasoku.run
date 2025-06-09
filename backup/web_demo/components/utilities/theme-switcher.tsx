/*
<ai_context>
This client component provides a theme switcher for the app.
</ai_context>
*/

"use client"

import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { HTMLAttributes, ReactNode, useEffect, useState } from "react"

interface ThemeSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export const ThemeSwitcher = ({ children, ...props }: ThemeSwitcherProps) => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (newTheme: "dark" | "light") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme)
    }
    setTheme(newTheme)
  }

  // Return a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          "p-1 hover:cursor-pointer hover:opacity-50",
          props.className
        )}
      >
        <Sun className="size-6" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "p-1 hover:cursor-pointer hover:opacity-50",
        props.className
      )}
      onClick={() => handleChange(theme === "light" ? "dark" : "light")}
    >
      {theme === "dark" ? (
        <Moon className="size-6" />
      ) : (
        <Sun className="size-6" />
      )}
    </div>
  )
}
