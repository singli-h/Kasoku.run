import React from "react"

const Input = React.forwardRef(({ className = "", type, ...props }, ref) => {
  // Special styles for date inputs
  const dateInputStyles = type === "date" ? 
    "calendar-icon-large px-3 pr-2" : "";

  return (
    <input
      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${dateInputStyles} ${className}`}
      ref={ref}
      type={type}
      {...props}
    />
  )
})

Input.displayName = "Input"

// Add this style to your global CSS or a style element somewhere at the root 
const dateInputStyles = `
  .calendar-icon-large::-webkit-calendar-picker-indicator {
    transform: scale(1.5);
    margin-right: 8px;
    cursor: pointer;
    opacity: 0.7;
  }
  
  .calendar-icon-large::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`

export { Input, dateInputStyles }

