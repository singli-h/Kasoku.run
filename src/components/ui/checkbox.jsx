import React from "react"

const Checkbox = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <input
      type="checkbox"
      className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded ${className}`}
      ref={ref}
      {...props}
    />
  )
})

Checkbox.displayName = "Checkbox"

export default Checkbox

