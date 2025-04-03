/**
 * Header Component
 * 
 * A responsive navigation header that stays fixed at the top of the page.
 * Features a logo, navigation links, and authentication buttons.
 * Includes a frosted glass effect with backdrop blur.
 * 
 * Styling:
 * - Fixed positioning with z-index for overlay
 * - Semi-transparent white background with blur effect
 * - Responsive design with mobile considerations
 * - Smooth hover transitions
 * 
 * @component
 */

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import Button from "../ui/button"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      {/* Main navigation container with responsive padding */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo section */}
          <Link href="/" className="flex-shrink-0">
            <Image 
              className="h-8 w-auto" 
              src="/logo.svg" 
              alt="RunningApp"
              width={32}
              height={32}
              priority
            />
          </Link>

          {/* Desktop navigation links - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
          </div>

          {/* Authentication buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button 
                variant="outline" 
                className="px-4 py-2"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                className="px-4 py-2"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="#features"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header