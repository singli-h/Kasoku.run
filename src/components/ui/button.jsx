import React from "react"
import PropTypes from "prop-types"

const button = ({ 
  className,
  variant = "default",
  children,
  ...props 
}) => {
  const base = "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
  className: PropTypes.string,
}

export default button