const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { _dev, _isServer }) => {
    // Redirect Radix useEffectEvent to our custom shim
    config.resolve.alias['@radix-ui/react-use-effect-event'] = path.join(__dirname, 'src/polyfills/radixUseEffectEvent.js');
    return config;
  },
  // This ensures Next.js can be correctly deployed as part of a monorepo
  // Temporarily commented out to fix build issues
  // output: 'standalone',
}

module.exports = nextConfig
