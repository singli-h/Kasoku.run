/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are no longer experimental in Next.js 14
  // experimental: {
  //   serverActions: true,
  // },
  // This ensures Next.js can be correctly deployed as part of a monorepo
  output: 'standalone',
}

module.exports = nextConfig
