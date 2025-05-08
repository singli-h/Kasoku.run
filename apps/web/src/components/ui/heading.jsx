import React from 'react'

/**
 * Heading component for consistent page titles.
 * size: 'sm' | 'md' | 'lg' (default 'md')
 */
export function Heading({ size = 'md', children, className = '', ...props }) {
  let textSize = 'text-2xl'
  if (size === 'sm') textSize = 'text-lg'
  if (size === 'lg') textSize = 'text-3xl'

  return (
    <h1 className={`${textSize} font-bold ${className}`} {...props}>
      {children}
    </h1>
  )
} 