"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface BackToTopButtonProps {
  className?: string
  threshold?: number
}

export function BackToTopButton({ 
  className, 
  threshold = 400 
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)

    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50",
        "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
        "transition-all duration-200 ease-in-out",
        "hover:scale-105 active:scale-95",
        className
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
