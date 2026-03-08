/*
<ai_context>
This client component provides the providers for the app.
</ai_context>
*/

"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"
import { CSPostHogProvider } from "./posthog/posthog-provider"
import { QueryProvider } from "./providers/query-provider"
import { UserRoleProvider } from "@/contexts/user-role-context"

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>
        <QueryProvider>
          <UserRoleProvider>
            <CSPostHogProvider>{children}</CSPostHogProvider>
          </UserRoleProvider>
        </QueryProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
