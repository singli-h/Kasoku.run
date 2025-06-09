"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva(
  "scroll-m-20 font-semibold tracking-tight",
  {
    variants: {
      variant: {
        h1: "text-4xl lg:text-5xl",
        h2: "pb-2 text-3xl first:mt-0",
        h3: "text-2xl",
        h4: "text-xl",
        h5: "text-lg",
        h6: "text-base",
      },
    },
    defaultVariants: {
      variant: "h2",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  asChild?: boolean
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, as, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : as || variant || "h2"
    return (
      <Comp
        className={cn(headingVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants } 