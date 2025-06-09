const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './apps/web/',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/apps/web/src'], // Adjust if your tests are elsewhere
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    'lucide-react': '<rootDir>/__mocks__/lucide-react.js',
    'uuid': '<rootDir>/__mocks__/uuid.js' // Mock uuid
  },
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
  ],
  // Remove transformIgnorePatterns as problematic ESM modules are now mocked
  transformIgnorePatterns: [
    '/node_modules/', // Default behavior: ignore all node_modules
    '^.+\\\\.module\\\\.(css|sass|scss)$' // Keep if you use CSS modules and they need special handling
  ],
  // If you have other TypeScript projects in the monorepo, you might need to adjust tsconfig paths
  // or ensure that ts-jest (if still needed for some parts) uses the correct tsconfig.
  // However, next/jest should handle most TS/TSX transformation.
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

// Original config for reference (to be replaced by the above)
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'jest-environment-jsdom',
//   roots: ['<rootDir>/apps/web/src'], // Adjust if your tests are elsewhere
//   // globals: {
//   //   'ts-jest': {
//   //     tsconfig: '<rootDir>/apps/web/tsconfig.json'
//   //   }
//   // },
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/apps/web/src/$1',
//     '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy'
//   },
//   setupFilesAfterEnv: [
//     '@testing-library/jest-dom' // Corrected: extend-expect is usually part of jest-dom itself
//   ],
//   transform: {
//     '^.+\\\\.(ts|tsx)$': ['ts-jest', { 
//       tsconfig: '<rootDir>/apps/web/tsconfig.json',
//       babelConfig: true,
//     }],
//     '^.+\\\\.(js|jsx)$': 'babel-jest', // Make sure you have babel-jest and necessary babel config if you use JS files
//   },
//   // If using Next.js, you might want to use the Next.js Jest configuration preset for better compatibility
//   // See: https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler
// };
