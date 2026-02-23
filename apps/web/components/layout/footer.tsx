/*
<ai_context>
Footer component for the Kasoku marketing site.
Clean, minimal design with Kasoku branding.
</ai_context>
*/

"use client"

import { BrainCircuit } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-foreground">
                Kasoku
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              AI-powered training platform for athletes and coaches.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Kasoku. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
