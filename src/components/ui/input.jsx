import React from "react"

const Input = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <input
      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${className}`}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }

