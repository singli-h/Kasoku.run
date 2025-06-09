"use client"

import * as React from "react"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Kasoku
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/plans" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Plans
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/overview" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Overview
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            {/* Future navigation items can be added here following the same pattern */}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            {/* For the Sign In button, we can use a simple Link styled as a button,
                or if it needs to be part of the NavigationMenu for consistency,
                it would follow the same pattern as other NavigationMenuItems.
                Using a simple Link for now for clarity. */}
            <Link href="/sign-in" legacyBehavior passHref>
              <a
                className={cn(
                  navigationMenuTriggerStyle(), // Re-use the style for consistency
                  "text-sm"
                )}
              >
                Sign In
              </a>
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  )
} 