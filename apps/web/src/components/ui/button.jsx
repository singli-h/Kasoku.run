/**
 * Button Component
 * 
 * A reusable button component with multiple style variants.
 * Supports custom className injection and forwards all additional props.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes to apply
 * @param {('default'|'outline'|'destructive'|'subtle-destructive')} [props.variant='default'] - Button style variant
 * @param {('default'|'sm'|'lg'|'icon')} [props.size='default'] - Button size variant
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.props - Additional props to spread to button element
 * 
 * Variants:
 * - default: Solid blue background with white text
 * - outline: White background with gray border
 * - destructive: Red background with white text
 * - subtle-destructive: Light red background with red text for a softer destructive action
 * 
 * Sizes:
 * - default: Standard padding
 * - sm: Smaller padding for compact buttons
 * - lg: Larger padding for prominent buttons
 * - icon: Square button optimized for icon-only content
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
  size = "default",
  children,
  ...props 
}) => {
  // Base styles applied to all button variants
  const base = "rounded-lg font-medium transition-all flex items-center justify-center gap-2"

  // Style configurations for different button variants
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",  // Primary action button
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",  // Secondary action button
    destructive: "bg-red-600 text-white hover:bg-red-700", // Destructive action button
    "subtle-destructive": "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100", // Softer destructive action
  }

  // Size configurations
  const sizes = {
    default: "px-6 py-3",
    sm: "px-3 py-2 text-sm",
    lg: "px-8 py-4 text-lg",
    icon: "p-2 h-9 w-9", // Square button optimized for icons
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outline', 'destructive', 'subtle-destructive']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  className: PropTypes.string,
}

// Default props for optional parameters
Button.defaultProps = {
  variant: 'default',
  size: 'default',
  className: '',
}

export { Button }
export default Button