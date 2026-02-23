/*
<ai_context>
Marketing header for landing pages.
Clean, minimal design with Syne display font for the logo.
Orange accent for the brand and primary CTA.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { BrainCircuit, LayoutDashboard, Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "../../utilities/theme-switcher"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
]

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-background"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">
            Kasoku
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          <SignedOut>
            <div className="hidden md:flex items-center gap-2">
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Join Beta
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="hidden md:block">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-border space-y-2">
              <SignedOut>
                <SignInButton>
                  <Button variant="outline" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsMenuOpen(false)}>
                    Join Beta
                  </Button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
