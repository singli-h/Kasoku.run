/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds temporarily
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds temporarily  
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Force dynamic rendering for all pages - fitness apps need real-time data
  // This ensures we don't have stale data on the frontend
  // experimental: {
  //   dynamicIO: true,
  // },
  // Disable styled-jsx completely - we use Tailwind CSS
  compiler: {
    styledJsx: false,
  },
}

export default nextConfig
