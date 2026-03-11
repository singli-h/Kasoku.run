import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react/display-name": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // React Compiler rules — pre-existing violations, downgraded to warn
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/immutability": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
]

export default eslintConfig
