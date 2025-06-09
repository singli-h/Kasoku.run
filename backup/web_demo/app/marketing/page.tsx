/*
<ai_context>
This server page is the marketing homepage for GuideLayer AI.
This page is now accessible at /marketing instead of the root route.
</ai_context>
*/

"use server"

import { AboutSection } from "@/components/marketing/landing/about"
import { BenefitsSection } from "@/components/marketing/landing/benefits"
import { BrowserExtensionSection } from "@/components/marketing/landing/browser-extension"
import { ContactSection } from "@/components/marketing/landing/contact"
import { CTASection } from "@/components/marketing/landing/cta"
import { FeaturesSection } from "@/components/marketing/landing/features"
import { HeroSection } from "@/components/marketing/landing/hero"
import { HowItWorksSection } from "@/components/marketing/landing/how-it-works"
import { PricingSection } from "@/components/marketing/landing/pricing"
import { ProblemSolutionSection } from "@/components/marketing/landing/problem-solution"

export default async function MarketingPage() {
  return (
    <div>
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BrowserExtensionSection />
      <BenefitsSection />
      <AboutSection />
      <PricingSection />
      <ContactSection />
      <CTASection />
    </div>
  )
} 