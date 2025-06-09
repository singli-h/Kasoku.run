/*
<ai_context>
This client component provides the header for the GuideLayer AI app.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { BrainCircuit, LayoutDashboard, Menu, X, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "../../utilities/theme-switcher"

const navLinks = [
  { href: "#benefits", label: "Benefits" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" }
]

const featureLinks = [
  { href: "#features", label: "AI Features", description: "Powerful AI tools for collaboration" },
  { href: "#how-it-works", label: "How It Works", description: "Step-by-step process" },
  { href: "#browser-extension", label: "Browser Extension", description: "Works with your existing tools" },
  { href: "#problem-solution", label: "Problems We Solve", description: "Common VA challenges addressed" }
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between p-4">
        <div className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BrainCircuit className="size-5 text-white" />
          </div>
          <Link href="/" className="text-xl font-bold text-slate-800 dark:text-slate-100">
            GuideLayer AI
          </Link>
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 space-x-2 font-semibold md:flex items-center">
          {/* Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="rounded-full px-3 py-1 hover:opacity-80 flex items-center gap-1"
              >
                Features <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              {featureLinks.map((link, index) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="flex flex-col items-start p-3 cursor-pointer">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {link.label}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {link.description}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Regular Navigation Links */}
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 hover:opacity-80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeSwitcher />

          <SignedOut>
            <SignInButton>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Login</Button>
            </SignInButton>

            <SignUpButton>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="hidden items-center gap-2 sm:flex">
                <LayoutDashboard className="size-4" />
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="bg-primary-foreground p-4 text-primary md:hidden">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block hover:underline"
                onClick={toggleMenu}
              >
                Home
              </Link>
            </li>
            
            {/* Mobile Features Section */}
            <li>
              <div className="font-semibold text-slate-800 dark:text-slate-100 py-2">Features</div>
              <ul className="ml-4 space-y-1">
                {featureLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block text-sm hover:underline"
                      onClick={toggleMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block hover:underline"
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
