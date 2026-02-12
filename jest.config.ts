import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/web'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'apps/web/tsconfig.json',
      diagnostics: false,
    }],
  },
}

export default config
