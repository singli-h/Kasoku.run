"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface BackToTopButtonProps {
  className?: string
  threshold?: number
  /** When true, uses relative positioning (for use inside flex containers) */
  relative?: boolean
}

export function BackToTopButton({
  className,
  threshold = 400,
  relative = false
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
        "h-14 w-14 rounded-full shadow-md",
        "bg-secondary text-secondary-foreground border border-border",
        "hover:bg-secondary/90",
        "transition-all duration-200 ease-in-out",
        "hover:scale-105 active:scale-95",
        !relative && "fixed bottom-24 right-6 z-40",
        className
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
