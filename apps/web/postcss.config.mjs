/*
<ai_context>
Configures PostCSS for the app.
</ai_context>
*/

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {}
  }
}

export default config
