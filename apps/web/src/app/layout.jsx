/**
 * Root Layout Component
 * 
 * This is the top-level layout component that wraps all pages in the application.
 * It provides common structure, styling, and context providers for the entire app.
 * 
 * Features:
 * - Global CSS imports
 * - Font configuration (Inter from Google Fonts)
 * - Clerk authentication provider
 * - Responsive layout structure
 * - Conditional rendering of header or sidebar based on route
 * - Toast notifications via ToastProvider
 */

import '@/polyfills/useEffectEventPolyfill.js';
import "./css/style.css"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import { ToastProvider } from "@/components/ui/toast"

// Dynamically import the NavigationWrapper component to avoid SSR issues
const NavigationWrapper = dynamic(() => import("../components/ui/navigationWrapper"), {
  ssr: false
})

// Configure the Inter font with Latin character subset
const inter = Inter({ subsets: ["latin"] })

/**
 * Metadata configuration for the application
 * This information is used by Next.js for SEO and document head
 */
export const metadata = {
  title: "Kasoku - Track Your Progress",
  description: "Track your running performance, set goals, and crush your personal bests with our comprehensive running tracker.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://kasoku.com' || 'http://localhost:3000'
  ),
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Kasoku - Track Your Progress",
    description: "Track your running performance, set goals, and crush your personal bests with our comprehensive running tracker.",
    images: [
      {
        url: "/logo.svg",
        width: 1024,
        height: 1024,
        alt: "Kasoku Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kasoku - Track Your Progress",
    description: "Track your running performance, set goals, and crush your personal bests with our comprehensive running tracker.",
    images: ["/logo.svg"],
    creator: "@kasoku",
  },
}

/**
 * Root Layout Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered within the layout
 * @returns {React.JSX.Element} The root layout structure
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-inter antialiased tracking-tight`} style={{ backgroundColor: 'var(--page-background)' }}>
        {/* ClerkProvider wraps the app to provide authentication */}
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
          afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
          afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
        >
          {/* ToastProvider makes toast notifications available application-wide */}
          <ToastProvider>
            {/* Main layout structure with flex column and minimum height */}
            <div className="flex flex-col min-h-screen overflow-hidden">
              {/* Client-side navigation component to conditionally render header or sidebar */}
              <NavigationWrapper>{children}</NavigationWrapper>
            </div>
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
