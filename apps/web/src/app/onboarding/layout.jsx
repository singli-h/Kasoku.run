"use client"

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#1A1F2E] to-[#0A0F1C] flex items-center justify-center py-16">
      <main className="w-full">
        {children}
      </main>
    </div>
  )
} 