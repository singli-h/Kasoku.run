import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Force dynamic rendering to avoid styled-jsx context issues
export const dynamic = 'force-dynamic'

export default function Error500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Server Error</h2>
        <p className="text-gray-600 mb-8">
          Something went wrong on our end. Please try again later.
        </p>
        <Link href="/">
          <Button>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
} 