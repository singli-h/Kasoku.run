"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useState } from "react"

export default function TestAuthPage() {
  const { getToken, userId } = useAuth()
  const { user } = useUser()
  const [token, setToken] = useState<{
    defaultToken?: string | null
    error?: string
    claims?: any
  }>({})

  const testTokens = async () => {
    try {
      console.log('Testing Clerk tokens...')
      
      // Test default token
      const defaultToken = await getToken()
      console.log('Default token:', defaultToken ? 'Available' : 'None')
      
      // Decode the token to see the claims (for debugging)
      let claims = null
      if (defaultToken) {
        try {
          const base64Url = defaultToken.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))
          claims = JSON.parse(jsonPayload)
          console.log('Token claims:', claims)
        } catch (e) {
          console.log('Could not decode token claims')
        }
      }
      
      setToken({
        defaultToken,
        claims
      })
    } catch (error) {
      console.error('Token test error:', error)
      setToken({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  if (!user) {
    return <div>Please sign in first</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Auth Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User ID:</strong> {userId}
        </div>
        
        <div>
          <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
        </div>
        
        <button
          onClick={testTokens}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Authentication
        </button>
        
        {token.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {token.error}
          </div>
        )}
        
        {token.defaultToken && (
          <div>
            <strong>Default Token:</strong> {token.defaultToken.substring(0, 50)}...
          </div>
        )}
        
        {token.claims && (
          <div className="mt-4">
            <strong>Token Claims:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm mt-2 overflow-auto">
              {JSON.stringify(token.claims, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-green-600">
          <strong>✅ Authentication Status:</strong> Using Clerk's default token with RLS policies - no Supabase template needed!
        </div>
      </div>
    </div>
  )
} 