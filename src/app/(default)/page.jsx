export const metadata = {
  title: "Runner Tracker",
  description: "Welcome to my Homepage!",
}

import Hero from "../../components/landing/Hero"

export default function Home() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <Hero />
      </div>
    </>
  )
}
