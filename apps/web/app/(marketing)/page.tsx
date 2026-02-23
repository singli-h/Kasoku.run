import { Hero, Features, CTA, FAQ } from "@/components/features/landing"

export const metadata = {
  title: "Kasoku - AI-Powered Training Platform",
  description: "AI-powered workout logging, periodized training plans, and real-time coaching for athletes and coaches.",
}

export default async function RootPage() {
  return (
    <div className="relative">
      <Hero />
      <Features />
      <FAQ />
      <CTA />
    </div>
  )
}
