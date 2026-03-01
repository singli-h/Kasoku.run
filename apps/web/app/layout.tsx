/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

// import {
//   createProfileAction,
//   getProfileByUserIdAction
// } from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { PostHogPageview } from "@/components/utilities/posthog/posthog-pageview"
import { PostHogUserIdentify } from "@/components/utilities/posthog/posthog-user-identity"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { GlobalErrorBoundary } from "@/components/error-boundary"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"

const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
})
const syne = localFont({
  src: "./fonts/syne-latin-wght-normal.woff2",
  variable: "--font-syne",
  display: "swap",
})
const outfit = localFont({
  src: "./fonts/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Kasoku Training Platform",
    template: "%s | Kasoku"
  },
  description: "Professional fitness and running training platform for coaches and athletes",
  keywords: ["fitness", "training", "running", "coaching", "athletes", "performance"],
  authors: [{ name: "Kasoku Team" }],
  creator: "Kasoku",
  publisher: "Kasoku",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Kasoku Training Platform",
    description: "Professional fitness and running training platform for coaches and athletes",
    siteName: "Kasoku",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kasoku Training Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kasoku Training Platform",
    description: "Professional fitness and running training platform for coaches and athletes",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kasoku",
    startupImage: [
      {
        url: "/splash/iphone5_splash.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/iphone6_splash.png", 
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/iphoneplus_splash.png",
        media: "(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphonex_splash.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphonexr_splash.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/iphonexsmax_splash.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/ipad_splash.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/ipadpro1_splash.png",
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/ipadpro3_splash.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/ipadpro2_splash.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Kasoku",
    "application-name": "Kasoku",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#000000",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

// ClerkProvider wraps the entire app, which requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// at render time. No page can be statically prerendered without it, so all routes
// must be dynamic. To enable SSG for marketing pages, they would need to be moved
// outside the ClerkProvider boundary.
export const dynamic = "force-dynamic"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Removed auth() call from root layout to fix Clerk middleware error
  // Authentication checks are handled by middleware and individual pages that need them
  
  // TODO: Implement user profile creation with Supabase
  // This should be handled in protected routes or middleware instead
  // if (userId) {
  //   const profileRes = await getProfileByUserIdAction(userId)
  //   if (!profileRes.isSuccess) {
  //     await createProfileAction({ userId })
  //   }
  // }

  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/auth/session"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={{
        userProfile: {
          elements: {
            // Hide notifications and theme tabs from Clerk UserProfile
            // Theme is handled in our own settings page
            navbarButton__notifications: { display: 'none' },
            pageRow__notifications: { display: 'none' },
            profileSection__notifications: { display: 'none' },
            profilePage__notifications: { display: 'none' }
          }
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* PWA and Mobile Optimization */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Kasoku" />
          <meta name="application-name" content="Kasoku" />
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="theme-color" content="#000000" />
          
          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
          
          {/* Favicon */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
          
          {/* Microsoft Tiles */}
          <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* Fonts are self-hosted via next/font/local - no external font requests needed */}
        </head>
        <body
          className={cn(
            "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
            inter.className,
            syne.variable,
            outfit.variable
          )}
          suppressHydrationWarning
        >
          <GlobalErrorBoundary>
            <Providers
              attribute="class"
              defaultTheme="dark"
              enableSystem={true}
              disableTransitionOnChange
            >
              <PostHogUserIdentify />
              <PostHogPageview />

              {children}

              <TailwindIndicator />

              <Toaster />
              <SpeedInsights />
            </Providers>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
