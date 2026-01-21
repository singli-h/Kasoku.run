/**
 * PWA Icon Generator Script
 *
 * Generates all required PWA icons from a source image or creates
 * simple branded placeholder icons.
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/icons')

// Icon sizes needed for PWA manifest
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// Apple icon sizes
const APPLE_ICON_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180]

// Favicon sizes
const FAVICON_SIZES = [16, 32]

// Brand color (dark theme primary)
const BRAND_COLOR = '#000000'
const ACCENT_COLOR = '#FFFFFF'

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log('Generating PWA icons...')

  // Generate main PWA icons
  for (const size of ICON_SIZES) {
    await createIcon(size, `icon-${size}x${size}.png`)
  }

  // Generate Apple touch icons
  for (const size of APPLE_ICON_SIZES) {
    await createIcon(size, `apple-icon-${size}x${size}.png`)
  }

  // Generate favicons
  for (const size of FAVICON_SIZES) {
    await createIcon(size, `favicon-${size}x${size}.png`)
  }

  // Generate MS tile icon
  await createIcon(144, 'ms-icon-144x144.png')

  console.log('All icons generated successfully!')
  console.log(`Output directory: ${OUTPUT_DIR}`)
}

async function createIcon(size, filename) {
  const outputPath = path.join(OUTPUT_DIR, filename)

  // Create a simple branded icon with "K" letter
  // Using SVG as source for crisp rendering at all sizes
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BRAND_COLOR}" rx="${Math.round(size * 0.15)}"/>
      <text
        x="50%"
        y="52%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${Math.round(size * 0.55)}"
        font-weight="700"
        fill="${ACCENT_COLOR}"
        text-anchor="middle"
        dominant-baseline="middle"
      >K</text>
    </svg>
  `

  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile(outputPath)

  console.log(`  Created: ${filename} (${size}x${size})`)
}

// Run the generator
generateIcons().catch(console.error)
