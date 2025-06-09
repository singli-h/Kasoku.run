export const metadata = {
  title: "Kasoku - AI-Powered Training Plans",
  description: "Transform your fitness journey with AI-powered insights, smart training plans, and real-time performance tracking.",
}

import Hero from "../../components/landing/Hero"
import Features from "../../components/landing/Features"
import Pricing from "../../components/landing/Pricing"
import About from "../../components/landing/About"

export default function Home() {
  return (
    <div className="max-w-[2000px] mx-auto relative">
      <Hero />
      <Features />
      <Pricing />
      <About />
    </div>
  )
}
