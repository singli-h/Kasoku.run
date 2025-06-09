/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "cdn.prod.website-files.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "via.placeholder.com" }
    ]
  }
}

export default nextConfig
