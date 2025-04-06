"use client"

import { createContext } from "react"

// This context will be replaced with Clerk authentication
export const AuthContext = createContext()

// This provider will be replaced with ClerkProvider
export function AuthProvider({ children }) {
  // Placeholder for Clerk authentication
  // Will be removed once Clerk is implemented
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}
