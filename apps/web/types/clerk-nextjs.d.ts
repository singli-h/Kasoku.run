declare module '@clerk/nextjs/server' {
  // Minimal type shims to satisfy TypeScript in this workspace.
  // Clerk provides its own types; if resolution fails locally, we fall back to 'any'.
  export const auth: any
  export const currentUser: any
  export const clerkClient: any
  export const createRouteMatcher: any
}


