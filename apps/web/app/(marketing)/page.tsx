import Hero from "@/components/features/landing/hero"
import SocialProof from "@/components/features/landing/social-proof"
import ProductShowcase from "@/components/features/landing/product-showcase"
import Features from "@/components/features/landing/features"
import FAQ from "@/components/features/landing/faq"
import CTA from "@/components/features/landing/cta"

export const metadata = {
  title: "Kasoku - AI-Powered Training Platform",
  description: "AI-powered workout logging, periodized training plans, and real-time coaching for athletes and coaches.",
}

export default async function RootPage() {
  return (
    <div className="relative">
      <Hero />
      <SocialProof />
      <ProductShowcase />
      <Features />
      <FAQ />
      <CTA />
    </div>
  )
}
