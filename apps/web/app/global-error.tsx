'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Error</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
} 