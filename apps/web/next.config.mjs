/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable TypeScript checks during builds - ignoring errors is bad practice
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  transpilePackages: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  // Force dynamic rendering for all pages - fitness apps need real-time data
  // This ensures we don't have stale data on the frontend
  // Note: dynamicIO experimental feature removed - not available in current Next.js version
  // Disable styled-jsx completely - we use Tailwind CSS
  compiler: {
    styledJsx: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', '@radix-ui/react-icons', 'date-fns'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Bundle analyzer (uncomment when needed for analysis)
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   if (!dev && !isServer) {
  //     config.plugins.push(
  //       new webpack.DefinePlugin({
  //         __BUNDLE_ANALYZER__: JSON.stringify(process.env.ANALYZE === 'true'),
  //       })
  //     );
  //   }
  //   return config;
  // },
}

export default nextConfig
