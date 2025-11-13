declare module 'posthog-js' {
  const posthog: any
  export default posthog
}

declare module 'posthog-js/react' {
  export const PostHogProvider: any
}
