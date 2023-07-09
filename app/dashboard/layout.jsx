"use client"

export default function DefaultLayout({ children }) {
  return (
    <>
      <main>
        <div className="pt-32 pb-10 md:pt-32 md:pb-16">{children}</div>
      </main>
    </>
  )
}
