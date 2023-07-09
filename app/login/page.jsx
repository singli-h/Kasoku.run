"use client"

export const metadata = {
  title: "Login",
}

import React, { useState } from "react"
import Button from "@/components/common/Button"

const Page = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    // implement login service
  }

  return (
    <div>
      <div className="max-w-lg mx-auto justify-center">
        <form onSubmit={handleSubmit} className="m-5">
          <div className="flex flex-col mb-6">
            <label
              htmlFor="username"
              className="mb-1 text-xs sm:text-sm tracking-wide text-gray-400"
            >
              Username
            </label>
            <input
              id="username"
              className="py-3 px-4 bg-gray-800 border-2 rounded-lg border-gray-600 placeholder-gray-400"
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col mb-6">
            <label
              htmlFor="password"
              className="mb-1 text-xs sm:text-sm tracking-wide text-gray-400"
            >
              Password
            </label>
            <input
              id="password"
              className="py-3 px-4 bg-gray-800 border-2 rounded-lg border-gray-600 placeholder-gray-400"
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-center items-center">
            <Button type="submit">Login</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Page
