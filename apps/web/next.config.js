const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Redirect Radix useEffectEvent to our custom shim
    config.resolve.alias['@radix-ui/react-use-effect-event'] = path.join(__dirname, 'src/polyfills/radixUseEffectEvent.js');
    return config;
  },
  // This ensures Next.js can be correctly deployed as part of a monorepo
  output: 'standalone',
}

module.exports = nextConfig
