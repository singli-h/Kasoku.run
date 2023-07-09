"use client"

import { createContext, useState } from "react"

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [username, setUsername] = useState("")
  const [isLogin, setIsLogin] = useState(false) // initial value

  const login = (username) => {
    setUsername(username)

    setIsLogin(true)
  }

  const logout = () => {
    setUsername(null)

    setIsLogin(false)
  }

  return (
    <AuthContext.Provider value={{ isLogin, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
