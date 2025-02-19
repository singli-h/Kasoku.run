import React from "react"
import PropTypes from "prop-types"
import Button from "../ui/button"

export default function Header() {
  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <img className="h-8 w-auto" src="/logo.svg" alt="Your Company" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="px-4 py-2">
              Sign In
            </Button>
            <Button className="px-4 py-2">
              Get Started
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}