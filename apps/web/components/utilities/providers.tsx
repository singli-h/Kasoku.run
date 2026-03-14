/*
<ai_context>
This client component provides the providers for the app.
</ai_context>
*/

"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"
import { QueryProvider } from "./providers/query-provider"

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
