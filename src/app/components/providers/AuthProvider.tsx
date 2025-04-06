import { ReactNode } from 'react'

// This file will be replaced with Clerk provider
interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // Will be replaced with ClerkProvider
  return <>{children}</>
} 