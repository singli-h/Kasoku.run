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

import React from "react"
import Image from "next/image"
import Button from "../ui/button"

const Header = () => {
  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      {/* Main navigation container with responsive padding */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo section */}
          <div className="flex-shrink-0">
            <Image 
              className="h-8 w-auto" 
              src="/logo.svg" 
              alt="RunningApp"
              width={32}
              height={32}
              priority
            />
          </div>

          {/* Desktop navigation links - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </a>
          </div>

          {/* Authentication buttons */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="px-4 py-2"
            >
              Sign In
            </Button>
            <Button 
              className="px-4 py-2"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header