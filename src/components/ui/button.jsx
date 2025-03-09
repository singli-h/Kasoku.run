/**
 * Button Component
 * 
 * A reusable button component with multiple style variants.
 * Supports custom className injection and forwards all additional props.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes to apply
 * @param {('default'|'outline')} [props.variant='default'] - Button style variant
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.props - Additional props to spread to button element
 * 
 * Variants:
 * - default: Solid blue background with white text
 * - outline: White background with gray border
 * 
 * Features:
 * - Responsive padding and rounded corners
 * - Hover state transitions
 * - Flex layout for content alignment
 * - Gap spacing for icon + text combinations
 */

import React from "react"
import PropTypes from "prop-types"

const Button = ({ 
  className = "",
  variant = "default",
  children,
  ...props 
}) => {
  // Base styles applied to all button variants
  const base = "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"

  // Style configurations for different button variants
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",  // Primary action button
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",  // Secondary action button
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

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outline']),  // Restrict to valid variants
  className: PropTypes.string,
}

// Default props for optional parameters
Button.defaultProps = {
  variant: 'default',
  className: '',
}

export { Button }
export default Button