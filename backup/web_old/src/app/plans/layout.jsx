export default function PlansLayout({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--page-background)' }} className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 