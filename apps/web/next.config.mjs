/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable ESLint during builds - ignoring errors is bad practice
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable TypeScript checks during builds - ignoring errors is bad practice
    ignoreBuildErrors: false,
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
  // Note: dynamicIO experimental feature removed - not available in current Next.js version
  // Disable styled-jsx completely - we use Tailwind CSS
  compiler: {
    styledJsx: false,
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
