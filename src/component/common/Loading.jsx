import React from "react"
import { FaSpinner } from "react-icons/fa"

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <FaSpinner className="animate-spin text-3xl text-purple-500" />
      <p className="text-gray-700 font-semibold">We are working on it...</p>
    </div>
  )
}

export default Loading
