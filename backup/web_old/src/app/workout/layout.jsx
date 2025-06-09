"use client"

export default function DefaultLayout({ children }) {
  return (
    <>
      <main>
        <div className="pt-16 pb-10 md:pt-16 md:pb-16">{children}</div>
      </main>
    </>
  )
}
