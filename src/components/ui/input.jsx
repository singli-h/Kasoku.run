import React from "react"

const Input = React.forwardRef(({ className = "", type, variant = "default", ...props }, ref) => {
  // Special styles for date inputs
  const dateInputStyles = type === "date" ? "calendar-icon-large px-3 pr-2" : "";

  const variants = {
    default: `
      bg-white 
      border-gray-300 
      text-gray-900 
      placeholder:text-gray-500
      focus:border-blue-500 
      focus:ring-blue-500/20
    `,
    dark: `
      bg-white/[0.07] 
      border-white/10 
      text-white 
      placeholder:text-white/40
      focus:border-blue-500 
      focus:ring-blue-500/20
    `,
  };

  return (
    <input
      className={`
        h-10 
        px-3 
        shadow-sm 
        focus:ring-2 
        block 
        w-full 
        text-sm 
        rounded-lg 
        border 
        transition-colors 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${dateInputStyles} 
        ${className}
      `}
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
    filter: ${props => props.variant === 'dark' ? 'invert(1)' : 'none'};
  }
  
  .calendar-icon-large::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`

export { Input, dateInputStyles }

