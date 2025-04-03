"use client"

export default function DefaultLayout({ children }) {
  return (
    <>
      <main>
        <div className="min-h-screen bg-gray-900">{children}</div>
      </main>
    </>
  )
}
