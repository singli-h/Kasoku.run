import React from "react"

const Tabs = ({ children, value, onValueChange }) => {
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

const TabsList = ({ children, className = "", ...props }) => {
  return (
    <div className={`flex space-x-1 rounded-xl bg-blue-900/20 p-1 ${className}`} {...props}>
      {children}
    </div>
  )
}

const TabsTrigger = ({ children, value, className = "", ...props }) => {
  const isActive = value === props.value
  return (
    <button
      className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
        isActive ? "bg-white shadow" : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ children, value, className = "", ...props }) => {
  const isActive = value === props.value
  if (!isActive) return null
  return (
    <div className={`rounded-xl bg-white p-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

