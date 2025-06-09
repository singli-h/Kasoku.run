import { Hero, Features, Pricing, About } from "@/components/features/landing"

export const metadata = {
  title: "Kasoku - AI-Powered Training Plans",
  description: "Transform your fitness journey with AI-powered insights, smart training plans, and real-time performance tracking.",
}

export default async function RootPage() {
  return (
    <div className="max-w-[2000px] mx-auto relative">
      <Hero />
      <Features />
      <Pricing />
      <About />
    </div>
  )
} 