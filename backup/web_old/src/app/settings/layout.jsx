import { Suspense } from 'react'

export default function SettingsLayout({ children }) {
  return (
    <div className="flex-1">
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </div>
  )
} 