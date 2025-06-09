"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from '@clerk/nextjs'

export type UserRoleData = {
  userId: number
  role: string
  athleteId?: number
  athleteGroupId?: number
  coachId?: number
}

interface UserRoleContextValue {
  roleData: UserRoleData | null
  loading: boolean
  refresh: () => void
}

const UserRoleContext = createContext<UserRoleContextValue>({
  roleData: null,
  loading: true,
  refresh: () => {}
})

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [roleData, setRoleData] = useState<UserRoleData | null>(null)
  const [loading, setLoading] = useState(true)
  const { session, isLoaded, isSignedIn } = useSession()

  const fetchRole = async () => {
    setLoading(true)
    try {
      const token = await session?.getToken()
      const res = await fetch('/api/users/role', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const json = await res.json()
      if (res.ok && json.status === 'success') {
        setRoleData(json.data)
      } else {
        console.error('Failed to fetch user role:', json)
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchRole()
  }, [isLoaded, isSignedIn])

  return (
    <UserRoleContext.Provider value={{ roleData, loading, refresh: fetchRole }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  return useContext(UserRoleContext)
} 