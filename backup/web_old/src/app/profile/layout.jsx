import { Suspense } from 'react'

export default function ProfileLayout({ children }) {
  return (
    <div className="flex-1">
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </div>
  )
} 