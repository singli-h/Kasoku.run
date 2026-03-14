import dynamic from "next/dynamic"
import Hero from "@/components/features/landing/hero"

const SocialProof = dynamic(() => import("@/components/features/landing/social-proof"))
const ProductShowcase = dynamic(() => import("@/components/features/landing/product-showcase"))
const Features = dynamic(() => import("@/components/features/landing/features"))
const FAQ = dynamic(() => import("@/components/features/landing/faq"))
const CTA = dynamic(() => import("@/components/features/landing/cta"))

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
