"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface TextProps {
  children: ReactNode
  className?: string
  contrast?: "high" | "medium" | "low"
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
  weight?: "normal" | "medium" | "semibold" | "bold"
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
}

/**
 * Enhanced text component with built-in dark theme visibility improvements
 * Follows WCAG AA accessibility standards for contrast ratios
 */
export function Text({ 
  children, 
  className,
  contrast = "high",
  size = "base",
  weight = "normal",
  as: Component = "p"
}: TextProps) {
  const contrastClasses = {
    high: "text-foreground/95 dark:text-foreground/95",
    medium: "text-foreground/80 dark:text-foreground/85",
    low: "text-muted-foreground dark:text-muted-foreground"
  }

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm", 
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl"
  }

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  }

  return (
    <Component 
      className={cn(
        contrastClasses[contrast],
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * Predefined text components for common use cases
 */
export const Heading = ({ children, level = 1, className, ...props }: 
  Omit<TextProps, "as"> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
) => (
  <Text 
    as={`h${level}` as any}
    contrast="high"
    weight="bold"
    size={level <= 2 ? "3xl" : level <= 4 ? "xl" : "lg"}
    className={className}
    {...props}
  >
    {children}
  </Text>
)

export const Paragraph = ({ children, className, ...props }: Omit<TextProps, "as">) => (
  <Text as="p" contrast="medium" className={className} {...props}>
    {children}
  </Text>
)

export const Caption = ({ children, className, ...props }: Omit<TextProps, "as" | "size">) => (
  <Text as="span" contrast="low" size="sm" className={className} {...props}>
    {children}
  </Text>
) 